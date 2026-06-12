import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

function jsxToText(node) {
  // Reduce a JSX node to readable text/markdown-ish string
  if (!node) return '';
  const t = (n) => {
    if (!n) return '';
    switch (n.type) {
      case 'StringLiteral':
        return n.value;
      case 'JSXText':
        return n.value.replace(/\s+/g, ' ').trim();
      case 'JSXElement': {
        const name =
          n.openingElement.name.type === 'JSXIdentifier' ? n.openingElement.name.name : 'el';
        const inner = (n.children || []).map(t).join('');
        if (name === 'code') return '`' + inner + '`';
        if (name === 'br') return '\n';
        return inner;
      }
      case 'TemplateLiteral':
        return n.quasis.map((q) => q.value.cooked).join('');
      default:
        return '';
    }
  };
  return t(node);
}

function readDocsFiles(root) {
  const docsRoot = path.join(root, 'docs', 'src', 'pages');
  const files = [];
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile() && /\.tsx?$/.test(e.name)) files.push(fp);
    }
  };
  if (fs.existsSync(docsRoot)) walk(docsRoot);
  // Only include component demo pages to avoid polluting MCP with concept/tutorial pages.
  // Sorted so two pages guessing the same component resolve deterministically.
  return files.filter((fp) => fp.includes(`${path.sep}components${path.sep}`)).sort();
}

function guessNameFromFile(fp) {
  // e.g., docs/src/pages/components/layout/BoxDemo.tsx -> Box
  let base = path.basename(fp, path.extname(fp));
  base = base.replace(/(DemoPage|Demo)$/, '');
  // Normalize a few historical/casing mismatches so docs merge with TS components
  const NAME_ALIASES = {
    CheckBox: 'Checkbox',
    RadioGroup: 'Radio',
  };
  if (NAME_ALIASES[base]) return NAME_ALIASES[base];
  return base;
}

function getAttrString(el, name) {
  const attr = el.openingElement.attributes.find(
    (a) => a.type === 'JSXAttribute' && a.name.name === name,
  );
  if (!attr || !attr.value) return undefined;
  if (attr.value.type === 'StringLiteral') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer') return jsxToText(attr.value.expression);
  return undefined;
}

function dynamicImportSpec(node) {
  // Matches the lazy-loader argument: `() => import('./pages/Foo')`.
  // Babel emits CallExpression with an Import callee (or ImportExpression on newer configs).
  if (!node || node.type !== 'ArrowFunctionExpression') return undefined;
  const body = node.body;
  if (body.type === 'CallExpression' && body.callee.type === 'Import') {
    const arg = body.arguments[0];
    return arg && arg.type === 'StringLiteral' ? arg.value : undefined;
  }
  if (body.type === 'ImportExpression' && body.source && body.source.type === 'StringLiteral') {
    return body.source.value;
  }
  return undefined;
}

