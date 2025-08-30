import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

function literalToString(n) {
  if (!n) return undefined;
  if (n.type === 'StringLiteral') return n.value;
  if (n.type === 'TemplateLiteral') return n.quasis.map((q) => q.value.cooked).join('');
  return undefined;
}

export function extractGlossary(root) {
  const fp = path.join(root, 'docs', 'src', 'pages', 'concepts', 'Glossary.tsx');
  if (!fs.existsSync(fp)) return [];
  const code = fs.readFileSync(fp, 'utf8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (e) {
    console.warn('Glossary parse error:', e.message);
    return [];
  }
  /** @type {Array<{ term: string, definition: string, aliases?: string[], seeAlso?: string[], category?: string }>} */
  const out = [];

  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      if (!(id.type === 'Identifier' && id.name === 'GLOSSARY')) return;
      const init = path.node.init;
      if (!init || init.type !== 'ArrayExpression') return;
      for (const el of init.elements) {
        if (!el || el.type !== 'ObjectExpression') continue;
        let term, definition, category;
        /** @type {string[]} */
        const aliases = [];
        /** @type {string[]} */
        const seeAlso = [];
        for (const prop of el.properties) {
          if (prop.type !== 'ObjectProperty') continue;
          const key = prop.key.type === 'Identifier' ? prop.key.name : undefined;
          if (!key) continue;
          const value = prop.value;
          if (key === 'term') term = literalToString(value);
          else if (key === 'definition') definition = literalToString(value);
          else if (key === 'category') category = literalToString(value);
          else if (key === 'aliases' || key === 'seeAlso') {
            if (value.type === 'ArrayExpression') {
              for (const v of value.elements) {
                const s = literalToString(v);
                if (s) (key === 'aliases' ? aliases : seeAlso).push(s);
              }
            }
          }
        }
        if (term && definition) {
          out.push({ term, definition, category, aliases: aliases.length ? aliases : undefined, seeAlso: seeAlso.length ? seeAlso : undefined });
        }
      }
    },
  });

  // Stable sort by term
  out.sort((a, b) => a.term.localeCompare(b.term));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const outDir = path.join(root, 'mcp-data');
  fs.mkdirSync(outDir, { recursive: true });
  const entries = extractGlossary(root);
  fs.writeFileSync(path.join(outDir, 'glossary.json'), JSON.stringify({ entries }, null, 2));
  console.log('Wrote', path.join(outDir, 'glossary.json'));
}

