import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractFromTs } from './extract-ts.mjs';
import { extractFromDocs } from './extract-docs.mjs';
import { extractGlossary } from './extract-glossary.mjs';
import { loadComponentMeta } from './load-meta.mjs';

const SCHEMA_VERSION = '1.6';

// Aliases are now sourced from per-component meta sidecars.

function merge(tsMap, docsMap, version, metaMap) {
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

    const aliases = (() => {
      const fromMeta = Array.isArray(metaMap?.[name]?.aliases) ? metaMap[name].aliases : [];
      const list = (fromMeta || []).map((s) => String(s).trim().toLowerCase());
      return Array.from(new Set(list.filter(Boolean)));
    })();

    // Usage guidance from sidecar meta (normalized to arrays where applicable)
    const usage = (() => {
      const raw = metaMap?.[name]?.usage;
      if (!raw) return undefined;
      const normArr = (arr) => Array.isArray(arr) ? Array.from(new Set(arr.map((s) => String(s).trim()).filter(Boolean))) : undefined;
      const purpose = typeof raw.purpose === 'string' ? raw.purpose.trim() : normArr(raw.purpose);
      const whenToUse = normArr(raw.whenToUse);
      const whenNotToUse = normArr(raw.whenNotToUse);
      const alternatives = normArr(raw.alternatives);
      const any = (purpose && (typeof purpose === 'string' ? purpose : purpose.length)) || (whenToUse && whenToUse.length) || (whenNotToUse && whenNotToUse.length) || (alternatives && alternatives.length);
      return any ? { purpose, whenToUse, whenNotToUse, alternatives } : undefined;
    })();

    // Docs URL and best practice slugs integration
    const docsUrl = docs.docsUrl || (metaMap?.[name]?.docs && metaMap[name].docs.docsUrl) || undefined;
    const bestPracticeSlugs = (() => {
      const shorten = (slug) => {
        const limit = 72;
        if (slug.length <= limit) return slug;
        const parts = slug.split('-');
        let out = '';
        for (const p of parts) {
          if (!p) continue;
          if ((out ? out.length + 1 : 0) + p.length > limit) break;
          out = out ? `${out}-${p}` : p;
        }
        return out || slug.slice(0, limit);
      };
      const metaSlugs = Array.isArray(metaMap?.[name]?.docs?.bestPracticeSlugs)
        ? metaMap[name].docs.bestPracticeSlugs
        : [];
      const fromMeta = metaSlugs
        .map((s) => String(s))
        .map((s) => s.trim().toLowerCase())
        .map((s) => s.replace(/\s+/g, '-').replace(/_/g, '-'))
        .map((s) => s.replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);
      const fromDocs = Array.isArray(docs.bestPractices)
        ? docs.bestPractices
            .map((s) => String(s))
            .map((s) => s.toLowerCase().trim())
            .map((s) => s.replace(/`[^`]+`/g, ''))
            .map((s) => s.replace(/[^a-z0-9\s-]/g, ''))
            .map((s) => s.replace(/\s+/g, '-'))
            .map((s) => s.replace(/-+/g, '-'))
            .map((s) => s.replace(/^-+|-+$/g, ''))
            .filter(Boolean)
        : [];
      const merged = Array.from(new Set([...fromMeta, ...fromDocs].map(shorten)));
      return merged.length ? merged : undefined;
    })();

    const status = (() => {
      const raw = metaMap?.[name]?.status;
      const allowed = new Set(['golden', 'stable', 'experimental', 'unstable', 'deprecated']);
      if (allowed.has(raw)) return raw;
      return undefined;
    })();

    const bestPractices = Array.isArray(metaMap?.[name]?.docs?.bestPractices) && metaMap[name].docs.bestPractices.length
      ? metaMap[name].docs.bestPractices
      : (docs.bestPractices || []);

    // Examples: prefer curated ones from sidecar meta; optionally only curated
    const rawExamples = Array.isArray(metaMap?.[name]?.examples) ? metaMap[name].examples : [];

    out[name] = {
      name,
      category: ts.category || 'unknown',
      slug: ts.slug || `components/${(ts.category || 'unknown')}/${name.toLowerCase()}`,
      summary,
      description,
      status,
      aliases: aliases.length ? aliases : undefined,
      usage,
      props,
      domPassthrough,
      cssVars,
      cssPresets,
      events: ts.events || [],
      actions: ts.actions || [],
      slots: ts.slots || [],
      bestPractices,
      bestPracticeSlugs,
      examples: rawExamples.map((ex, i) => ({
        id: ex.id || `${name.toLowerCase()}-ex-${i + 1}`,
        title: ex.title,
        code: ex.code,
        lang: ex.lang || 'tsx',
        source: ex.source,
        runnable: ex.runnable ?? true,
        minimalProps,
      })),
      docsUrl,
      sourceFiles: [...new Set([...(ts.sourceFiles || []), docs.sourceFile].filter(Boolean))],
      version,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  return out;
}

function indexFromComponents(map) {
  return Object.values(map).map((c) => ({
    name: c.name,
    category: c.category,
    summary: c.summary,
    slug: c.slug,
    // include status in the index for fast filtering without opening per-component docs
    status: c.status,
  }));
}

async function main() {
  const root = process.cwd();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const version = pkg.version || '0.0.0';

  const tsMap = extractFromTs(root);
  // Per-component sidecar meta (aliases live here now)
  let metaMap = {};
  try {
    metaMap = await loadComponentMeta(root);
  } catch (e) {
    console.warn('Meta sidecar load error:', e?.message || e);
  }
  // Validate meta against TS components and prune unknown entries
  try {
    const validNames = new Set(Object.keys(tsMap));
    for (const k of Object.keys(metaMap)) {
      if (!validNames.has(k)) {
        console.warn(`[meta] Orphan meta for '${k}' (no matching TS component); ignoring.`);
        delete metaMap[k];
      }
    }
  } catch {}
  const docsMap = (() => {
    try {
      return extractFromDocs(root);
    } catch (e) {
      console.warn('Docs extraction error:', e.message);
      return {};
    }
  })();

  const merged = merge(tsMap, docsMap, version, metaMap);

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

  // Component synonyms (alias -> [component names])
  /** @type {Record<string, string[]>} */
  const synonyms = {};
  for (const c of Object.values(merged)) {
    const aliases = Array.isArray(c.aliases) ? c.aliases : [];
    for (const a of aliases) {
      const key = String(a).trim().toLowerCase();
      if (!key) continue;
      if (!synonyms[key]) synonyms[key] = [];
      if (!synonyms[key].includes(c.name)) synonyms[key].push(c.name);
    }
  }
  const synPath = path.join(outDir, 'component_synonyms.json');
  // Always write the file, even if empty. The server has built-in defaults,
  // but emitting an empty object avoids validator warnings and clarifies intent.
  fs.writeFileSync(synPath, JSON.stringify(synonyms, null, 2));

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
