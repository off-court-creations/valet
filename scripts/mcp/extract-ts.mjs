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
    // Find default export component name if any
    let componentName = undefined;
    for (const [name, decs] of exports) {
      for (const d of decs) {
        if (d.getKind() === SyntaxKind.FunctionDeclaration || d.getKind() === SyntaxKind.VariableDeclaration) {
          // Heuristic: exported const X: React.FC<XProps> = (...)
          if (/^[A-Z]/.test(name)) componentName = name;
        }
        if (d.getKind() === SyntaxKind.ClassDeclaration && /^[A-Z]/.test(name)) {
          componentName = name;
        }
      }
    }

    if (!componentName) continue;

    // Guard: ensure file contains JSX – exclude utility/contexts/constants
    const hasJsx =
      sf.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
      sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 ||
      sf.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
    if (!hasJsx) continue;

    const filePath = sf.getFilePath();
    const category = guessCategoryFromPath(filePath);
    const cssVars = collectCssVarsFromFile(sf);

    // Resolve Props from interface or type alias
    const propsName = `${componentName}Props`;

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

    // Helper: push a prop if not seen
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
    let iface = sf.getInterface(propsName);
    if (!iface) {
      // Search whole project just in case props are declared elsewhere
      for (const osf of project.getSourceFiles()) {
        const cand = osf.getInterface(propsName);
        if (cand) { iface = cand; break; }
      }
    }

    if (iface) {
      // DOM passthrough from heritage
      for (const h of iface.getExtends()) {
        const t = h.getText();
        const inferred = inferDomPassthroughFromTypeText(t);
        if (inferred && !domPassthrough) domPassthrough = inferred;
      }
      for (const m of iface.getMembers()) {
        if (m.getKind() !== SyntaxKind.PropertySignature) continue;
        const nameNode = m.getNameNode();
        const name = nameNode.getText().replace(/\?$/, '');
        const typeNode = m.getTypeNode();
        const typeText = typeNode ? typeNode.getText() : 'any';
        // Correct required detection: use hasQuestionToken()
        const required = typeof m.hasQuestionToken === 'function' ? !m.hasQuestionToken() : !/\?$/.test(m.getText());
        // jsdoc deprecation
        let deprecated;
        const jsdocs = m.getJsDocs?.();
        if (jsdocs?.length) {
          const text = jsdocs.map((d) => d.getComment?.() || '').join('\n');
          if (/deprecated/i.test(text)) deprecated = true;
        }
        pushProp(name, typeText, required, deprecated ? { deprecated } : {});
      }
    } else {
      // 2) Try type alias resolution, including unions/intersections
      let aliasDecl = sf.getTypeAlias(propsName);
      if (!aliasDecl) {
        for (const osf of project.getSourceFiles()) {
          const cand = osf.getTypeAlias(propsName);
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
          pushProp(name, typeText, required);
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
