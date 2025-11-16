import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

// Map React HTML attribute/type names to intrinsic tag names
function mapAttrPrefixToTag(prefix) {
  const p = String(prefix).toLowerCase();
  const table = {
    anchor: 'a',
    a: 'a',
    area: 'area',
    audio: 'audio',
    button: 'button',
    canvas: 'canvas',
    details: 'details',
    dialog: 'dialog',
    div: 'div',
    embed: 'embed',
    fieldset: 'fieldset',
    form: 'form',
    h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
    iframe: 'iframe',
    img: 'img', image: 'img',
    input: 'input',
    label: 'label',
    li: 'li',
    map: 'map',
    menu: 'menu',
    meter: 'meter',
    object: 'object',
    ol: 'ol',
    option: 'option',
    optgroup: 'optgroup',
    output: 'output',
    p: 'p', paragraph: 'p',
    progress: 'progress',
    script: 'script',
    select: 'select',
    slot: 'slot',
    source: 'source',
    span: 'span',
    style: 'style',
    table: 'table',
    td: 'td', th: 'th', tr: 'tr', thead: 'thead', tbody: 'tbody', tfoot: 'tfoot',
    textarea: 'textarea',
    time: 'time',
    track: 'track',
    ul: 'ul',
    video: 'video',
  };
  if (table[p]) return table[p];
  return undefined;
}

function mapHtmlElementToTag(name) {
  const n = String(name);
  if (/^TextArea$/i.test(n) || /^Textarea$/i.test(n)) return 'textarea';
  if (/^UList$/i.test(n)) return 'ul';
  if (/^OList$/i.test(n)) return 'ol';
  if (/^LI$/i.test(n)) return 'li';
  if (/^Anchor$/i.test(n)) return 'a';
  if (/^Image$/i.test(n)) return 'img';
  return n.toLowerCase();
}

function extractOmittedKeys(text) {
  try {
    const s = String(text);
    const out = new Set();
    let idx = 0;
    while (true) {
      const start = s.indexOf('Omit<', idx);
      if (start === -1) break;
      let i = start + 'Omit<'.length;
      let depth = 1; // we've consumed the first '<'
      let lastComma = -1;
      for (; i < s.length; i++) {
        const ch = s[i];
        if (ch === '<') depth++;
        else if (ch === '>') {
          depth--;
          if (depth === 0) break; // end of this Omit<...>
        } else if (ch === ',' && depth === 1) {
          lastComma = i;
        }
      }
      if (i < s.length && lastComma !== -1) {
        const inner = s.slice(lastComma + 1, i);
        const litRE = /'([^']+)'|"([^"]+)"/g;
        let m;
        while ((m = litRE.exec(inner))) out.add(m[1] || m[2]);
      }
      idx = i + 1;
    }
    return Array.from(out);
  } catch {
    return [];
  }
}

function inferDomPassthroughFromTypeText(text) {
  try {
    const t = String(text);
    // React.ComponentProps<'div'>
    const mComp = t.match(/React\.ComponentProps<'([^']+)'>/);
    if (mComp) return { element: mComp[1], omitted: extractOmittedKeys(t) };
    // React.HTMLAttributes<HTMLElement> (generic, non-specific) → assume 'div'
    const mGeneric = t.match(/React\.HTMLAttributes\s*<\s*([^>]+)\s*>/);
    if (mGeneric) {
      const gen = mGeneric[1].trim();
      if (/^HTMLElement$/.test(gen)) return { element: 'div', omitted: extractOmittedKeys(t) };
      const mGen = gen.match(/HTML([A-Za-z]+)Element/);
      if (mGen) return { element: mapHtmlElementToTag(mGen[1]), omitted: extractOmittedKeys(t) };
    }
    // React.<X>HTMLAttributes<...>
    const mAttr = t.match(/React\.([A-Za-z]+)HTMLAttributes\s*<\s*([^>]+)\s*>/);
    if (mAttr) {
      const prefix = mAttr[1];
      const gen = mAttr[2];
      const mGen = gen.match(/HTML([A-Za-z]+)Element/);
      const fromGen = mGen ? mapHtmlElementToTag(mGen[1]) : undefined;
      const fromPrefix = mapAttrPrefixToTag(prefix);
      const el = fromGen || fromPrefix;
      if (el) return { element: el, omitted: extractOmittedKeys(t) };
    }
    // Any HTML([A-Za-z]+)Element mention
    const mHtmlEl = t.match(/HTML([A-Za-z]+)Element/);
    if (mHtmlEl) return { element: mapHtmlElementToTag(mHtmlEl[1]), omitted: extractOmittedKeys(t) };
  } catch {}
  return null;
}

