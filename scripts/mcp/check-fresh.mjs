// ─────────────────────────────────────────────────────────────
// scripts/mcp/check-fresh.mjs | valet (MCP-TRUTH S8)
// Freshness guard for the committed MCP corpus (`mcp:check`).
//
// Rebuilds the corpus in memory via buildCorpus(root) — the exact
// code path `mcp:build` uses — and diffs it against the committed
// mcp-data/ (and the shipped mirror in packages/valet-mcp/mcp-data).
// Any drift exits 1 listing the stale/missing/extra files.
//
// Determinism policy (deliberate exclusions, see plan §3.9 S8):
//  • `builtAt` (in _meta.json and glossary.json) is wall-clock — excluded.
//  • `buildHash` (_meta.json) is a sha1 over the in-memory corpus whose
//    object-key order follows filesystem enumeration order; it is stable
//    per checkout but not guaranteed across machines. It is excluded from
//    the diff; instead every file's CONTENT is compared canonically
//    (recursively key-sorted, order-insensitive where enumeration order
//    leaks: index entries, synonym target lists). Content equality is
//    strictly stronger than hash equality — it also covers glossary.json
//    and component_synonyms.json, which buildHash never included.
//  • buildCorpus rewrites mcp-data/_routes.json as a side effect
//    (extract-docs route artifact). The committed bytes are snapshotted
//    before the build, compared against the regenerated truth, and
//    restored afterwards so this checker never mutates the tree.
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { buildCorpus } from './merge.mjs';

/** Mirror files copied into packages/valet-mcp/mcp-data by mcp:build. */
export const MIRROR_FILES = [
  '_meta.json',
  'index.json',
  'glossary.json',
  'component_synonyms.json',
];

/** Recursively sort object keys so comparisons ignore insertion order. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
    return out;
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value), null, 2);
}

const bySlug = (a, b) => String(a?.slug ?? '').localeCompare(String(b?.slug ?? ''));

const sortSynonyms = (synonyms) => {
  const out = {};
  for (const k of Object.keys(synonyms || {})) {
    out[k] = Array.isArray(synonyms[k]) ? [...synonyms[k]].sort() : synonyms[k];
  }
  return out;
};

/**
 * Project an in-memory corpus onto the file layout mcp:build writes,
 * with the volatile fields (builtAt, buildHash) deliberately excluded.
 * @param {Awaited<ReturnType<typeof buildCorpus>>} corpus
 * @returns {Record<string, unknown>} relative path → expected JSON value
 */
