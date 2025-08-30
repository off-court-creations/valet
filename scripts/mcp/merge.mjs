import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractFromTs } from './extract-ts.mjs';
import { extractFromDocs } from './extract-docs.mjs';
import { extractGlossary } from './extract-glossary.mjs';

const SCHEMA_VERSION = '1.2';

function merge(tsMap, docsMap, version) {
  /** @type {Record<string, any>} */
  const out = {};

  // Only include components that exist in TS. Docs enrich them.
  const allNames = new Set(Object.keys(tsMap));
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
    const cssPresets = ts.cssPresets || [];

    // summary/description
    const summary = ts.summary || `${name} component`;
    const description = undefined;

    // Compute minimalProps for runnable examples: required props without defaults
    const minimalProps = (() => {
      const out = {};
      for (const p of props) {
        if (!p.required) continue;
        if (p.default != null) continue;
        const t = (p.type || '').toLowerCase();
        if (/^boolean\b/.test(t)) out[p.name] = false;
        else if (/^number\b/.test(t)) out[p.name] = 0;
        else if (/^string\b/.test(t)) out[p.name] = (p.enumValues && p.enumValues[0]) ? p.enumValues[0] : '';
        else if (/react\./.test(p.type) || /jsx\./i.test(p.type)) out[p.name] = '<div />';
        else if (/=>/.test(p.type) || /^function/i.test(p.type) || /^\(/.test(p.type)) out[p.name] = '() => {}';
        else if (/\[\]/.test(p.type)) out[p.name] = [];
        else out[p.name] = null;
      }
      return out;
    })();

    out[name] = {
      name,
      category: ts.category || 'unknown',
      slug: ts.slug || `components/${(ts.category || 'unknown')}/${name.toLowerCase()}`,
      summary,
      description,
      props,
      domPassthrough,
      cssVars,
      cssPresets,
      events: ts.events || [],
      actions: ts.actions || [],
      slots: ts.slots || [],
      bestPractices: docs.bestPractices || [],
      examples: (docs.examples || []).map((ex) => ({ ...ex, runnable: ex.runnable ?? true, minimalProps })),
      docsUrl: docs.docsUrl,
      sourceFiles: [...new Set([...(ts.sourceFiles || []), docs.sourceFile].filter(Boolean))],
      version,
      schemaVersion: SCHEMA_VERSION,
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
  // Clean output dir to avoid stale entries (e.g., old docs pages)
  fs.rmSync(compDir, { recursive: true, force: true });
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
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify({ merged, index }))
    .digest('hex');
  const meta = { version, builtAt: new Date().toISOString(), schemaVersion: SCHEMA_VERSION, buildHash: hash };
  fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2));

  // Glossary
  try {
    const glossary = extractGlossary(root);
    fs.writeFileSync(path.join(outDir, 'glossary.json'), JSON.stringify({ entries: glossary, version, builtAt: meta.builtAt }, null, 2));
  } catch (e) {
    console.warn('Glossary extraction error:', e.message);
  }

  console.log(`MCP data written to ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
