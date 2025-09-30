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
  if (c.aliases && !Array.isArray(c.aliases)) problems.push('aliases must be an array');
  // status validation (REQUIRED and constrained)
  {
    const allowedStatus = new Set(['production', 'stable', 'experimental', 'unstable', 'deprecated']);
    if (!c.status) {
      problems.push('missing status');
    } else if (!allowedStatus.has(c.status)) {
      problems.push(`invalid status: ${c.status}`);
    }
  }
  // usage validation (optional, non-fatal)
  if (c.usage && typeof c.usage !== 'object') problems.push('usage must be an object');
  if (c.usage && typeof c.usage === 'object') {
    const u = c.usage;
    if (u.purpose && !(typeof u.purpose === 'string' || Array.isArray(u.purpose))) problems.push('usage.purpose must be string or string[]');
    if (Array.isArray(u.purpose)) {
      for (const p of u.purpose) if (typeof p !== 'string' || !p.trim()) problems.push('usage.purpose contains invalid entry');
    }
    if (u.whenToUse && !Array.isArray(u.whenToUse)) problems.push('usage.whenToUse must be string[]');
    if (Array.isArray(u.whenToUse)) for (const it of u.whenToUse) if (typeof it !== 'string' || !it.trim()) problems.push('usage.whenToUse contains invalid entry');
    if (u.whenNotToUse && !Array.isArray(u.whenNotToUse)) problems.push('usage.whenNotToUse must be string[]');
    if (Array.isArray(u.whenNotToUse)) for (const it of u.whenNotToUse) if (typeof it !== 'string' || !it.trim()) problems.push('usage.whenNotToUse contains invalid entry');
    if (u.alternatives && !Array.isArray(u.alternatives)) problems.push('usage.alternatives must be string[]');
    if (Array.isArray(u.alternatives)) for (const it of u.alternatives) if (typeof it !== 'string' || !it.trim()) problems.push('usage.alternatives contains invalid entry');
  }
  if (Array.isArray(c.aliases)) {
    const seen = new Set();
    for (const a of c.aliases) {
      if (typeof a !== 'string' || !a.trim()) problems.push('alias must be non-empty string');
      const low = String(a).trim().toLowerCase();
      if (seen.has(low)) problems.push(`duplicate alias: ${a}`);
      seen.add(low);
      if (/\s/.test(low)) problems.push(`alias should not contain spaces: ${a}`);
    }
  }
  const seen = new Set();
  let requiredCount = 0;
  let anyCount = 0;
  let hasDefaultAndRequired = false;
  let hasHtmlishProps = false;
  for (const p of c.props || []) {
    if (!p || typeof p.name !== 'string') problems.push('prop missing name');
    if (seen.has(p.name)) problems.push(`duplicate prop: ${p.name}`);
    seen.add(p.name);
    if (p.required) requiredCount++;
    if (typeof p.type === 'string' && p.type.trim() === 'any') anyCount++;
    if (p.required && p.default != null) hasDefaultAndRequired = true;
    if (['onClick','id','className','style','role','aria-label'].includes(p.name)) hasHtmlishProps = true;
  }
  const allowedCats = new Set(['primitives', 'fields', 'layout', 'widgets']);
  if (c.category && !allowedCats.has(c.category)) {
    // Allow unknown but flag it
    problems.push(`unknown category: ${c.category}`);
  }
  // Heuristics/warnings
  if ((c.props || []).length === 0 && c.category && c.category !== 'primitives') {
    problems.push('warn: no props extracted (suspicious for non-primitive component)');
  }
  if ((c.props || []).length >= 4) {
    const ratio = requiredCount / (c.props || []).length;
    if (ratio > 0.7) problems.push(`warn: unusually high required prop ratio (${Math.round(ratio*100)}%)`);
  }
  if (hasDefaultAndRequired) problems.push('warn: some props are marked required but have defaults (likely optional at callsite)');
  if ((c.props || []).length > 0 && anyCount >= Math.ceil((c.props || []).length / 2)) {
    problems.push('warn: many props have type any');
  }
  if (!c.domPassthrough && hasHtmlishProps) {
    problems.push('warn: html-like props present but domPassthrough is missing');
  }
  return problems;
}

