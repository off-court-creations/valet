// @ts-nocheck — TODO(TEST-CI S11): this extractor drives the ts-morph
// AST API, whose accessor methods (getInitializer/getTypeNode/getJsDocs/
// hasQuestionToken/getParameters …) are typed against precise node unions
// (ExportedDeclarations, TypeElementTypes). The code narrows by runtime
// SyntaxKind checks that checkJs cannot follow without per-call JSDoc casts
// — a real typing refactor, out of scope for the mechanical S11 pass. The
// file is exercised end-to-end by scripts/mcp/extractors.test.mjs and the
// mcp:build → mcp:schema:check gate, so behavior is covered; only static
// type inference is suppressed here.
import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

// Normalize a ts-morph JSDoc comment into plain text.
//
// `JSDoc.getComment()` and `JSDocTag.getComment()` return `undefined`, a
// `string`, OR a `(string | JSDocNode)[]` — the array form appears whenever
// the comment contains an inline `{@link ...}`. The old code did
// `.map(d => d.getComment() || '').join('\n')` (→ '[object Object]' once an
// array landed in a String coercion) and `(tag.getComment() || '').trim()`
// (→ TypeError on the array, which the bare `catch {}` swallowed, silently
// abandoning @deprecated/@default detection for the whole prop). This flattens
// every shape to clean text: JSDocText nodes carry their text in
// `compilerNode.text`; JSDoc{Link,LinkCode,LinkPlain} nodes carry the link
// target in `compilerNode.name` (an EntityName) plus any trailing display text
// in `compilerNode.text` (e.g. `{@link Foo.bar | label}` → name `Foo.bar`,
// text `| label`). Reconstruct the readable inline form so descriptions read
// as real prose and tag reads never throw.
function commentText(c) {
  if (c == null) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c
      .map((part) => {
        if (typeof part === 'string') return part;
        const cn = part?.compilerNode ?? part;
        const linkName = cn?.name
          ? typeof cn.name.getText === 'function'
            ? cn.name.getText()
            : String(cn.name.escapedText ?? cn.name.text ?? '')
          : '';
        const txt = typeof cn?.text === 'string' ? cn.text : '';
        return linkName && txt ? `${linkName} ${txt}` : linkName || txt;
      })
      .join('');
  }
  return String(c);
}

