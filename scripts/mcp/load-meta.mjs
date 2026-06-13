import fs from 'fs';
import path from 'path';

/**
 * Load per-component meta sidecars from paths like:
 *   src/components/(category)/(Name).meta.json
 * Returns a map keyed by component name -> normalized meta object.
 *
 * Sidecars are JSON-only. The legacy `.meta.ts`/`.meta.js` + Babel compile
 * pipeline (and its `src/mcp/metaTypes.ts` helper) was removed: no component
 * ever shipped a non-JSON sidecar, so the branch was dead code.
 */
export async function loadComponentMeta(rootDir) {
  const componentsDir = path.join(rootDir, 'src', 'components');
  /** @type {Record<string, any>} */
  const byName = {};

  if (!fs.existsSync(componentsDir)) return byName;

  /** @type {string[]} */
  const files = [];
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile() && /\.meta\.json$/.test(e.name)) files.push(fp);
    }
  };
  walk(componentsDir);

  for (const fp of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
      const meta = normalizeMeta(raw, fp);
      if (meta?.name) byName[meta.name] = meta;
    } catch (e) {
      console.warn('[meta] Failed to load', fp, '-', e?.message || String(e));
    }
  }

  return byName;
}

/**
 * Normalize and validate a raw meta object
 * @param {any} raw
 * @param {string} source
 */
function normalizeMeta(raw, source) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  // Dotted subcomponent names (Tabs.Tab, Select.Option, …) are valid sidecar
  // keys: each segment is a PascalCase component identifier (plan §3.9 S10).
  if (!name || !/^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)*$/.test(name)) {
    console.warn(`[meta] Invalid or missing name in ${source}`);
    return null;
  }
  const aliases = Array.isArray(raw.aliases)
    ? Array.from(new Set(raw.aliases.map((s) => String(s).trim().toLowerCase()).filter(Boolean)))
    : undefined;

  // Shallow clone and attach normalized aliases
  const out = { ...raw, name };
  if (aliases?.length) out.aliases = aliases;
  else delete out.aliases;
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const root = process.cwd();
    const res = await loadComponentMeta(root);
    const outDir = path.join(root, 'mcp-data');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, '_meta-sidecars.json'), JSON.stringify(res, null, 2));
    console.log('Wrote', path.join(outDir, '_meta-sidecars.json'));
  })();
}
