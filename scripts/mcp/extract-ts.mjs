import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';

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

    // Find Props interface
    const ifaceName = `${componentName}Props`;
    let iface = sf.getInterface(ifaceName);
    if (!iface) {
      for (const osf of project.getSourceFiles()) {
        const cand = osf.getInterface(ifaceName);
        if (cand) {
          iface = cand;
          break;
        }
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

    if (iface) {
      // Heritage clauses: extends <...>
      for (const h of iface.getExtends()) {
        const t = h.getText();
        const m = t.match(/React\.ComponentProps<'([^']+)'>/);
        if (m) {
          domPassthrough = { element: m[1], omitted: [] };
          const omit = t.match(/Omit<[^,]+,\s*'([^']+)'>/);
          if (omit) domPassthrough.omitted = [omit[1]];
        }
      }
      for (const m of iface.getMembers()) {
        if (m.getKind() !== SyntaxKind.PropertySignature) continue;
        // name
        const nameNode = m.getNameNode();
        const name = nameNode.getText().replace(/\?$/, '');
        if (propSet.has(name)) continue;
        propSet.add(name);

        // type
        const typeNode = m.getTypeNode();
        const type = typeNode ? typeNode.getText() : 'any';

        // required
        const required = !/\?$/.test(m.getText());

        // jsdoc deprecation
        let deprecated;
        const jsdocs = m.getJsDocs();
        if (jsdocs?.length) {
          const text = jsdocs.map((d) => d.getComment() || '').join('\n');
          if (/deprecated/i.test(text)) deprecated = true;
        }

        const cleanType = type.replace(/\s+/g, ' ');
        props.push({ name, type: cleanType, required, deprecated });

        // Event heuristic: onXxx prop as function
        if (/^on[A-Z]/.test(name) && /=>/.test(cleanType)) {
          // Try to grab first parameter type if present
          const m = cleanType.match(/\(([^)]*)\)\s*=>/);
          const firstParam = m ? m[1].split(',')[0]?.trim() : '';
          const payload = firstParam && firstParam.includes(':') ? firstParam.split(':').slice(1).join(':').trim() : undefined;
          events.push({ name, payloadType: payload });
        }

        // Slot heuristic: ReactNode/ReactElement typed props
        if (/React\.(ReactNode|ReactElement)|JSX\.Element|ReactNode|ReactElement/.test(cleanType)) {
          slots.push({ name });
        }
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
