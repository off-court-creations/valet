import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import babel from '@babel/core';

/**
 * Load per-component meta sidecars from paths like:
 *   src/components/(category)/(Name).meta.{ts,js,json}
 * Returns a map keyed by component name -> normalized meta object.
 *
 * Supports:
 *  - TypeScript/ESM default export (compiled via Babel on-the-fly to a temp .mjs)
 *  - JSON files exporting the raw object
 */
export async function loadComponentMeta(rootDir) {
  const componentsDir = path.join(rootDir, 'src', 'components');
  /** @type {Record<string, any>} */
  const byName = {};

  if (!fs.existsSync(componentsDir)) return byName;

  const tmpDir = path.join(rootDir, 'mcp-data', '_tmp-meta');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  /** @type {string[]} */
  const files = [];
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile() && /\.meta\.(ts|js|json)$/.test(e.name)) files.push(fp);
    }
  };
  walk(componentsDir);

  for (const fp of files) {
    try {
      if (fp.endsWith('.json')) {
        const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
        const meta = normalizeMeta(raw, fp);
        if (meta?.name) byName[meta.name] = meta;
      } else {
        const rel = path.relative(componentsDir, fp).replace(/\\/g, '/');
        const outPath = path.join(tmpDir, rel).replace(/\.(ts|js)$/i, '.mjs');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        // Ensure shim exists
        const shimPath = path.join(tmpDir, 'valet-meta-shim.mjs');
        if (!fs.existsSync(shimPath)) {
          fs.writeFileSync(
            shimPath,
            "export const defineComponentMeta = (x) => x; export default { defineComponentMeta };\n",
            'utf8',
          );
        }
        const relShim = path
          .relative(path.dirname(outPath), shimPath)
          .replace(/\\/g, '/');
        let code = fs.readFileSync(fp, 'utf8');
        // Rewrite helper import to point at local shim
        code = code.replace(/from\s+['\"][.\/]+mcp\/metaTypes['\"]/g, `from '${relShim.startsWith('.') ? relShim : './' + relShim}'`);
        const { code: out } = babel.transformSync(code, {
          filename: fp,
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' }, modules: false }],
            '@babel/preset-typescript',
          ],
          sourceMaps: false,
          babelrc: false,
          configFile: false,
        });
        fs.writeFileSync(outPath, out, 'utf8');
        const mod = await import(pathToFileURL(outPath).href);
        const raw = mod?.default ?? mod?.meta ?? null;
        const meta = normalizeMeta(raw, fp);
        if (meta?.name) byName[meta.name] = meta;
      }
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
  if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    console.warn(`[meta] Invalid or missing name in ${source}`);
    return null;
  }
  const aliases = Array.isArray(raw.aliases)
    ? Array.from(
        new Set(
          raw.aliases
            .map((s) => String(s).trim().toLowerCase())
            .filter(Boolean),
        ),
      )
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
