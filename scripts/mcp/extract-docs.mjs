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
        const name = n.openingElement.name.type === 'JSXIdentifier' ? n.openingElement.name.name : 'el';
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
  // Only include component demo pages to avoid polluting MCP with concept/tutorial pages
  return files.filter((fp) => fp.includes(`${path.sep}components${path.sep}`));
}

function guessNameFromFile(fp) {
  // e.g., docs/src/pages/components/layout/BoxDemo.tsx -> Box
  let base = path.basename(fp, path.extname(fp));
  base = base.replace(/(DemoPage|Demo)$/,'');
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

export function extractFromDocs(root) {
  const filePaths = readDocsFiles(root);
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
                const parent = path.parent && path.parent.node && path.parent.node.type === 'JSXElement' ? path.parent.node : null;
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
              examples.push({ id: `${componentName.toLowerCase()}-example-${examples.length + 1}`, title, code: codeStr, lang: 'tsx', source: { file }, runnable: true });
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
              const parent = path.parentPath && path.parentPath.node && path.parentPath.node.type === 'JSXElement' ? path.parentPath.node : null;
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
                    } else if (sibName.type === 'JSXIdentifier' && (sibName.name === 'ul' || sibName.name === 'ol')) {
                      // Collect list items inside ul/ol within section
                      for (const li of sib.children || []) {
                        if (li && li.type === 'JSXElement' && li.openingElement.name.type === 'JSXIdentifier' && li.openingElement.name.name === 'li') {
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

    if (!propsRows.length && !examples.length && !bp.length) continue;

    result[componentName] = {
      propsRows,
      examples,
      bestPractices: bp,
      docsUrl: file.includes('docs/src/pages')
        ? '/' + path.relative(path.join(root, 'docs', 'src', 'pages'), file).replace(/\\/g, '/').replace(/\.tsx?$/, '')
        : undefined,
      sourceFile: path.relative(root, file),
    };
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