function flattenTypeAliasText(t) {
  try {
    const text = t.getText();
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function collectCssVarsFromFile(sf) {
  const content = sf.getFullText();
  const vars = new Set();
  const re = /--valet-[a-z0-9-]+/gi;
  let m;
  while ((m = re.exec(content))) vars.add(m[0]);
  return Array.from(vars);
}

function guessCategoryFromPath(filePath) {
  // expects src/components/<category>/<Name>.tsx
  const parts = filePath.split(path.sep);
  const idx = parts.indexOf('components');
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  return 'unknown';
}

function slugFor(name, category) {
  return `components/${category}/${name.toLowerCase()}`;
}

/**
 * Properly resolve a component's props whether they come from
 * - interface <Name>Props { ... }
 * - type <Name>Props = { ... } | (Alias) | (Union of object types)
 * and derive required/optional from TypeScript semantics instead of
 * string regex on text. Uses ts-morph type system where needed.
 */
export function extractFromTs(projectRoot) {
  const project = new Project({ tsConfigFilePath: path.join(projectRoot, 'tsconfig.json') });
  project.addSourceFilesAtPaths(path.join(projectRoot, 'src/components/**/*.tsx'));

  /** @type {Record<string, any>} */
  const result = {};

  const files = project
    .getSourceFiles()
    .filter((sf) => sf.getFilePath().includes(`${path.sep}src${path.sep}components${path.sep}`) && sf.getFilePath().endsWith('.tsx'));
  for (const sf of files) {
    const exports = sf.getExportedDeclarations();
    // Collect all exported component names (supports multiple per file)
    const componentNames = [];
    for (const [name, decs] of exports) {
      for (const d of decs) {
        const isComponentExport =
          d.getKind() === SyntaxKind.FunctionDeclaration ||
          d.getKind() === SyntaxKind.VariableDeclaration ||
          d.getKind() === SyntaxKind.ClassDeclaration;
        if (isComponentExport && /^[A-Z]/.test(name)) {
          if (!componentNames.includes(name)) componentNames.push(name);
        }
      }
    }

    // Heuristic: add well-known nested subcomponents when present in the file.
    // Tabs.Tab / Tabs.Panel are not top-level exports; include them for MCP parity.
    try {
      if (componentNames.includes('Tabs')) {
        const hasTabProps = sf.getInterface('TabProps');
        const hasPanelProps = sf.getInterface('TabPanelProps');
        if (hasTabProps && !componentNames.includes('Tabs.Tab')) componentNames.push('Tabs.Tab');
        if (hasPanelProps && !componentNames.includes('Tabs.Panel')) componentNames.push('Tabs.Panel');
      }
    } catch {}

    // Generic nested components via displayName convention, e.g. Option.displayName = 'Select.Option'
    try {
      const text = sf.getFullText();
      const re = /\.displayName\s*=\s*'([^']+\.[^']+)'/g;
      let m;
      while ((m = re.exec(text))) {
        const nestedName = m[1];
        if (/^[A-Z]/.test(nestedName) && !componentNames.includes(nestedName)) {
          componentNames.push(nestedName);
        }
      }
    } catch {}

    if (!componentNames.length) continue;

    // Guard: ensure file contains JSX – exclude utility/contexts/constants
    const hasJsx =
      sf.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
      sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 ||
      sf.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
    if (!hasJsx) continue;

    const filePath = sf.getFilePath();
    const category = guessCategoryFromPath(filePath);
    const cssVars = collectCssVarsFromFile(sf);

    for (const componentName of componentNames) {
      // Resolve Props from interface or type alias
      // Support common patterns: <Name>Props, <Name>OwnProps
      let propsNamePrimary = `${componentName}Props`;
      const propsNameFallback = `${componentName}OwnProps`;

      // Map nested child names to their conventional props names within the file
      if (componentName.includes('.')) {
        const parts = componentName.split('.');
        const parent = parts[0];
        const last = parts[1];
        if (last === 'Tab') propsNamePrimary = 'TabProps';
        else if (last === 'Panel') propsNamePrimary = 'TabPanelProps';
        else {
          // Try to resolve by scanning for interfaces ending with <Child>Props or <Parent><Child>Props
          try {
            const allIfaces = sf.getInterfaces().map((i) => i.getName());
            const candidates = [
              `${parent}${last}Props`,
              `${last}Props`,
              `${parent}${last}OwnProps`,
              `${last}OwnProps`,
            ];
            const found = allIfaces.find((n) => candidates.includes(n)) ||
              allIfaces.find((n) => n?.endsWith(`${last}Props`));
            if (found) propsNamePrimary = found;
          } catch {}
        }
      }

      /** @type {import('./schema').ValetProp[]} */
      const props = [];
      const propSet = new Set();

      let domPassthrough = undefined;
      /** @type {Array<{ name: string; payloadType?: string }>} */
      const events = [];
      /** @type {Array<{ name: string; signature?: string }>} */
      const actions = [];
      /** @type {Array<{ name: string }>} */
      const slots = [];

    // Helper: push a prop if not seen; allow attaching description/deprecated/default via `extra`
    function pushProp(name, typeText, required, extra = {}) {
      if (!name) return;
      if (propSet.has(name)) return;
      propSet.add(name);
      const cleanType = (typeText || 'any').replace(/\s+/g, ' ').trim();
      const p = { name, type: cleanType, required, ...extra };
      props.push(p);
      // Heuristics from type string for events/slots
      if (/^on[A-Z]/.test(name) && /=>/.test(cleanType)) {
        const m = cleanType.match(/\(([^)]*)\)\s*=>/);
        const firstParam = m ? m[1].split(',')[0]?.trim() : '';
        const payload = firstParam && firstParam.includes(':') ? firstParam.split(':').slice(1).join(':').trim() : undefined;
        events.push({ name, payloadType: payload });
      }
      if (/React\.(ReactNode|ReactElement)|JSX\.Element|ReactNode|ReactElement/.test(cleanType)) {
        slots.push({ name });
      }
    }

    // 1) Prefer interface
    // Attempt to resolve interface by conventional names, or by reading the variable's FC generic
    let iface = sf.getInterface(propsNamePrimary) || sf.getInterface(propsNameFallback);
    if (!iface) {
      try {
        const decls = exports.get(componentName) || [];
        for (const d of decls) {
          if (d.getKind() !== SyntaxKind.VariableDeclaration) continue;
          const typeNode = d.getTypeNode?.();
          const tText = typeNode?.getText?.() || '';
          const m = tText.match(/React\.(FC|FunctionComponent)\s*<\s*([^>]+)\s*>/);
          if (m && m[2]) {
            const maybeName = m[2].trim().replace(/\s+/g, ' ');
            if (/Props\b/.test(maybeName)) {
              iface = sf.getInterface(maybeName) || project.getSourceFiles().map((f) => f.getInterface(maybeName)).find(Boolean);
              if (iface) break;
            }
          }
        }
      } catch {}
    }
    if (!iface) {
      // Search whole project just in case props are declared elsewhere
      for (const osf of project.getSourceFiles()) {
        const cand = osf.getInterface(propsNamePrimary) || osf.getInterface(propsNameFallback);
        if (cand) { iface = cand; break; }
      }
    }

    // Note: Do not greedily pick unrelated "*Props" interfaces in the file.
    // We only use the exact `<Name>Props` interface (if present) or fall back to the type alias path below.

    if (iface) {
      // DOM passthrough from heritage and compute omitted keys (e.g., Omit<..., 'style'>)
      const omittedFromExtends = new Set();
      for (const h of iface.getExtends()) {
        const t = h.getText();
        const inferred = inferDomPassthroughFromTypeText(t);
        if (inferred && !domPassthrough) domPassthrough = inferred;
        // Heuristic: If this is Omit<SomeProps, ...>, chase SomeProps' extends
        try {
          const m = t.match(/Omit\s*<\s*([A-Za-z0-9_]+)\s*,/);
          if (!domPassthrough && m && m[1]) {
            const targetName = m[1];
            let target = sf.getInterface(targetName);
            if (!target) {
              for (const osf of project.getSourceFiles()) {
                target = osf.getInterface(targetName);
                if (target) break;
              }
            }
            if (target) {
              for (const inh of target.getExtends()) {
                const ti = inh.getText();
                const deep = inferDomPassthroughFromTypeText(ti);
                if (deep && !domPassthrough) domPassthrough = deep;
              }
            }
          }
        } catch {}
        try {
          for (const k of extractOmittedKeys(t)) omittedFromExtends.add(k);
        } catch {}
      }

      // 1) Collect explicitly declared members on the interface
      for (const m of iface.getMembers()) {
        if (m.getKind() !== SyntaxKind.PropertySignature) continue;
        const nameNode = m.getNameNode();
        const name = nameNode.getText().replace(/\?$/, '');
        const typeNode = m.getTypeNode();
        const typeText = typeNode ? typeNode.getText() : 'any';
        // Correct required detection: use hasQuestionToken()
        const required = typeof m.hasQuestionToken === 'function' ? !m.hasQuestionToken() : !/\?$/.test(m.getText());
        // jsdoc description/deprecated/default
        let deprecated;
        let description;
        let defaultTag;
        try {
          const jsdocs = m.getJsDocs?.();
          if (jsdocs?.length) {
            description = jsdocs.map((d) => d.getComment?.() || '').join('\n').trim() || undefined;
            for (const d of jsdocs) {
              for (const tag of d.getTags?.() || []) {
                const tagName = (tag.getTagName?.() || '').toLowerCase();
                const tagTxt = (tag.getComment?.() || '').trim();
                if (tagName === 'deprecated') deprecated = true;
                if (tagName === 'default' && tagTxt) defaultTag = tagTxt;
              }
            }
          }
        } catch {}
        const extra = { ...(deprecated ? { deprecated } : {}), ...(description ? { description } : {}), ...(defaultTag ? { default: defaultTag } : {}) };
        pushProp(name, typeText, required, extra);
      }

      // 2) Safely merge inherited userland props from the resolved interface type
      //    (e.g., Pick<SpacingProps, 'gap' | 'pad'>, Presettable.preset), while
      //    filtering out DOM attributes coming from React HTML types.
      try {
        const ifaceType = iface.getType();
        const symbols = ifaceType.getProperties();
        for (const sym of symbols) {
          const name = sym.getName();
          // Skip props already collected
          if (propSet.has(name)) continue;

          // Only include userland declarations (inside project src/), to avoid
          // flooding with DOM attributes from @types/react
          const decls = sym.getDeclarations?.() || [];
          const isUserland = decls.some((d) => {
            try {
              const fp = d.getSourceFile().getFilePath();
              return fp.includes(`${path.sep}src${path.sep}`);
            } catch {
              return false;
            }
          });
          if (!isUserland) continue;
          // If this prop is omitted from DOM inheritance via Omit<...>, that's fine;
          // we still include userland definitions with the same name (e.g., base `name`).

          // Determine type text and requiredness using ts-morph APIs
          let required = true;
          try {
            if (typeof sym.isOptional === 'function' && sym.isOptional()) required = false;
            else {
              const propDecl = decls.find((d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature);
              if (propDecl && typeof propDecl.hasQuestionToken === 'function') {
                required = !propDecl.hasQuestionToken();
              }
            }
          } catch {}

          let typeText = 'any';
          try {
            const t = sym.getTypeAtLocation(iface);
            typeText = t.getText(iface);
          } catch {}

          // Attempt to pull JSDoc from the declaration site for description/default/deprecated
          let description;
          let deprecated;
          let defaultTag;
          try {
            const propDecl = decls.find((d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature);
            const jsdocs = propDecl?.getJsDocs?.() || [];
            if (jsdocs.length) {
              description = jsdocs.map((d) => d.getComment?.() || '').join('\n').trim() || undefined;
              for (const d of jsdocs) {
                for (const tag of d.getTags?.() || []) {
                  const tagName = (tag.getTagName?.() || '').toLowerCase();
                  const tagTxt = (tag.getComment?.() || '').trim();
                  if (tagName === 'deprecated') deprecated = true;
                  if (tagName === 'default' && tagTxt) defaultTag = tagTxt;
                }
              }
            }
          } catch {}

          const extra = { ...(description ? { description } : {}), ...(deprecated ? { deprecated } : {}), ...(defaultTag ? { default: defaultTag } : {}) };
          pushProp(name, typeText, required, extra);
        }
      } catch {
        // best-effort; ignore if resolution fails
      }
    } else {
      // 2) Try type alias resolution, including unions/intersections
      let aliasDecl = sf.getTypeAlias(propsNamePrimary) || sf.getTypeAlias(propsNameFallback);
      if (!aliasDecl) {
        for (const osf of project.getSourceFiles()) {
          const cand = osf.getTypeAlias(propsNamePrimary) || osf.getTypeAlias(propsNameFallback);
          if (cand) { aliasDecl = cand; break; }
        }
      }
      if (aliasDecl) {
        const aliasType = aliasDecl.getType();

        // If alias extends React.ComponentProps<'el'> via intersection, sniff text
        try {
          const text = aliasDecl.getTypeNode()?.getText() || '';
          const inferred = inferDomPassthroughFromTypeText(text);
          if (inferred && !domPassthrough) domPassthrough = inferred;
          // Heuristic: alias mentions intrinsic attribute types
          const hasInput = /InputHTMLAttributes<|HTMLInputElement/.test(text) || /HTMLInputAttributes/i.test(text);
          const hasTextarea = /TextareaHTMLAttributes<|HTMLTextAreaElement/.test(text);
          if (!domPassthrough && (hasInput || hasTextarea)) {
            domPassthrough = { element: hasInput && hasTextarea ? 'input|textarea' : hasInput ? 'input' : 'textarea', omitted: extractOmittedKeys(text) };
          }
        } catch {}

        // Collect props across alias shapes
        /** @type {Map<string, { types: Set<string>; requiredCount: number; total: number }>} */
        const agg = new Map();

        function addPropAgg(name, tText, isRequired) {
          const key = name;
          const rec = agg.get(key) || { types: new Set(), requiredCount: 0, total: 0 };
          if (tText) rec.types.add(tText.replace(/\s+/g, ' ').trim());
          rec.total += 1;
          if (isRequired) rec.requiredCount += 1;
          agg.set(key, rec);
        }

        function collectFromObjectType(t) {
          try {
            const props = t.getProperties();
            for (const sym of props) {
              const decls = sym.getDeclarations();
              // Filter to userland-only: at least one declaration under project src/
              const isUserland = (decls || []).some((d) => {
                try {
                  const fp = d.getSourceFile().getFilePath();
                  return fp.includes(`${path.sep}src${path.sep}`);
                } catch {
                  return false;
                }
              });
              if (!isUserland) continue;
              // prefer PropertySignature
              const ps = decls.find((d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature) || decls[0];
              const name = sym.getName();
              const symType = sym.getTypeAtLocation(ps || aliasDecl);
              const typeText = symType.getText(ps || aliasDecl);
              let isRequired = true;
              try {
                const propDecl = decls.find((d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature);
                if (propDecl && typeof propDecl.hasQuestionToken === 'function') {
                  isRequired = !propDecl.hasQuestionToken();
                } else if (typeof sym.isOptional === 'function') {
                  isRequired = !sym.isOptional();
                }
              } catch {}
              addPropAgg(name, typeText, !!isRequired);

              // Attach JSDoc to a temp cache on agg record via a side map key
              try {
                const jsdocs = ps?.getJsDocs?.() || [];
                if (jsdocs.length) {
                  const desc = jsdocs.map((d) => d.getComment?.() || '').join('\n').trim();
                  if (desc) {
                    const rec = agg.get(name) || { types: new Set(), requiredCount: 0, total: 0 };
                    // @ts-ignore
                    rec.description = rec.description || desc;
                    agg.set(name, rec);
                  }
                }
              } catch {}
            }
          } catch {}
        }

        // Handle unions: mark a prop required only if present and required in all variants
        if (aliasType.isUnion()) {
          const unionParts = aliasType.getUnionTypes();
          for (const ut of unionParts) {
            const obj = ut.getApparentType();
            collectFromObjectType(obj);
          }
        } else if (aliasType.isIntersection()) {
          const parts = aliasType.getIntersectionTypes();
          for (const it of parts) collectFromObjectType(it.getApparentType());
        } else {
          collectFromObjectType(aliasType.getApparentType());
        }

        // Write aggregated props with conservative requiredness
        for (const [name, info] of agg.entries()) {
          const typeText = Array.from(info.types).join(' | ') || 'any';
          const required = info.requiredCount > 0 && info.requiredCount === info.total;
          // @ts-ignore - description may be attached above
          const extra = info.description ? { description: info.description } : {};
          pushProp(name, typeText, required, extra);
        }

        // Fallback domPassthrough heuristic based on prop surface
        try {
          if (!domPassthrough) {
            const names = Array.from(agg.keys());
            const hasTextareaHints = names.includes('rows') || /textarea/i.test((agg.get('as')?.types ? Array.from(agg.get('as').types).join(' ') : ''));
            const hasInputish = ['onChange','value','placeholder','type','maxLength','minLength'].some((k) => names.includes(k));
            if (hasTextareaHints && hasInputish) domPassthrough = { element: 'input|textarea', omitted: [] };
            else if (hasInputish) domPassthrough = { element: 'input', omitted: [] };
          }
        } catch {}
      }
    }

    // defaults from function params destructuring
    // export const X: React.FC<XProps> = ({ ... }) => { ... }
    const varDecl = sf.getVariableDeclaration(componentName);
    if (varDecl) {
      const init = varDecl.getInitializer();
      if (init && init.getKind() === SyntaxKind.ArrowFunction) {
        const params = init.getParameters();
        if (params.length) {
          const p0 = params[0];
          const binding = p0.getNameNode();
          if (binding && binding.getKind() === SyntaxKind.ObjectBindingPattern) {
            const elements = binding.getElements();
            for (const el of elements) {
              const name = el.getNameNode().getText();
              const initializer = el.getInitializer();
              if (initializer) {
                const defText = initializer.getText();
                const idx = props.findIndex((pp) => pp.name === name);
                if (idx >= 0) props[idx].default = defText;
                else props.push({ name, type: 'unknown', required: false, default: defText });
              }
            }
          }
        }
      }
    }

    // Infer enum values for union literal types like 'a' | 'b'
    for (const p of props) {
      const m = p.type.match(/'[^']*'(?:\s*\|\s*'[^']*')+/g);
      if (m) {
        const vals = p.type
          .split('|')
          .map((s) => s.trim())
          .filter((s) => /^'[^']*'$/.test(s))
          .map((s) => s.slice(1, -1));
        if (vals.length > 0) {
          // @ts-ignore - extend at runtime
          p.enumValues = vals;
        }
      }
    }

    // Detect actions via useImperativeHandle(() => ({ ... }))
    try {
      const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls) {
        const exprText = call.getExpression().getText();
        if (!/useImperativeHandle$/.test(exprText)) continue;
        const args = call.getArguments();
        const factory = args[1];
        if (factory && (factory.getKind() === SyntaxKind.ArrowFunction || factory.getKind() === SyntaxKind.FunctionExpression)) {
          // Find returned object literal
          const returns = factory.getDescendantsOfKind(SyntaxKind.ReturnStatement);
          for (const ret of returns) {
            const obj = ret.getExpression();
            if (obj && obj.getKind() === SyntaxKind.ObjectLiteralExpression) {
              for (const prop of obj.getProperties()) {
                const name = prop.getName?.();
                if (name && /^[a-zA-Z_$][\w$]*$/.test(name)) {
                  actions.push({ name });
                }
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // Fallback: Props defined as a type alias (including unions/intersections)
    if (!iface) {
      let alias = sf.getTypeAlias(propsNamePrimary) || sf.getTypeAlias(propsNameFallback);
      if (!alias) {
        // Search project-wide for the alias if not colocated
        for (const osf of project.getSourceFiles()) {
          const cand = osf.getTypeAlias?.(propsNamePrimary) || osf.getTypeAlias?.(propsNameFallback);
          if (cand) {
            alias = cand;
            break;
          }
        }
      }
      if (alias) {
        // Infer DOM passthrough from the type text when possible
        try {
          const tn = alias.getTypeNode?.();
          const txt = tn ? tn.getText() : alias.getText?.();
          const inferred = txt ? inferDomPassthroughFromTypeText(txt) : null;
          if (inferred && !domPassthrough) domPassthrough = inferred;
        } catch {}

        const aliasType = alias.getType();

        /**
         * Collect properties from a ts-morph Type while filtering out DOM/@types/react noise.
         * Uses symbol declarations to decide if a property originates from userland (src/**).
         */
        function collectFromType(t) {
          try {
            const syms = t.getProperties();
            for (const sym of syms) {
              const name = sym.getName();
              if (!name || propSet.has(name)) continue;
              const decls = sym.getDeclarations?.() || [];
              const isUserland = decls.some((d) => {
                try {
                  const fp = d.getSourceFile().getFilePath();
                  return fp.includes(`${path.sep}src${path.sep}`);
                } catch {
                  return false;
                }
              });
              if (!isUserland) continue; // skip DOM attribute spillover

              // Determine requiredness using symbol optional where available.
              // Default to optional for alias/union-based collection to avoid over-reporting required props.
              let required = false;
              try {
                if (typeof sym.isOptional === 'function') {
                  const opt = sym.isOptional();
                  required = !opt;
                }
              } catch {}

              // Derive type text anchored at the alias node for best context
              let typeText = 'any';
              try {
                const anchor = alias.getTypeNode?.() || alias.getNameNode?.();
                const tAt = anchor ? sym.getTypeAtLocation(anchor) : sym.getDeclaredType?.();
                typeText = (tAt && tAt.getText()) || typeText;
              } catch {}

              pushProp(name, typeText, required);
            }
          } catch {
            // graceful degradation
          }
        }

        if (aliasType.isUnion?.()) {
          for (const ut of aliasType.getUnionTypes()) collectFromType(ut);
        } else {
          collectFromType(aliasType);
        }

        // Heuristic: parse alias type text to ensure event props are captured for unions/aliases
        try {
          const tn = alias.getTypeNode?.();
          const raw = (tn ? tn.getText() : alias.getText?.()) || '';
          const re = /(on[A-Z][A-Za-z0-9_]*)\s*\??\s*:\s*([^;\n|&]+)/g;
          let m;
          while ((m = re.exec(raw))) {
            const name = (m[1] || '').trim();
            const typeText = (m[2] || 'any').trim();
            if (!name || propSet.has(name)) continue;
            // Treat event props as optional by default in union aliases
            pushProp(name, typeText, false);
          }
        } catch {}
      }
    }

    // Collect CSS preset names referenced via preset('name')
    const cssPresets = (() => {
      try {
        const callExprs = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
        const names = new Set();
        for (const ce of callExprs) {
          if (ce.getExpression().getText() === 'preset') {
            const arg = ce.getArguments()?.[0];
            const t = arg?.getText?.() || '';
            const m = t.match(/'([^']+)'|"([^"]+)"/);
            const val = m?.[1] || m?.[2];
            if (val) names.add(val);
          }
        }
        return Array.from(names);
      } catch {
        return [];
      }
    })();

    // summary: derive from file header comments if present
    let summary = '';
    const headerComment = sf.getLeadingCommentRanges()?.[0]?.getText?.();
    if (headerComment) {
      const lines = headerComment.split(/\r?\n/).map((l) => l.replace(/^\/\/[\s*]*/, ''));
      const desc = lines.find((l) => l && !l.includes('| valet'));
      if (desc) summary = desc.trim();
    }

    // If no domPassthrough yet, attempt to infer from polymorphic helper usage
    try {
      if (!domPassthrough) {
        const decls = exports.get(componentName) || [];
        for (const d of decls) {
          if (d.getKind() !== SyntaxKind.VariableDeclaration) continue;
          const init = d.getInitializer?.();
          const txt = init?.getText?.() || '';
          const m = txt.match(/createPolymorphicComponent\s*<\s*'([^']+)'\s*,/);
          if (m && m[1]) {
            domPassthrough = { element: m[1], omitted: [] };
            break;
          }
        }
      }
    } catch {}

    // If still no domPassthrough, but HTML-ish props are present, provide a sensible default.
    try {
      if (!domPassthrough) {
        const htmlish = new Set(['id', 'className', 'style', 'role', 'tabIndex', 'title']);
        const hasHtmlish = (props || []).some((p) => htmlish.has(String(p.name)));
        if (hasHtmlish) domPassthrough = { element: 'div', omitted: [] };
      }
    } catch {}

    result[componentName] = {
      name: componentName,
      category,
      slug: slugFor(componentName, category),
      summary: summary || `${componentName} component`,
      props,
      domPassthrough,
      cssVars,
      cssPresets,
      events,
      actions,
      slots,
      sourceFiles: [path.relative(projectRoot, filePath)],
    };
    }
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const outPath = path.join(root, 'mcp-data', '_ts-extract.json');
  const res = extractFromTs(root);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(res, null, 2));
  console.log('Wrote', outPath);
}
