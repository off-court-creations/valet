// ─────────────────────────────────────────────────────────────
// scripts/release/check-pins.mjs  | valet
// Release gate: docs/package.json and the create-valet-app template
// package.json files must pin @archway/valet at the root version
// (audit found docs at ^0.33.0 and templates at ^0.31.1 vs 0.34.1).
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
      pkg.dependencies?.[PKG_NAME] ?? pkg.devDependencies?.[PKG_NAME] ?? pkg.peerDependencies?.[PKG_NAME];
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
  const problems = checkPins({ rootVersion: pkg.version, pins });
  if (problems.length === 0) {
    console.log(`check-pins: OK — ${pins.length} pin(s) match ${PKG_NAME}@${pkg.version}`);
    return 0;
  }
  for (const p of problems) console.error(`check-pins: ${warn ? 'WARN' : 'ERROR'} — ${p}`);
  return warn ? 0 : 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(main());
}
