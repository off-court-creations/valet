// ─────────────────────────────────────────────────────────────
// scripts/release/check-pins.mjs  | valet
// Release gate: docs/package.json and the create-valet-app template
// package.json files must pin @archway/valet at the root version
// (audit found docs at ^0.33.0 and templates at ^0.31.1 vs 0.34.1).
//
// ALSO verifies that any sibling package-lock.json actually RESOLVES
// @archway/valet at the root version — a matching package.json pin with a
// stale lockfile passes the pin check but breaks `npm ci` (EUSAGE: "lock
// file's @archway/valet@X does not satisfy Y"), which is what failed the
// Amplify docs deploy after 0.35.x. A pin string check alone cannot catch it.
//
// CLI: node scripts/release/check-pins.mjs [--warn] [--root <dir>]
// (--warn reports problems without failing, for non-release CI)
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const PKG_NAME = '@archway/valet';
const TEMPLATES_DIR = 'packages/create-valet-app/templates';

/**
 * Extract the base x.y.z version a dependency spec points at.
 * Accepts `^1.2.3`, `~1.2.3`, `>=1.2.3`, `=1.2.3`, `1.2.3` (+prerelease);
 * returns null for anything else (`*`, ranges, tags, file:/link: specs).
 */
export function pinTargetVersion(spec) {
  if (typeof spec !== 'string') return null;
  const m = spec.trim().match(/^(?:\^|~|>=|=)?\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  return m ? m[1] : null;
}

/**
 * Gather every @archway/valet pin the release must keep in sync:
 * docs/package.json plus each create-valet-app template package.json.
 * Returns [{ label, file, spec|undefined, missingFile? }].
 */
export function collectPins(root) {
  const pins = [];
  const add = (label, rel) => {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      pins.push({ label, file: rel, spec: undefined, missingFile: true });
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    const spec =
      pkg.dependencies?.[PKG_NAME] ??
      pkg.devDependencies?.[PKG_NAME] ??
      pkg.peerDependencies?.[PKG_NAME];
    pins.push({ label, file: rel, spec });
  };
  add('docs', 'docs/package.json');
  const templatesDir = path.join(root, TEMPLATES_DIR);
  if (fs.existsSync(templatesDir)) {
    for (const name of fs.readdirSync(templatesDir).sort()) {
      const rel = `${TEMPLATES_DIR}/${name}/package.json`;
      if (fs.existsSync(path.join(root, rel))) add(`template:${name}`, rel);
    }
  }
  return pins;
}

/**
 * The version a package-lock.json actually resolves @archway/valet to.
 * Handles npm lockfileVersion 2/3 (`packages`) with a v1 (`dependencies`)
 * fallback. Returns null when the lock does not contain the package.
 */
export function lockedValetVersion(lock) {
  if (!lock || typeof lock !== 'object') return null;
  const fromPackages = lock.packages?.[`node_modules/${PKG_NAME}`]?.version;
  if (fromPackages) return fromPackages;
  return lock.dependencies?.[PKG_NAME]?.version ?? null;
}

/**
 * Gather every package-lock.json that sits beside a pinned package.json
 * (today: docs — the templates ship no lockfile). Returns
 * [{ label, file, locked|null }].
 */
export function collectLockfiles(root) {
  const out = [];
  const add = (label, rel) => {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) return; // no lockfile beside this pin → nothing to verify
    out.push({
      label,
      file: rel,
      locked: lockedValetVersion(JSON.parse(fs.readFileSync(file, 'utf8'))),
    });
  };
  add('docs', 'docs/package-lock.json');
  return out;
}

/**
 * Pure gate: a lockfile beside a pinned package.json must RESOLVE
 * @archway/valet at the root version, or `npm ci` will refuse it.
 */
export function checkLockfiles({ rootVersion, lockfiles }) {
  const problems = [];
  for (const lf of lockfiles) {
    if (lf.locked === null) {
      problems.push(`${lf.label}: ${lf.file} has no resolved "${PKG_NAME}" entry`);
      continue;
    }
    if (lf.locked !== rootVersion) {
      problems.push(
        `${lf.label}: ${lf.file} resolves ${PKG_NAME}@${lf.locked} but the root package is ${rootVersion} — ` +
          `run \`npm install\` in its directory to resync the lockfile (else \`npm ci\` fails)`,
      );
    }
  }
  return problems;
}

/** Pure gate: returns a list of problem strings (empty array = pass). */
export function checkPins({ rootVersion, pins }) {
  const problems = [];
  for (const pin of pins) {
    if (pin.missingFile) {
      problems.push(`${pin.label}: ${pin.file} not found`);
      continue;
    }
    if (pin.spec === undefined) {
      problems.push(`${pin.label}: no "${PKG_NAME}" dependency in ${pin.file}`);
      continue;
    }
    const target = pinTargetVersion(pin.spec);
    if (target === null) {
      problems.push(`${pin.label}: unparsable "${PKG_NAME}" pin "${pin.spec}" in ${pin.file}`);
      continue;
    }
    if (target !== rootVersion) {
      problems.push(
        `${pin.label}: pins ${PKG_NAME} ${pin.spec} but the root package is ${rootVersion} (${pin.file})`,
      );
    }
  }
  return problems;
}

function parseArgs(argv) {
  const warn = argv.includes('--warn');
  let root = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) root = path.resolve(argv[i + 1]);
  return { warn, root };
}

/** Thin CLI wrapper; returns the intended exit code. */
export function main(argv = process.argv.slice(2)) {
  const { warn, root } = parseArgs(argv);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const pins = collectPins(root);
  const lockfiles = collectLockfiles(root);
  const problems = [
    ...checkPins({ rootVersion: pkg.version, pins }),
    ...checkLockfiles({ rootVersion: pkg.version, lockfiles }),
  ];
  if (problems.length === 0) {
    console.log(
      `check-pins: OK — ${pins.length} pin(s) + ${lockfiles.length} lockfile(s) match ${PKG_NAME}@${pkg.version}`,
    );
    return 0;
  }
  for (const p of problems) console.error(`check-pins: ${warn ? 'WARN' : 'ERROR'} — ${p}`);
  return warn ? 0 : 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(main());
}
