#!/usr/bin/env node
// Bump CVA to a new minor or major and align Valet/MCP ranges.
// Usage:
//   node scripts/bump.mjs minor
//   node scripts/bump.mjs major
// Options:
//   --dry-run  Print planned changes without writing files

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function parseSemver(v) {
  const m = String(v || '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(ver, kind) {
  const p = parseSemver(ver);
  if (kind === 'major') return { major: p.major + 1, minor: 0, patch: 0 };
  if (kind === 'minor') return { major: p.major, minor: p.minor + 1, patch: 0 };
  throw new Error(`Unsupported bump kind: ${kind}`);
}

function updateFileText(p, updater) {
  const before = fs.readFileSync(p, 'utf8');
  const after = updater(before);
  if (after !== before) fs.writeFileSync(p, after);
}

async function main() {
  const args = process.argv.slice(2);
  const kind = args.find((a) => a === 'minor' || a === 'major');
  const dry = args.includes('--dry-run');
  if (!kind) {
    console.error('Usage: node scripts/bump.mjs <minor|major> [--dry-run]');
    process.exit(1);
  }

  const pkgPath = path.join(ROOT, 'package.json');
  const lockPath = path.join(ROOT, 'package-lock.json');
  const binPath = path.join(ROOT, 'bin', 'create-valet-app.js');
  const templatePkgs = [
    path.join(ROOT, 'templates', 'ts', 'package.json'),
    path.join(ROOT, 'templates', 'js', 'package.json'),
    path.join(ROOT, 'templates', 'hybrid', 'package.json'),
  ];
  const docsPkgPath = path.join(ROOT, 'docs', 'package.json');

  const pkg = readJSON(pkgPath);
  const current = pkg.version;
  const nextParts = bumpVersion(current, kind);
  const next = formatSemver(nextParts);
  const targetMinorRange = `^${nextParts.major}.${nextParts.minor}.0`;

  const changes = [];

  // Root package.json version
  changes.push({ file: pkgPath, change: `${current} -> ${next}` });
  if (!dry) {
    pkg.version = next;
    writeJSON(pkgPath, pkg);
  }

  // package-lock.json top-level and packages[""] if present
  if (fs.existsSync(lockPath)) {
    try {
      const lock = readJSON(lockPath);
      const beforeTop = lock.version;
      if (!dry) lock.version = next;
      let beforePkg = null;
      if (lock.packages && lock.packages[''] && lock.packages[''].version) {
        beforePkg = lock.packages[''].version;
        if (!dry) lock.packages[''].version = next;
      }
      if (!dry) writeJSON(lockPath, lock);
      changes.push({ file: lockPath, change: `version: ${beforeTop} -> ${next}${beforePkg ? `; packages[""] ${beforePkg} -> ${next}` : ''}` });
    } catch (e) {
      console.warn(`[warn] Could not update ${path.relative(ROOT, lockPath)}: ${e.message}`);
    }
  }

  // Update templates' @archway/valet dependency ranges
  for (const p of templatePkgs) {
    try {
      const t = readJSON(p);
      const before = t.dependencies?.['@archway/valet'];
      if (before !== targetMinorRange) {
        if (!dry) {
          t.dependencies = t.dependencies || {};
          t.dependencies['@archway/valet'] = targetMinorRange;
          writeJSON(p, t);
        }
        changes.push({ file: p, change: `@archway/valet: ${before} -> ${targetMinorRange}` });
      }
    } catch (e) {
      console.warn(`[warn] Skipping ${path.relative(ROOT, p)}: ${e.message}`);
    }
  }

  // Update docs package example if present
  if (fs.existsSync(docsPkgPath)) {
    try {
      const d = readJSON(docsPkgPath);
      const before = d.dependencies?.['@archway/valet'];
      if (before !== targetMinorRange) {
        if (!dry) {
          d.dependencies = d.dependencies || {};
          d.dependencies['@archway/valet'] = targetMinorRange;
          writeJSON(docsPkgPath, d);
        }
        changes.push({ file: docsPkgPath, change: `@archway/valet: ${before} -> ${targetMinorRange}` });
      }
    } catch (e) {
      console.warn(`[warn] Skipping ${path.relative(ROOT, docsPkgPath)}: ${e.message}`);
    }
  }

  // Update CLI fallback minor in bin/create-valet-app.js
  if (fs.existsSync(binPath)) {
    try {
      const prev = fs.readFileSync(binPath, 'utf8');
      const newFallback = `'${nextParts.major}.${nextParts.minor}.0'`;
      const updated = prev.replace(/(PKG\.version \|\| ')\d+\.\d+\.\d+('\))/m, `$1${nextParts.major}.${nextParts.minor}.0$2`);
      if (updated !== prev && !dry) fs.writeFileSync(binPath, updated);
      if (updated !== prev) changes.push({ file: binPath, change: `fallback version -> ${newFallback}` });
    } catch (e) {
      console.warn(`[warn] Could not update ${path.relative(ROOT, binPath)} fallback: ${e.message}`);
    }
  }

  // Report
  console.log(`[bump] ${kind} ${current} -> ${next}`);
  changes.forEach((c) => {
    console.log(` - ${path.relative(ROOT, c.file)}: ${c.change}`);
  });
  if (dry) console.log('(dry-run) No files were written.');
}

main().catch((e) => {
  console.error(e.stack || e.message || String(e));
  process.exit(1);
});