function main() {
  const root = process.cwd();
  const dir = path.join(root, 'mcp-data');
  const idx = readJSON(path.join(dir, 'index.json'));
  const compDir = path.join(dir, 'components');
  const meta = readJSON(path.join(dir, '_meta.json'));
  const compNames = new Set(idx.map((i) => i.name));
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
    // Cross-validate index vs document
    try {
      if (item.name !== doc.name) {
        console.error(`[error] index/doc name mismatch: index='${item.name}' doc='${doc.name}'`);
        errors++;
      }
      if (item.slug !== doc.slug) {
        console.error(`[error] index/doc slug mismatch: index='${item.slug}' doc='${doc.slug}'`);
        errors++;
      }
      if (item.category !== doc.category) {
        console.error(`[error] index/doc category mismatch: index='${item.category}' doc='${doc.category}'`);
        errors++;
      }
      const allowedStatus = new Set(['production', 'stable', 'experimental', 'unstable', 'deprecated']);
      if (doc.status && !allowedStatus.has(doc.status)) {
        console.error(`[error] doc status invalid: ${doc.status}`);
        errors++;
      }
      if (item.status && !allowedStatus.has(item.status)) {
        console.error(`[error] index status invalid: ${item.status}`);
        errors++;
      }
      if (!doc.status && !item.status) {
        console.error(`[error] ${item.name}: missing status (doc and index)`);
        errors++;
      }
      if (doc.status && !item.status) {
        console.error(`[error] index missing status for ${item.name}`);
        errors++;
      }
      if (item.status && !doc.status) {
        console.error(`[error] doc missing status for ${item.name}`);
        errors++;
      }
      if (item.status && doc.status && item.status !== doc.status) {
        console.error(`[error] index/doc status mismatch for ${item.name}: index='${item.status}' doc='${doc.status}'`);
        errors++;
      }
    } catch (e) {
      console.warn('[warn] index/doc cross-validate failed:', e?.message || String(e));
      warnings++;
    }
    const probs = validateComponent(doc);
    for (const p of probs) {
      const isWarnPrefix = typeof p === 'string' && p.startsWith('warn:');
      const level = p.startsWith('unknown category') || isWarnPrefix ? 'warn' : 'error';
      if (level === 'warn') warnings++; else errors++;
      const msg = isWarnPrefix ? p.replace(/^warn:\s*/, '') : p;
      console[level === 'warn' ? 'warn' : 'error'](`[${level}] ${item.name}: ${msg}`);
    }
    if (doc.schemaVersion && meta.schemaVersion && doc.schemaVersion !== meta.schemaVersion) {
      console.warn(`[warn] ${item.name}: schemaVersion ${doc.schemaVersion} != meta ${meta.schemaVersion}`);
      warnings++;
    }
    // Curated examples policy
    if (doc.docsUrl) {
      const hasExamples = Array.isArray(doc.examples) && doc.examples.length > 0;
      if (!hasExamples) {
        console.warn(`[warn] ${item.name}: docsUrl present but no examples`);
        warnings++;
      }
    }
  }
  // Component synonyms validation
  try {
    const synPath = path.join(dir, 'component_synonyms.json');
    if (!fs.existsSync(synPath)) {
      console.warn('[warn] component_synonyms.json missing');
      warnings++;
    } else {
      const syn = readJSON(synPath);
      if (!syn || typeof syn !== 'object') {
        console.error('[error] component_synonyms.json must be an object');
        errors++;
      } else {
        for (const [alias, targets] of Object.entries(syn)) {
          if (!/^[a-z0-9-]+$/.test(alias)) {
            console.warn(`[warn] component_synonyms alias '${alias}' contains unusual characters`);
            warnings++;
          }
          if (!Array.isArray(targets) || targets.length === 0) {
            console.error(`[error] alias '${alias}' must map to a non-empty array of component names`);
            errors++;
            continue;
          }
          const seen = new Set();
          for (const t of targets) {
            if (seen.has(t)) {
              console.warn(`[warn] alias '${alias}' has duplicate target '${t}'`);
              warnings++;
            }
            seen.add(t);
            if (!compNames.has(t)) {
              console.error(`[error] alias '${alias}' references missing component '${t}'`);
              errors++;
            }
          }
          if (targets.length > 3) {
            console.warn(`[warn] alias '${alias}' maps to ${targets.length} components; consider narrowing`);
            warnings++;
          }
        }
      }
    }
  } catch (e) {
    console.error('[error] component_synonyms validation failed:', e.message);
    errors++;
  }
  // Glossary validation (optional)
  let glossaryEntries = 0;
  try {
    const glossaryPath = path.join(dir, 'glossary.json');
    if (!fs.existsSync(glossaryPath)) {
      console.warn('[warn] glossary.json missing');
      warnings++;
    } else {
      const g = readJSON(glossaryPath);
      const entries = Array.isArray(g.entries) ? g.entries : [];
      glossaryEntries = entries.length;
      if (!Array.isArray(g.entries)) {
        console.error('[error] glossary.json: entries must be an array');
        errors++;
      } else {
        const termSet = new Set();
        const allTermsLower = new Set();
        for (const e of entries) {
          if (!e || typeof e.term !== 'string' || !e.term.trim()) {
            console.error('[error] glossary entry missing term');
            errors++;
            continue;
          }
          if (!e.definition || typeof e.definition !== 'string' || !e.definition.trim()) {
            console.error(`[error] glossary ${e.term}: missing definition`);
            errors++;
          }
          const key = e.term.trim().toLowerCase();
          if (allTermsLower.has(key)) {
            console.error(`[error] glossary duplicate term: ${e.term}`);
            errors++;
          }
          termSet.add(e.term);
          allTermsLower.add(key);
          if (e.aliases && !Array.isArray(e.aliases)) {
            console.error(`[error] glossary ${e.term}: aliases must be an array`);
            errors++;
          }
          if (Array.isArray(e.aliases)) {
            const aliasSet = new Set();
            for (const a of e.aliases) {
              if (typeof a !== 'string' || !a.trim()) {
                console.error(`[error] glossary ${e.term}: invalid alias value`);
                errors++;
                continue;
              }
              if (aliasSet.has(a.toLowerCase())) {
                console.warn(`[warn] glossary ${e.term}: duplicate alias '${a}'`);
                warnings++;
              }
              aliasSet.add(a.toLowerCase());
              if (allTermsLower.has(a.toLowerCase()) && a.toLowerCase() !== key) {
                console.warn(`[warn] glossary ${e.term}: alias '${a}' conflicts with another term`);
                warnings++;
              }
            }
          }
          if (e.seeAlso && !Array.isArray(e.seeAlso)) {
            console.error(`[error] glossary ${e.term}: seeAlso must be an array`);
            errors++;
          }
        }
        // Validate seeAlso references if possible
        // Accept references to either other glossary terms OR component names OR known MCP tool ids
        const knownTools = new Set([
          'get_component',
          'search_components',
          'get_glossary',
          'define_term',
          'list_components',
        ]);
        const allowedRefs = (ref) => termSet.has(ref) || compNames.has(ref) || knownTools.has(ref);
        for (const e of entries) {
          if (!Array.isArray(e.seeAlso)) continue;
          for (const ref of e.seeAlso) {
            if (typeof ref !== 'string') continue;
            if (!allowedRefs(ref)) {
              console.warn(`[warn] glossary ${e.term}: seeAlso '${ref}' not found`);
              warnings++;
            }
          }
        }
        // Check sorted order (optional warn)
        const sorted = [...entries].map((x) => x.term).sort((a, b) => a.localeCompare(b));
        const actual = entries.map((x) => x.term);
        if (sorted.join('\n') !== actual.join('\n')) {
          console.warn('[warn] glossary entries not sorted by term');
          warnings++;
        }
      }
    }
  } catch (e) {
    console.error('[error] glossary validation failed:', e.message);
    errors++;
  }

  const ok = errors === 0;
  const summary = { ok, errors, warnings, components: idx.length, schemaVersion: meta.schemaVersion, buildHash: meta.buildHash, glossaryEntries };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