function resolvePageFile(docsSrc, spec) {
  // './pages/components/layout/BoxDemo' -> existing file (imports are extensionless)
  if (!spec || !spec.startsWith('.')) return undefined;
  const base = path.resolve(docsSrc, spec);
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

export function extractRouteTable(root) {
  // Parse the docs SPA route table (docs/src/App.tsx): lazy `page(() => import(...))`
  // declarations + <Route path element> pairs yield route -> page-file mappings, so
  // docsUrls are real navigable routes ('/box-demo'), not source-file paths.
  /** @type {{ routes: Record<string, string>, routeByPageFile: Record<string, string> }} */
  const empty = { routes: {}, routeByPageFile: {} };
  const appFile = path.join(root, 'docs', 'src', 'App.tsx');
  if (!fs.existsSync(appFile)) return empty;
  const code = fs.readFileSync(appFile, 'utf8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (e) {
    console.warn('Route table parse error:', e.message);
    return empty;
  }

  const docsSrc = path.join(root, 'docs', 'src');
  /** lazy page variable name -> repo-relative page file */
  const pageFiles = new Map();
  traverse(ast, {
    VariableDeclarator(p) {
      const { id, init } = p.node;
      if (id.type !== 'Identifier' || !init || init.type !== 'CallExpression') return;
      if (init.callee.type !== 'Identifier' || init.callee.name !== 'page') return;
      const file = resolvePageFile(docsSrc, dynamicImportSpec(init.arguments[0]));
      if (file) pageFiles.set(id.name, path.relative(root, file).split(path.sep).join('/'));
    },
  });

  /** @type {Record<string, string>} route path -> repo-relative page file */
  const routes = {};
  /** @type {Record<string, string>} repo-relative page file -> first route in document order */
  const routeByPageFile = {};
  traverse(ast, {
    JSXElement(p) {
      const el = p.node.openingElement;
      if (el.name.type !== 'JSXIdentifier' || el.name.name !== 'Route') return;
      const routePath = getAttrString(p.node, 'path');
      if (!routePath || routePath.includes('*')) return; // catch-alls are not linkable
      const attr = el.attributes.find(
        (a) => a.type === 'JSXAttribute' && a.name.name === 'element',
      );
      const expr =
        attr && attr.value && attr.value.type === 'JSXExpressionContainer'
          ? attr.value.expression
          : undefined;
      const elName =
        expr && expr.type === 'JSXElement' && expr.openingElement.name.type === 'JSXIdentifier'
          ? expr.openingElement.name.name
          : undefined;
      const file = elName ? pageFiles.get(elName) : undefined;
      if (!file) return;
      routes[routePath] = file;
      if (!(file in routeByPageFile)) routeByPageFile[file] = routePath;
    },
  });

  return { routes, routeByPageFile };
}

function writeRoutesArtifact(root, routes) {
  // Build artifact for the docsUrl-vs-routes cross-check in validate.mjs.
  try {
    const outPath = path.join(root, 'mcp-data', '_routes.json');
    const sorted = Object.fromEntries(
      Object.keys(routes)
        .sort()
        .map((k) => [k, routes[k]]),
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(
      outPath,
      JSON.stringify({ source: 'docs/src/App.tsx', routes: sorted }, null, 2),
    );
  } catch (e) {
    console.warn('Routes artifact write error:', e?.message || e);
  }
}

function preferPrev(prev, next) {
  // Two docs pages can guess the same component (LLMChatDemo.tsx and LLMChat.tsx);
  // keep the richer page, tie-breaking toward *Demo/*DemoPage files, then sorted order.
  const score = (e) => e.propsRows.length + e.examples.length + e.bestPractices.length;
  if (score(prev) !== score(next)) return score(prev) > score(next);
  const isDemo = (e) => /Demo(Page)?\.tsx?$/.test(e.sourceFile);
  if (isDemo(prev) !== isDemo(next)) return isDemo(prev);
  return true;
}

export function extractFromDocs(root) {
  const filePaths = readDocsFiles(root);
  const { routes, routeByPageFile } = extractRouteTable(root);
  writeRoutesArtifact(root, routes);
  /** @type {Record<string, any>} */
  const result = {};

  for (const file of filePaths) {
    const code = fs.readFileSync(file, 'utf8');
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });
    } catch {
      continue;
    }

    const componentName = guessNameFromFile(file);
    const propsRows = [];
    const examples = [];
    const bestPractices = [];

    // Collect variable declarators for arrays named 'data' with Row shape
    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        if (id.type === 'Identifier' && id.name === 'data') {
          const init = path.node.init;
          if (init && init.type === 'ArrayExpression') {
            for (const el of init.elements) {
              if (!el || el.type !== 'ObjectExpression') continue;
              const row = { prop: '', type: '', default: '', description: '' };
              for (const p of el.properties) {
                if (p.type !== 'ObjectProperty') continue;
                const key = p.key.type === 'Identifier' ? p.key.name : undefined;
                const val = p.value;
                if (!key) continue;
                const text = jsxToText(val);
                if (key in row) row[key] = (text || '').trim();
              }
              if (row.prop) propsRows.push(row);
            }
          }
        }
      },
      JSXElement(path) {
        const nameNode = path.node.openingElement.name;
        if (nameNode.type === 'JSXIdentifier' && nameNode.name === 'CodeBlock') {
          // Pull code={"..."} attribute
          const attr = path.node.openingElement.attributes.find(
            (a) => a.type === 'JSXAttribute' && a.name.name === 'code',
          );
          if (attr && attr.value) {
            let codeStr = '';
            if (attr.value.type === 'StringLiteral') codeStr = attr.value.value;
            if (attr.value.type === 'JSXExpressionContainer') {
              const expr = attr.value.expression;
              codeStr = jsxToText(expr);
            }
            if (codeStr) {
              // Try to infer a title from a nearby Typography heading
              let title;
              try {
                const parent =
                  path.parent && path.parent.node && path.parent.node.type === 'JSXElement'
                    ? path.parent.node
                    : null;
                if (parent) {
                  const children = parent.children || [];
                  const idx = children.indexOf(path.node);
                  for (let i = idx - 1; i >= 0; i--) {
                    const prev = children[i];
                    if (!prev || prev.type !== 'JSXElement') continue;
                    const nm = prev.openingElement.name;
                    if (nm.type === 'JSXIdentifier' && nm.name === 'Typography') {
                      const variant = getAttrString(prev, 'variant');
                      if (variant && /^h[23]/.test(variant)) {
                        title = (prev.children || []).map(jsxToText).join(' ').trim();
                        break;
                      }
                    }
                  }
                }
              } catch {}
              examples.push({
                id: `${componentName.toLowerCase()}-example-${examples.length + 1}`,
                title,
                code: codeStr,
                lang: 'tsx',
                source: { file },
                runnable: true,
              });
            }
          }
        }
        // Best Practices: only collect bullets under a clearly labeled heading
        if (nameNode.type === 'JSXIdentifier' && nameNode.name === 'Typography') {
          const variant = getAttrString(path.node, 'variant');
          const title = (path.node.children || []).map(jsxToText).join(' ').trim();
          const isHeading = variant && /^h[2-6]/i.test(String(variant));
          const isBestPracticesHeading = isHeading && /best\s*practices/i.test(title);
          if (isBestPracticesHeading) {
            try {
              // Walk subsequent siblings until the next heading Typography
              const parent =
                path.parentPath &&
                path.parentPath.node &&
                path.parentPath.node.type === 'JSXElement'
                  ? path.parentPath.node
                  : null;
              if (parent) {
                const siblings = parent.children || [];
                const idx = siblings.indexOf(path.node);
                for (let i = idx + 1; i < siblings.length; i++) {
                  const sib = siblings[i];
                  if (!sib) continue;
                  if (sib.type === 'JSXElement') {
                    const sibName = sib.openingElement.name;
                    if (sibName.type === 'JSXIdentifier' && sibName.name === 'Typography') {
                      const sibVariant = getAttrString(sib, 'variant');
                      if (sibVariant && /^h[2-6]/i.test(String(sibVariant))) break; // next section
                      // Collect '- ' bullets from Typography paragraph within section
                      const content = (sib.children || [])
                        .map((n) => jsxToText(n))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                      const bullets = content
                        .split(/\n/)
                        .map((s) => s.trim())
                        .filter((s) => s.startsWith('- '))
                        .map((s) => s.replace(/^\-\s*/, '').trim());
                      for (const b of bullets) if (b) bestPractices.push(b);
                    } else if (
                      sibName.type === 'JSXIdentifier' &&
                      (sibName.name === 'ul' || sibName.name === 'ol')
                    ) {
                      // Collect list items inside ul/ol within section
                      for (const li of sib.children || []) {
                        if (
                          li &&
                          li.type === 'JSXElement' &&
                          li.openingElement.name.type === 'JSXIdentifier' &&
                          li.openingElement.name.name === 'li'
                        ) {
                          const txt = (li.children || [])
                            .map(jsxToText)
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                          if (txt) bestPractices.push(txt);
                        }
                      }
                    } else {
                      // Other element types are allowed; continue until next heading
                    }
                  } else if (sib.type === 'JSXText') {
                    // ignore plain text between blocks
                    continue;
                  } else {
                    // Unknown node; continue
                  }
                }
              }
            } catch {
              // noop: defensive
            }
          }
        }
      },
    });

    // Deduplicate best practices; keep insertion order
    const bp = Array.from(new Set(bestPractices.map((s) => s.trim()).filter(Boolean)));

    const sourceFile = path.relative(root, file).split(path.sep).join('/');
    // Real SPA route for this page (undefined when the page is not in the route table)
    const docsUrl = routeByPageFile[sourceFile];

    if (!propsRows.length && !examples.length && !bp.length && !docsUrl) continue;

    const entry = {
      propsRows,
      examples,
      bestPractices: bp,
      docsUrl,
      sourceFile,
    };
    const prev = result[componentName];
    result[componentName] = prev && preferPrev(prev, entry) ? prev : entry;
  }

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const outPath = path.join(root, 'mcp-data', '_docs-extract.json');
  const res = extractFromDocs(root);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(res, null, 2));
  console.log('Wrote', outPath);
}
