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
  return files;
}

function guessNameFromFile(fp) {
  // e.g., docs/src/pages/components/layout/BoxDemo.tsx -> Box
  let base = path.basename(fp, path.extname(fp));
  base = base.replace(/(DemoPage|Demo)$/,'');
  return base;
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
              examples.push({ id: `${componentName.toLowerCase()}-example-${examples.length + 1}`, code: codeStr, lang: 'tsx', source: { file } });
            }
          }
        }
        // Best practices: Typography nodes that begin with '- '
        if (nameNode.type === 'JSXIdentifier' && nameNode.name === 'Typography') {
          const content = (path.node.children || []).map(jsxToText).join(' ').trim();
          const bullets = content.split(/\n/).map((s) => s.trim()).filter((s) => s.startsWith('- '));
          for (const b of bullets) bestPractices.push(b.replace(/^\-\s*/, ''));
        }
      },
    });

    if (!propsRows.length && !examples.length && !bestPractices.length) continue;

    result[componentName] = {
      propsRows,
      examples,
      bestPractices,
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
