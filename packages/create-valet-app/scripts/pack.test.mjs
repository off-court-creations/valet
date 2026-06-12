#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// pack.test.mjs | @archway/create-valet-app
//
// Packaging regression for TEST-CI S9 (orphan, audit §9).
//
// History: a committed *dangling* symlink lived inside this package's
// published bin/ path (`bin/create-valet-app -> ../lib/node_modules/...`,
// a target that exists only after a global install). npm pack silently
// skips broken symlinks, so it never tripped the tarball file count — it
// just shipped a confusing, non-resolving entry to anyone who cloned the
// repo and a latent footgun for any tool that followed it. S9 deletes it;
// this test makes the recurrence a hard failure.
//
// The valet test harness (vitest) globs only the LIBRARY root's src/** and
// scripts/**; packages/** is outside those globs, so this package has no
// vitest hook. This is a self-contained node test (same style as the
// package's scripts/consent.test.mjs) with zero dependencies.
//
// Asserted invariants (plan §3.2 S9):
//   1. bin/ contains NO dangling symlinks (the exact recurrence class).
//   2. Every `bin` entry declared in package.json exists, resolves to a
//      regular file, and is executable.
//   3. `npm pack --dry-run --json` ships every declared bin target.
//   4. Every committed symlink anywhere under the published `files` roots
//      resolves (no broken symlink can be shipped).
//
// Run: node scripts/pack.test.mjs
// Exit 0 = all pass; non-zero = a failure (printed).
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const pkgRoot = path.resolve(path.dirname(__filename), '..');

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log('  ✓', msg);
  } else {
    failures += 1;
    console.error('  ✗ FAIL:', msg);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

// Recursively collect every entry under `dir` as { abs, rel, lstat }, where
// rel is POSIX-relative to pkgRoot. Symlinks are reported as-is (not
// followed), so a dangling link is observable.
function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    const rel = path.relative(pkgRoot, abs).split(path.sep).join('/');
    const lstat = fs.lstatSync(abs);
    acc.push({ abs, rel, lstat });
    if (lstat.isDirectory()) walk(abs, acc);
  }
  return acc;
}

// ── Check 1+4: no dangling symlinks under the published files roots ────────────
{
  console.log('No dangling symlinks under published files');
  // `files` declares what npm publishes; default to bin/ + templates/ if absent.
  const roots = Array.isArray(pkg.files) && pkg.files.length ? pkg.files : ['bin', 'templates'];
  const danglers = [];
  let symlinkCount = 0;
  for (const root of roots) {
    const rootAbs = path.join(pkgRoot, root);
    if (!fs.existsSync(rootAbs)) continue;
    const rootStat = fs.lstatSync(rootAbs);
    const items = rootStat.isDirectory()
      ? walk(rootAbs)
      : [{ abs: rootAbs, rel: root, lstat: rootStat }];
    for (const { abs, rel, lstat } of items) {
      if (!lstat.isSymbolicLink()) continue;
      symlinkCount += 1;
      // fs.existsSync follows the link; false ⇒ the target is missing ⇒ dangling.
      if (!fs.existsSync(abs)) {
        danglers.push(`${rel} -> ${fs.readlinkSync(abs)}`);
      }
    }
  }
  check(
    danglers.length === 0,
    danglers.length === 0
      ? `${symlinkCount} symlink(s) under [${roots.join(', ')}] all resolve`
      : `dangling symlink(s) found (delete or repair): ${danglers.join('; ')}`,
  );
}

// ── Check 2: every declared `bin` target is a real, executable regular file ───
{
  console.log('Declared bin targets exist and are executable');
  const bins =
    typeof pkg.bin === 'string'
      ? { [pkg.name]: pkg.bin }
      : pkg.bin && typeof pkg.bin === 'object'
        ? pkg.bin
        : {};
  const names = Object.keys(bins);
  check(names.length > 0, 'package.json declares at least one bin entry');
  for (const [name, target] of Object.entries(bins)) {
    const abs = path.join(pkgRoot, target);
    const ok = fs.existsSync(abs);
    check(ok, `bin "${name}" -> ${target} exists (resolved)`);
    if (!ok) continue;
    const st = fs.statSync(abs); // follows symlinks; a dangling one fails existsSync above
    check(st.isFile(), `bin "${name}" -> ${target} is a regular file`);
    check((st.mode & 0o111) !== 0, `bin "${name}" -> ${target} is executable`);
  }
}

// ── Check 3: npm pack ships every declared bin target ─────────────────────────
{
  console.log('npm pack ships every declared bin target');
  let packed = [];
  try {
    const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: pkgRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    const report = JSON.parse(stdout);
    const entry = Array.isArray(report) ? report[0] : report;
    packed = (entry?.files ?? []).map((f) => String(f.path).replace(/^\.\//, ''));
  } catch (e) {
    check(false, `npm pack --dry-run --json succeeded (${e.message})`);
  }
  const packedSet = new Set(packed);
  const bins =
    typeof pkg.bin === 'string'
      ? { [pkg.name]: pkg.bin }
      : pkg.bin && typeof pkg.bin === 'object'
        ? pkg.bin
        : {};
  for (const [name, target] of Object.entries(bins)) {
    const rel = String(target).replace(/^\.\//, '');
    check(packedSet.has(rel), `bin "${name}" -> ${rel} is in the npm pack file list`);
  }
}

console.log('');
if (failures > 0) {
  console.error(`pack.test.mjs: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('pack.test.mjs: all packaging assertions passed');