// Strip the surrounding quotes off a quoted object/property key.
//
// ts-morph's `nameNode.getText()` on a StringLiteral property key returns the
// source text *including* its quotes (`'aria-label'`), whereas the type
// checker's symbol name (`sym.getName()`) and JSX attribute spelling are the
// bare key (`aria-label`). Without normalization the same prop is collected
// under two different keys and emitted twice. Only single/double-quoted keys
// are touched; identifiers pass through unchanged.
function unquoteName(name) {
  if (typeof name !== 'string') return name;
  const m = name.match(/^(['"])(.*)\1$/);
  return m ? m[2] : name;
}

// Read a string-literal argument's bare value, or undefined when the arg is
// missing / not a plain string literal. ts-morph hands StringLiterals back with
// their surrounding quotes via getText(); getLiteralText() (when present)
// returns the unquoted value directly, so prefer it and fall back to stripping
// quotes off the source text. A non-literal arg (an expression, a template, a
// computed value) yields undefined — the call-site map only trusts literal
// component/prop names.
function stringLiteralArg(arg) {
  if (!arg) return undefined;
  if (arg.getKind?.() !== SyntaxKind.StringLiteral) return undefined;
  if (typeof arg.getLiteralText === 'function') return arg.getLiteralText();
  return unquoteName(arg.getText());
}

// Build the authoritative alias→canonical deprecation map from the
// deprecate.ts call sites across the project, keyed by component then by the
// deprecated prop name:
//   { [component]: { [deprecatedProp]: { replacement } } }
//
// This is strictly more robust than the JSDoc `@deprecated` tag (A1): the two
// helpers take the component/prop names as plain string-literal *arguments*,
// which cannot array-coerce or throw the way an inline `{@link}` JSDoc comment
// does. Two signatures are parsed (see src/system/deprecate.ts):
//   • resolveDeprecatedProp(component, canonicalName, canonical,
//                           deprecatedName, deprecated)
//       → component = arg0, replacement = arg1 (canonicalName),
//         deprecatedProp = arg3 (deprecatedName)
//   • deprecateProp(component, oldName, newName)
//       → component = arg0, deprecatedProp = arg1 (oldName),
//         replacement = arg2 (newName)
// There is no per-call reason string (the migration message is synthesized
// inside deprecate.ts), so the map carries only `{ replacement }`. A bare
// `deprecateProp(...)` whose newName is non-literal still records the alias
// with no replacement (→ emitted as `deprecated: true`). Matching is by callee
// text (mirrors the `preset(...)` scan below); both names are local imports
// from '../../system/deprecate', never re-aliased, so the identifier text is
// authoritative.
function collectDeprecationMap(project) {
  /** @type {Record<string, Record<string, { replacement?: string }>>} */
  const map = {};
  const record = (component, deprecatedProp, replacement) => {
    if (!component || !deprecatedProp) return;
    const forComponent = (map[component] ||= {});
    const entry = (forComponent[deprecatedProp] ||= {});
    // First literal replacement wins; never overwrite a known canonical name
    // with a later non-literal call.
    if (replacement && !entry.replacement) entry.replacement = replacement;
  };

  for (const sf of project.getSourceFiles()) {
    const fp = sf.getFilePath();
    // Only production component source is authoritative. The tsconfig pulls in
    // the colocated *.test.tsx specs (e.g. Accordion.deprecate.dom.test.tsx),
    // which call the helpers with the same names today — but a test must never
    // be able to mint or contradict a public deprecation, so skip them and the
    // shim's own definition site (`src/system/deprecate.ts`, where the internal
    // deprecateProp call takes identifier args, not literals, so it is already
    // a no-op — excluded here for clarity).
    if (!fp.includes(`${path.sep}src${path.sep}components${path.sep}`)) continue;
    if (/\.test\.[cm]?[jt]sx?$/.test(fp)) continue;
    let callExprs;
    try {
      callExprs = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
    } catch {
      continue;
    }
    for (const ce of callExprs) {
      let callee;
      try {
        callee = ce.getExpression().getText();
      } catch {
        continue;
      }
      const args = ce.getArguments?.() || [];
      if (callee === 'resolveDeprecatedProp') {
        // (component, canonicalName, canonical, deprecatedName, deprecated)
        record(stringLiteralArg(args[0]), stringLiteralArg(args[3]), stringLiteralArg(args[1]));
      } else if (callee === 'deprecateProp') {
        // (component, oldName, newName)
        record(stringLiteralArg(args[0]), stringLiteralArg(args[1]), stringLiteralArg(args[2]));
      }
    }
  }
  return map;
}

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
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    iframe: 'iframe',
    img: 'img',
    image: 'img',
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
    p: 'p',
    paragraph: 'p',
    progress: 'progress',
    script: 'script',
    select: 'select',
    slot: 'slot',
    source: 'source',
    span: 'span',
    style: 'style',
    table: 'table',
    td: 'td',
    th: 'th',
    tr: 'tr',
    thead: 'thead',
    tbody: 'tbody',
    tfoot: 'tfoot',
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
    if (mHtmlEl)
      return { element: mapHtmlElementToTag(mHtmlEl[1]), omitted: extractOmittedKeys(t) };
  } catch {}
  return null;
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
  const candidate = idx >= 0 ? parts[idx + 1] : undefined;
  // Guard: a file sitting directly under src/components/ has no category
  // directory — without this, the filename itself (e.g. 'KeyModal.tsx')
  // leaks through as the category.
  if (candidate && !candidate.includes('.')) return candidate;
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

  // Authoritative deprecation truth, derived from the deprecate.ts call sites
  // (alias→canonical), keyed { component -> { deprecatedProp -> {replacement} } }.
  // Merged into each component's props below: the robust complement to A1's
  // JSDoc `@deprecated` flag. See collectDeprecationMap.
  const deprecationMap = collectDeprecationMap(project);

  /** @type {Record<string, any>} */
  const result = {};

  const files = project
    .getSourceFiles()
    .filter(
      (sf) =>
        sf.getFilePath().includes(`${path.sep}src${path.sep}components${path.sep}`) &&
        sf.getFilePath().endsWith('.tsx'),
    );
  for (const sf of files) {
    const exports = sf.getExportedDeclarations();
    // Collect all exported component names (supports multiple per file)
    const componentNames = [];
    const isComponentDeclaration = (d) =>
      d.getKind() === SyntaxKind.FunctionDeclaration ||
      d.getKind() === SyntaxKind.VariableDeclaration ||
      d.getKind() === SyntaxKind.ClassDeclaration;
    // PascalCase with at least one lowercase letter (KeyModal yes;
    // DEFAULT_MODELS / SCREAMING_SNAKE constants no).
    const looksLikeComponentName = (name) => /^[A-Z][A-Za-z0-9]*$/.test(name) && /[a-z]/.test(name);
    // Local names that are really dotted subcomponents, e.g.
    // `Option.displayName = 'Select.Option'`. These are exported bare only for
    // internal composition (`Forward.Option = Option`); their canonical MCP
    // identity is the dotted name, minted by the displayName pass below. Skip
    // the bare alias here so it doesn't shadow that — and, since BOTH Select
    // and MetroSelect export a const `Option`, so the two don't collide into a
    // single ambiguous `components_fields_option` entry.
    const dottedAliasLocals = new Set();
    {
      const aliasRe = /(\w+)\.displayName\s*=\s*'[^']+\.[^']+'/g;
      let am;
      const txt = sf.getFullText();
      while ((am = aliasRe.exec(txt))) dottedAliasLocals.add(am[1]);
    }
    const defaultExportDecs = [];
    for (const [name, decs] of exports) {
      for (const d of decs) {
        if (!isComponentDeclaration(d)) continue;
        // Defer the default export: it arrives under the key 'default', which
        // fails the capital-letter test, so default-exported components
        // (e.g. KeyModal) used to be invisible to MCP.
        if (name === 'default') {
          defaultExportDecs.push(d);
          continue;
        }
        // PascalCase only: an uppercase start alone also matches constant
        // exports like DEFAULT_MODELS, which are not components.
        if (
          looksLikeComponentName(name) &&
          !componentNames.includes(name) &&
          !dottedAliasLocals.has(name)
        )
          componentNames.push(name);
      }
    }
    // Resolve default-export component names from the declaration itself
    // (file basename for anonymous defaults) — but skip declarations a named
    // export already aliases, so `export const Select = Forward` +
    // `export default Forward` doesn't mint a junk 'Forward' component.
    for (const d of defaultExportDecs) {
      const resolved = d.getName?.() || path.basename(sf.getFilePath(), '.tsx');
      if (!looksLikeComponentName(resolved) || componentNames.includes(resolved)) continue;
      const aliasedByNamedExport = Array.from(exports.entries()).some(
        ([n, ds]) =>
          n !== 'default' &&
          ds.some(
            (nd) =>
              nd.getKind?.() === SyntaxKind.VariableDeclaration &&
              nd.getInitializer?.()?.getText?.() === resolved,
          ),
      );
      if (!aliasedByNamedExport) componentNames.push(resolved);
    }

    // Heuristic: add well-known nested subcomponents when present in the file.
    // Tabs.Tab / Tabs.Panel are not top-level exports; include them for MCP parity.
    try {
      if (componentNames.includes('Tabs')) {
        const hasTabProps = sf.getInterface('TabProps');
        const hasPanelProps = sf.getInterface('TabPanelProps');
        if (hasTabProps && !componentNames.includes('Tabs.Tab')) componentNames.push('Tabs.Tab');
        if (hasPanelProps && !componentNames.includes('Tabs.Panel'))
          componentNames.push('Tabs.Panel');
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
            const found =
              allIfaces.find((n) => candidates.includes(n)) ||
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
      /** @type {Array<{ name: string }>} */
      const slots = [];

      // Helper: push a prop if not seen; allow attaching description/deprecated/default via `extra`
      function pushProp(name, typeText, required, extra = {}) {
        if (!name) return;
        if (propSet.has(name)) return;
        propSet.add(name);
        // ts-morph prints a cross-module type the snippet can't name in scope
        // as `import("<absolute path>").Name` — the absolute path is
        // machine-specific (./home/xbenc vs CI /home/runner) and would make the
        // corpus non-reproducible (check-fresh "stale"). Strip the import()
        // qualifier to the bare type name (also more readable for an agent).
        const cleanType = (typeText || 'any')
          .replace(/import\((?:"[^"]*"|'[^']*')\)\./g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const p = { name, type: cleanType, required, ...extra };
        props.push(p);
        // Heuristics from type string for events/slots
        if (/^on[A-Z]/.test(name) && /=>/.test(cleanType)) {
          const m = cleanType.match(/\(([^)]*)\)\s*=>/);
          const firstParam = m ? m[1].split(',')[0]?.trim() : '';
          const payload =
            firstParam && firstParam.includes(':')
              ? firstParam.split(':').slice(1).join(':').trim()
              : undefined;
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
                iface =
                  sf.getInterface(maybeName) ||
                  project
                    .getSourceFiles()
                    .map((f) => f.getInterface(maybeName))
                    .find(Boolean);
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
          if (cand) {
            iface = cand;
            break;
          }
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
          // Quoted property keys (e.g. `'aria-label'?: string`) come back from
          // nameNode.getText() with their surrounding quotes, but the inherited-
          // symbol loop below (and JSX itself) uses the bare symbol name
          // (`aria-label`). Normalizing here keeps a single canonical form in
          // propSet so the same prop is not emitted twice (once quoted from this
          // loop, once unquoted from the symbol loop — the Drawer aria-label
          // double-count).
          const name = unquoteName(nameNode.getText().replace(/\?$/, ''));
          const typeNode = m.getTypeNode();
          const typeText = typeNode ? typeNode.getText() : 'any';
          // Correct required detection: use hasQuestionToken()
          const required =
            typeof m.hasQuestionToken === 'function'
              ? !m.hasQuestionToken()
              : !/\?$/.test(m.getText());
          // jsdoc description/deprecated/default
          let deprecated;
          let description;
          let defaultTag;
          {
            const jsdocs = m.getJsDocs?.();
            if (jsdocs?.length) {
              description =
                jsdocs
                  .map((d) => commentText(d.getComment?.()))
                  .join('\n')
                  .trim() || undefined;
              for (const d of jsdocs) {
                for (const tag of d.getTags?.() || []) {
                  const tagName = (tag.getTagName?.() || '').toLowerCase();
                  const tagTxt = commentText(tag.getComment?.()).trim();
                  if (tagName === 'deprecated') deprecated = true;
                  if (tagName === 'default' && tagTxt) defaultTag = tagTxt;
                }
              }
            }
          }
          const extra = {
            ...(deprecated ? { deprecated } : {}),
            ...(description ? { description } : {}),
            ...(defaultTag ? { default: defaultTag } : {}),
          };
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
                const propDecl = decls.find(
                  (d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature,
                );
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
            {
              const propDecl = decls.find(
                (d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature,
              );
              const jsdocs = propDecl?.getJsDocs?.() || [];
              if (jsdocs.length) {
                description =
                  jsdocs
                    .map((d) => commentText(d.getComment?.()))
                    .join('\n')
                    .trim() || undefined;
                for (const d of jsdocs) {
                  for (const tag of d.getTags?.() || []) {
                    const tagName = (tag.getTagName?.() || '').toLowerCase();
                    const tagTxt = commentText(tag.getComment?.()).trim();
                    if (tagName === 'deprecated') deprecated = true;
                    if (tagName === 'default' && tagTxt) defaultTag = tagTxt;
                  }
                }
              }
            }

            const extra = {
              ...(description ? { description } : {}),
              ...(deprecated ? { deprecated } : {}),
              ...(defaultTag ? { default: defaultTag } : {}),
            };
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
            if (cand) {
              aliasDecl = cand;
              break;
            }
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
            const hasInput =
              /InputHTMLAttributes<|HTMLInputElement/.test(text) ||
              /HTMLInputAttributes/i.test(text);
            const hasTextarea = /TextareaHTMLAttributes<|HTMLTextAreaElement/.test(text);
            if (!domPassthrough && (hasInput || hasTextarea)) {
              domPassthrough = {
                element:
                  hasInput && hasTextarea ? 'input|textarea' : hasInput ? 'input' : 'textarea',
                omitted: extractOmittedKeys(text),
              };
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
                const ps =
                  decls.find((d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature) ||
                  decls[0];
                const name = sym.getName();
                const symType = sym.getTypeAtLocation(ps || aliasDecl);
                const typeText = symType.getText(ps || aliasDecl);
                // Prefer the checker's verdict on the merged symbol: intersections
                // like `FieldBaseProps & { name: string }` carry one optional and
                // one required declaration, and the first PropertySignature found
                // may be the optional base — hasQuestionToken() alone misreports
                // required props (e.g. TextField's `name`).
                let isRequired = true;
                try {
                  if (typeof sym.isOptional === 'function') {
                    isRequired = !sym.isOptional();
                  } else {
                    const propDecl = decls.find(
                      (d) => d.getKind && d.getKind() === SyntaxKind.PropertySignature,
                    );
                    if (propDecl && typeof propDecl.hasQuestionToken === 'function') {
                      isRequired = !propDecl.hasQuestionToken();
                    }
                  }
                } catch {}
                addPropAgg(name, typeText, !!isRequired);

                // Attach JSDoc to a temp cache on agg record via a side map key
                try {
                  const jsdocs = ps?.getJsDocs?.() || [];
                  if (jsdocs.length) {
                    const desc = jsdocs
                      .map((d) => commentText(d.getComment?.()))
                      .join('\n')
                      .trim();
                    if (desc) {
                      const rec = agg.get(name) || { types: new Set(), requiredCount: 0, total: 0 };
                      // @ts-expect-error - description attached at runtime
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
            // @ts-expect-error - description may be attached above
            const extra = info.description ? { description: info.description } : {};
            pushProp(name, typeText, required, extra);
          }

          // Fallback domPassthrough heuristic based on prop surface
          try {
            if (!domPassthrough) {
              const names = Array.from(agg.keys());
              const hasTextareaHints =
                names.includes('rows') ||
                /textarea/i.test(
                  agg.get('as')?.types ? Array.from(agg.get('as').types).join(' ') : '',
                );
              const hasInputish = [
                'onChange',
                'value',
                'placeholder',
                'type',
                'maxLength',
                'minLength',
              ].some((k) => names.includes(k));
              if (hasTextareaHints && hasInputish)
                domPassthrough = { element: 'input|textarea', omitted: [] };
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
                const initializer = el.getInitializer();
                if (!initializer) continue;
                // Resolve the *public* prop name this binding refers to. A
                // renamed binding (`anchor: anchorProp = 'left'`) destructures
                // the public `anchor` prop into a local `anchorProp`; the public
                // name is the property key, not the local alias. Quoted keys
                // (`'aria-label': ariaLabel`) are unquoted to match the symbol
                // spelling.
                const propNameNode = el.getPropertyNameNode?.();
                const name = unquoteName(
                  (propNameNode ? propNameNode.getText() : el.getNameNode().getText()).replace(
                    /\?$/,
                    '',
                  ),
                );
                // Only attach the default to a prop already resolved from the
                // public props interface/type (or a DOM-passthrough key surfaced
                // as a real prop). Inventing a prop for any destructured default
                // produced phantom, type:'unknown' entries that aren't in the
                // public API (Drawer.anchorProp, Avatar.loading — the latter a
                // DOM-passthrough attribute the extractor records via
                // domPassthrough, not as an enumerated prop).
                const idx = props.findIndex((pp) => pp.name === name);
                if (idx >= 0) {
                  const defText = initializer.getText();
                  if (props[idx].default == null) props[idx].default = defText;
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
            // @ts-expect-error - extend at runtime
            p.enumValues = vals;
          }
        }
      }

      // Merge the authoritative call-site deprecation truth (A3) onto the
      // collected props. For the parent component name (e.g. `Table`, not
      // `Tabs.Tab`), any prop whose name is a known deprecated alias gets
      // `deprecated` set from the deprecate.ts call site, regardless of whether
      // its JSDoc carried `@deprecated`. This is the robust source that
      // complements the JSDoc flag (A1): both should agree, and when they do
      // not we prefer the call-site truth and warn. Emits the schema shape
      // `deprecated: true | { replacement }` (shared.ts:40) — a literal
      // replacement → `{ replacement }`, otherwise bare `true`.
      const componentDeprecations = deprecationMap[componentName];
      if (componentDeprecations) {
        for (const p of props) {
          const info = componentDeprecations[p.name];
          if (!info) continue;
          // Belt-and-suspenders: when the JSDoc said the prop was NOT deprecated
          // but the call site says it is, prefer the call-site truth and warn.
          // (The reverse — JSDoc-only — is left as the JSDoc `true`; the gate in
          // B1 cross-checks that every call-site alias is flagged.)
          if (p.deprecated == null) {
            console.warn(
              `[mcp][deprecation] ${componentName}.${p.name}: deprecated per deprecate.ts ` +
                `call site but no @deprecated JSDoc tag — using call-site truth.`,
            );
          }
          p.deprecated = info.replacement ? { replacement: info.replacement } : true;
        }
        // Surface, but do not invent: a call-site alias with no matching prop
        // means the deprecated prop name was dropped from the public type
        // surface (or renamed). Warn so it is visible rather than silently lost.
        for (const [deprecatedProp, info] of Object.entries(componentDeprecations)) {
          if (props.some((p) => p.name === deprecatedProp)) continue;
          console.warn(
            `[mcp][deprecation] ${componentName}.${deprecatedProp}: deprecate.ts call site ` +
              `references a prop absent from the extracted props (replacement: ${
                info.replacement ?? 'n/a'
              }).`,
          );
        }
      }

      // NOTE (schema 1.7): the `actions` field was removed. Its only heuristic
      // detected useImperativeHandle, which zero components use — the field was
      // `[]` for all 56 components and only misled agents (plan §3.9 S9).

      // Fallback: Props defined as a type alias (including unions/intersections)
      if (!iface) {
        let alias = sf.getTypeAlias(propsNamePrimary) || sf.getTypeAlias(propsNameFallback);
        if (!alias) {
          // Search project-wide for the alias if not colocated
          for (const osf of project.getSourceFiles()) {
            const cand =
              osf.getTypeAlias?.(propsNamePrimary) || osf.getTypeAlias?.(propsNameFallback);
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

      // summary: derive from the file header comment if present.
      // ts-morph attaches leading comments to the first statement, not the
      // SourceFile (sf.getLeadingCommentRanges() is always [] here), and each
      // `//` line is its own range — so gather them all, then skip the
      // box-drawing rule lines and the `<path> | valet` banner line.
      let summary = '';
      try {
        const ranges = sf.getStatements()[0]?.getLeadingCommentRanges() || [];
        const lines = ranges
          .flatMap((r) => r.getText().split(/\r?\n/))
          .map((l) =>
            l
              .replace(/^\s*\/\*+/, '')
              .replace(/\*+\/\s*$/, '')
              .replace(/^\s*\/\/+/, '')
              .replace(/^[\s*]+/, '')
              .trim(),
          );
        const desc = lines.find((l) => l && !l.includes('| valet') && /[A-Za-z0-9]/.test(l));
        if (desc) summary = desc;
      } catch {}

      // Polymorphic components built via createPolymorphicComponent: surface the
      // `as` prop (it lives on PolymorphicProps, not OwnProps, so the paths above
      // never see it) and infer domPassthrough from the default element when
      // nothing better was found.
      try {
        const decls = exports.get(componentName) || [];
        for (const d of decls) {
          if (d.getKind() !== SyntaxKind.VariableDeclaration) continue;
          const init = d.getInitializer?.();
          const txt = init?.getText?.() || '';
          const m = txt.match(/createPolymorphicComponent\s*<\s*'([^']+)'\s*,/);
          if (m && m[1]) {
            pushProp('as', 'React.ElementType', false, {
              description:
                'Polymorphic element override (renders this element/component instead of the default).',
              default: `'${m[1]}'`,
            });
            if (!domPassthrough) domPassthrough = { element: m[1], omitted: [] };
            break;
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