export function expectedFilesFromCorpus(corpus) {
  /** @type {Record<string, unknown>} */
  const expected = {};
  for (const doc of Object.values(corpus.components)) {
    const safeSlug = String(doc.slug).replace(/\//g, '_');
    expected[`components/${safeSlug}.json`] = doc;
  }
  expected['index.json'] = [...corpus.index].sort(bySlug);
  // `_ts-extract.json` is a gitignored intermediate dump (not committed, not
  // part of the shipped corpus), so a clean checkout never has it on disk —
  // excluding it keeps freshness about the SERVED data, not build artifacts.
  expected['component_synonyms.json'] = sortSynonyms(corpus.synonyms);
  if (corpus.glossary) {
    expected['glossary.json'] = { entries: corpus.glossary, version: corpus.version };
  }
  expected['_meta.json'] = { version: corpus.version, schemaVersion: corpus.schemaVersion };
  return expected;
}

/**
 * Normalize a value read from disk into the same shape as the expected
 * projection (strip volatile fields, neutralize enumeration order).
 */
export function normalizeActual(relPath, value) {
  if (relPath === '_meta.json' && value && typeof value === 'object') {
    return { version: value.version, schemaVersion: value.schemaVersion };
  }
  if (relPath === 'glossary.json' && value && typeof value === 'object') {
    return { entries: value.entries, version: value.version };
  }
  if (relPath === 'index.json' && Array.isArray(value)) {
    return [...value].sort(bySlug);
  }
  if (relPath === 'component_synonyms.json' && value && typeof value === 'object') {
    return sortSynonyms(value);
  }
  return value;
}

/**
 * Diff an expected file map against a directory on disk.
 * Pure given the filesystem: reads only, never writes.
 * @param {Record<string, unknown>} expected relative path → JSON value
 * @param {string} dir absolute path of the mcp-data directory to verify
 * @returns {{ ok: boolean, stale: string[], missing: string[], extra: string[] }}
 */
export function diffAgainstDir(expected, dir) {
  const stale = [];
  const missing = [];
  const extra = [];

  for (const [relPath, expectedValue] of Object.entries(expected)) {
    const fp = path.join(dir, relPath);
    if (!fs.existsSync(fp)) {
      missing.push(relPath);
      continue;
    }
    let actual;
    try {
      actual = JSON.parse(fs.readFileSync(fp, 'utf8'));
    } catch {
      stale.push(`${relPath} (unparseable JSON)`);
      continue;
    }
    if (stableStringify(normalizeActual(relPath, actual)) !== stableStringify(expectedValue)) {
      stale.push(relPath);
    }
  }

  // Stale leftovers: component files the rebuild no longer produces.
  const compDir = path.join(dir, 'components');
  if (fs.existsSync(compDir)) {
    for (const fn of fs.readdirSync(compDir).sort()) {
      const rel = `components/${fn}`;
      if (!(rel in expected)) extra.push(rel);
    }
  }

  return {
    ok: stale.length === 0 && missing.length === 0 && extra.length === 0,
    stale,
    missing,
    extra,
  };
}

/**
 * Build the corpus and capture the regenerated _routes.json truth while
 * leaving the working tree byte-for-byte as found (snapshot/restore around
 * buildCorpus's documented _routes.json side effect).
 * @param {string} root
 * @returns {Promise<{ corpus: Awaited<ReturnType<typeof buildCorpus>>, routesTruth: unknown|null }>}
 */
export async function buildCorpusCaptureRoutes(root) {
  const routesPath = path.join(root, 'mcp-data', '_routes.json');
  const before = fs.existsSync(routesPath) ? fs.readFileSync(routesPath) : null;
  let corpus;
  let routesTruth = null;
  try {
    corpus = await buildCorpus(root);
    if (fs.existsSync(routesPath)) {
      try {
        routesTruth = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
      } catch {
        routesTruth = null;
      }
    }
  } finally {
    // Restore the committed bytes: a checker must never mutate the tree.
    if (before === null) fs.rmSync(routesPath, { force: true });
    else fs.writeFileSync(routesPath, before);
  }
  return { corpus, routesTruth };
}

function report(label, result) {
  for (const f of result.missing) console.error(`  STALE (missing):  ${label}/${f}`);
  for (const f of result.stale) console.error(`  STALE (content):  ${label}/${f}`);
  for (const f of result.extra) console.error(`  STALE (orphaned): ${label}/${f}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dirFlag = args.indexOf('--data-dir');
  const overrideDir = dirFlag !== -1 ? path.resolve(args[dirFlag + 1] || '') : null;

  const root = process.cwd();
  const { corpus, routesTruth } = await buildCorpusCaptureRoutes(root);

  if (corpus.glossaryError) {
    console.error(`mcp:check ✗ glossary extraction failed: ${corpus.glossaryError.message}`);
    process.exit(1);
  }

  const expected = expectedFilesFromCorpus(corpus);
  if (routesTruth != null) expected['_routes.json'] = routesTruth;
  else
    console.warn(
      'mcp:check: _routes.json was not produced by the build; skipping routes comparison.',
    );

  /** @type {Array<{ label: string, result: ReturnType<typeof diffAgainstDir> }>} */
  const runs = [];
  if (overrideDir) {
    // Test/rehearsal hook: verify a copied/mutated dataset instead.
    runs.push({ label: overrideDir, result: diffAgainstDir(expected, overrideDir) });
  } else {
    runs.push({ label: 'mcp-data', result: diffAgainstDir(expected, path.join(root, 'mcp-data')) });
    // The shipped mirror never carries _routes.json.
    const mirrorExpected = { ...expected };
    delete mirrorExpected['_routes.json'];
    runs.push({
      label: 'packages/valet-mcp/mcp-data',
      result: diffAgainstDir(mirrorExpected, path.join(root, 'packages', 'valet-mcp', 'mcp-data')),
    });
  }

  const failed = runs.filter((r) => !r.result.ok);
  if (failed.length) {
    console.error(
      'mcp:check ✗ committed MCP corpus is stale — run `npm run mcp:build` and commit the result:',
    );
    for (const r of failed) report(r.label, r.result);
    process.exit(1);
  }

  const fileCount = Object.keys(expected).length;
  console.log(
    `mcp:check ✓ committed MCP corpus is fresh (${fileCount} files, ${corpus.index.length} components, ${corpus.glossary?.length ?? 0} glossary entries).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('mcp:check ✗ failed to rebuild corpus:', err?.stack || err);
    process.exit(1);
  });
}
