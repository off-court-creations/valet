// ─────────────────────────────────────────────────────────────
// scripts/verify-pack.mjs  | valet
// Pack guard (ruling R2 — layout-agnostic, PACKAGING owns):
// every path referenced by main/module/types/exports in package.json
// must exist on disk AND appear in `npm pack --dry-run --json`, and at
// least one dist JS artifact (dist/**/*.{js,mjs,cjs}) must ship.
// Exits non-zero with a listing of every missing path.
// CLI: node scripts/verify-pack.mjs [--root <dir>]
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/** `./dist/index.js` → `dist/index.js` (npm pack lists paths without `./`). */
export function normalizeRelPath(p) {
  return String(p).replace(/^\.\//, '');
}

/**
 * Collect every file path the package shape references, with the field
 * that references it. Walks `exports` recursively (condition objects and
 * fallback arrays); string leaves are paths per the Node resolution spec.
 * Layout-agnostic: nothing here assumes dist/, file names, or formats.
 * Returns [{ field, path }].
 */
export function collectExportPaths(pkg) {
  const refs = [];
  for (const field of ['main', 'module', 'types']) {
    if (typeof pkg[field] === 'string') refs.push({ field, path: pkg[field] });
  }
  const walk = (node, trail) => {
    if (typeof node === 'string') {
      refs.push({ field: trail, path: node });
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${trail}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        walk(value, `${trail}[${JSON.stringify(key)}]`);
      }
    }
  };
  if (pkg.exports !== undefined) walk(pkg.exports, 'exports');
  return refs;
}

/** True for packed paths that count as a shipped dist JS artifact. */
export function isDistJsArtifact(packedPath) {
  return /^dist\/.+\.(mjs|cjs|js)$/.test(packedPath);
}

/**
 * Pure gate: returns a list of problem strings (empty array = pass).
 * `fileExists` is injected (relative path → boolean) so the check is
 * testable without touching the real filesystem.
 */
export function verifyPack({ pkg, packedPaths, fileExists }) {
  const problems = [];
  const refs = collectExportPaths(pkg);
  if (refs.length === 0) {
    problems.push('package.json declares no main/module/types/exports entry points');
  }
  const packed = new Set(packedPaths.map(normalizeRelPath));
  for (const { field, path: ref } of refs) {
    if (ref.includes('*')) continue; // pattern subpaths cannot be resolved statically
    const rel = normalizeRelPath(ref);
    if (!fileExists(rel)) problems.push(`${field} → ${ref}: missing on disk`);
    if (!packed.has(rel)) problems.push(`${field} → ${ref}: not in the npm pack file list`);
  }
  if (!packedPaths.some((p) => isDistJsArtifact(normalizeRelPath(p)))) {
    problems.push(
      'npm pack ships no dist JS artifact (expected at least one dist/**/*.{js,mjs,cjs})',
    );
  }
  return problems;
}

/** Run `npm pack --dry-run --json` and return the packed file paths. */
export function readPackFileList(root) {
  // --ignore-scripts keeps prepack (npm run build) from mutating the tree
  // mid-check: this guard verifies the tree as it stands.
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const report = JSON.parse(stdout);
  const entry = Array.isArray(report) ? report[0] : report;
  return (entry?.files ?? []).map((f) => f.path);
}

function parseArgs(argv) {
  let root = path.resolve(fileURLToPath(import.meta.url), '../..');
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) root = path.resolve(argv[i + 1]);
  return { root };
}

/** Thin CLI wrapper; returns the intended exit code. */
export function main(argv = process.argv.slice(2)) {
  const { root } = parseArgs(argv);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const packedPaths = readPackFileList(root);
  const problems = verifyPack({
    pkg,
    packedPaths,
    fileExists: (rel) => fs.existsSync(path.join(root, rel)),
  });
  if (problems.length === 0) {
    console.log(
      `verify-pack: OK — ${packedPaths.length} packed file(s); every main/module/types/exports path exists and ships`,
    );
    return 0;
  }
  console.error(`verify-pack: FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  return 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(main());
}
