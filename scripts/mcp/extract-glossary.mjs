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

// Known locations, newest first; the page has moved before (concepts/ → getting-started/),
// so unknown future moves are covered by a recursive search under docs/src/pages.
const GLOSSARY_CANDIDATES = [
  ['docs', 'src', 'pages', 'getting-started', 'Glossary.tsx'],
  ['docs', 'src', 'pages', 'concepts', 'Glossary.tsx'],
];

function findGlossaryFile(root) {
  for (const segs of GLOSSARY_CANDIDATES) {
    const fp = path.join(root, ...segs);
    if (fs.existsSync(fp)) return fp;
  }
  // Recursive fallback: first Glossary.tsx under docs/src/pages (deterministic walk order)
  const pagesDir = path.join(root, 'docs', 'src', 'pages');
  if (!fs.existsSync(pagesDir)) return undefined;
  const stack = [pagesDir];
  while (stack.length) {
    const dir = stack.shift();
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fp = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(fp);
      else if (entry.isFile() && entry.name === 'Glossary.tsx') return fp;
    }
  }
  return undefined;
}

export function extractGlossary(root) {
  const fp = findGlossaryFile(root);
  if (!fp) {
    throw new Error(
      `extract-glossary: no Glossary.tsx found under ${path.join(root, 'docs', 'src', 'pages')} ` +
        `(checked ${GLOSSARY_CANDIDATES.map((s) => s.join('/')).join(', ')}, then searched recursively). ` +
        'The shipped glossary must not be empty — update GLOSSARY_CANDIDATES if the page moved.',
    );
  }
  const code = fs.readFileSync(fp, 'utf8');
  let ast;
  try {
    ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  } catch (e) {
    throw new Error(`extract-glossary: failed to parse ${fp}: ${e.message}`);
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

  if (out.length === 0) {
    throw new Error(
      `extract-glossary: parsed ${fp} but extracted zero entries — ` +
        'the exported GLOSSARY array must stay a babel-parseable array of { term, definition } objects.',
    );
  }

  // Stable sort by term
  out.sort((a, b) => a.term.localeCompare(b.term));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const root = process.cwd();
    const outDir = path.join(root, 'mcp-data');
    fs.mkdirSync(outDir, { recursive: true });
    const entries = extractGlossary(root);
    fs.writeFileSync(path.join(outDir, 'glossary.json'), JSON.stringify({ entries }, null, 2));
    console.log('Wrote', path.join(outDir, 'glossary.json'), `(${entries.length} entries)`);
  } catch (e) {
    console.error(String((e && e.message) || e));
    process.exit(1);
  }
}

