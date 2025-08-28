import fs from 'fs';
import path from 'path';
import { extractFromTs } from './extract-ts.mjs';
import { extractFromDocs } from './extract-docs.mjs';

function merge(tsMap, docsMap, version) {
  /** @type {Record<string, any>} */
  const out = {};

  const allNames = new Set([...Object.keys(tsMap), ...Object.keys(docsMap)]);
  for (const name of allNames) {
    const ts = tsMap[name] || {};
    const docs = docsMap[name] || {};

    const props = [];
    const byName = new Map();

    for (const p of ts.props || []) {
      const copy = { ...p };
      byName.set(copy.name, copy);
      props.push(copy);
    }

    // Enrich from docs prop table
    for (const row of docs.propsRows || []) {
      const nameGuess = String(row.prop || '').replace(/`/g, '').trim();
      if (!nameGuess) continue;
      const target = byName.get(nameGuess) || { name: nameGuess, type: row.type || 'unknown', required: false };
      if (row.type) target.type = row.type.replace(/`/g, '');
      if (row.default) target.default = row.default.replace(/`/g, '');
      if (row.description) target.description = row.description;
      if (!byName.has(nameGuess)) {
        byName.set(nameGuess, target);
        props.push(target);
      }
    }

    // DOM passthrough & css vars from ts
    const domPassthrough = ts.domPassthrough;
    const cssVars = ts.cssVars || [];

    // summary/description
    const summary = ts.summary || `${name} component`;
    const description = undefined;

    out[name] = {
      name,
      category: ts.category || 'unknown',
      slug: ts.slug || `components/${(ts.category || 'unknown')}/${name.toLowerCase()}`,
      summary,
      description,
      props,
      domPassthrough,
      cssVars,
      bestPractices: docs.bestPractices || [],
      examples: docs.examples || [],
      docsUrl: docs.docsUrl,
      sourceFiles: [...new Set([...(ts.sourceFiles || []), docs.sourceFile].filter(Boolean))],
      version,
    };
  }

  return out;
}

function indexFromComponents(map) {
  return Object.values(map).map((c) => ({ name: c.name, category: c.category, summary: c.summary, slug: c.slug }));
}

function main() {
  const root = process.cwd();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const version = pkg.version || '0.0.0';

  const tsMap = extractFromTs(root);
  const docsMap = (() => {
    try {
      return extractFromDocs(root);
    } catch (e) {
      console.warn('Docs extraction error:', e.message);
      return {};
    }
  })();

  const merged = merge(tsMap, docsMap, version);

  const outDir = path.join(root, 'mcp-data');
  const compDir = path.join(outDir, 'components');
  fs.mkdirSync(compDir, { recursive: true });

  // Write per-component
  for (const [name, doc] of Object.entries(merged)) {
    const safeSlug = doc.slug.replace(/\//g, '_');
    const fp = path.join(compDir, `${safeSlug}.json`);
    fs.writeFileSync(fp, JSON.stringify(doc, null, 2));
  }

  // Write index
  const index = indexFromComponents(merged);
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));

  // meta
  const meta = { version, builtAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2));

  console.log(`MCP data written to ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

