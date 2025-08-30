import fs from 'fs';
import path from 'path';

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function validateComponent(c) {
  const problems = [];
  if (!c.name || typeof c.name !== 'string') problems.push('missing name');
  if (!c.slug || typeof c.slug !== 'string') problems.push('missing slug');
  if (!Array.isArray(c.props)) problems.push('props not array');
  const seen = new Set();
  for (const p of c.props || []) {
    if (!p || typeof p.name !== 'string') problems.push('prop missing name');
    if (seen.has(p.name)) problems.push(`duplicate prop: ${p.name}`);
    seen.add(p.name);
  }
  const allowedCats = new Set(['primitives', 'fields', 'layout', 'widgets']);
  if (c.category && !allowedCats.has(c.category)) {
    // Allow unknown but flag it
    problems.push(`unknown category: ${c.category}`);
  }
  return problems;
}

function main() {
  const root = process.cwd();
  const dir = path.join(root, 'mcp-data');
  const idx = readJSON(path.join(dir, 'index.json'));
  const compDir = path.join(dir, 'components');
  const meta = readJSON(path.join(dir, '_meta.json'));
  let errors = 0;
  let warnings = 0;
  for (const item of idx) {
    const file = path.join(compDir, `${item.slug.replace(/\//g, '_')}.json`);
    if (!fs.existsSync(file)) {
      console.error(`[missing] ${item.slug}`);
      errors++;
      continue;
    }
    const doc = readJSON(file);
    const probs = validateComponent(doc);
    for (const p of probs) {
      const level = p.startsWith('unknown category') ? 'warn' : 'error';
      if (level === 'warn') warnings++; else errors++;
      console[level === 'warn' ? 'warn' : 'error'](`[${level}] ${item.name}: ${p}`);
    }
    if (doc.schemaVersion && meta.schemaVersion && doc.schemaVersion !== meta.schemaVersion) {
      console.warn(`[warn] ${item.name}: schemaVersion ${doc.schemaVersion} != meta ${meta.schemaVersion}`);
      warnings++;
    }
  }
  const ok = errors === 0;
  const summary = { ok, errors, warnings, components: idx.length, schemaVersion: meta.schemaVersion, buildHash: meta.buildHash };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

