// ─────────────────────────────────────────────────────────────
// scripts/verify-pack.test.mjs  | valet
// Tests for the pack guard (node environment): pure checks over
// fixture package shapes + CLI exit codes against throwaway packages
// (including the negative case: dist/ absent → exit 1).
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  normalizeRelPath,
  collectExportPaths,
  isDistJsArtifact,
  verifyPack,
} from './verify-pack.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CLI = path.join(REPO_ROOT, 'scripts', 'verify-pack.mjs');

// ── fixtures ─────────────────────────────────────────────────
/** Mirrors the published valet shape (dual-format + subpath export). */
const PKG = {
  name: 'verify-pack-fixture',
  version: '0.0.0',
  main: './dist/index.js',
  module: './dist/index.mjs',
  types: './dist/index.d.ts',
  exports: {
    '.': {
      import: './dist/index.mjs',
      require: './dist/index.js',
    },
    './styles.css': './styles.css',
  },
  files: ['dist', 'styles.css'],
};

const PACKED = ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'styles.css', 'package.json'];

const allExist = () => true;

// ── pure helpers ─────────────────────────────────────────────
describe('normalizeRelPath', () => {
  it('strips a leading ./ and leaves bare paths alone', () => {
    expect(normalizeRelPath('./dist/index.js')).toBe('dist/index.js');
    expect(normalizeRelPath('dist/index.js')).toBe('dist/index.js');
    expect(normalizeRelPath('./styles.css')).toBe('styles.css');
  });
});

describe('collectExportPaths', () => {
  it('collects main/module/types and every exports string leaf', () => {
    const refs = collectExportPaths(PKG);
    expect(refs.map((r) => r.path).sort()).toEqual(
      [
        './dist/index.js', // main
        './dist/index.js', // exports["."]["require"]
        './dist/index.mjs', // module
        './dist/index.mjs', // exports["."]["import"]
        './dist/index.d.ts', // types
        './styles.css',
      ].sort(),
    );
  });

  it('labels each ref with the field that declared it', () => {
    const refs = collectExportPaths(PKG);
    expect(refs).toContainEqual({ field: 'main', path: './dist/index.js' });
    expect(refs).toContainEqual({
      field: 'exports["."]["import"]',
      path: './dist/index.mjs',
    });
    expect(refs).toContainEqual({
      field: 'exports["./styles.css"]',
      path: './styles.css',
    });
  });

  it('handles a bare-string exports field and fallback arrays', () => {
    expect(collectExportPaths({ exports: './dist/index.mjs' })).toEqual([
      { field: 'exports', path: './dist/index.mjs' },
    ]);
    const refs = collectExportPaths({
      exports: { '.': ['./dist/a.mjs', './dist/b.mjs'] },
    });
    expect(refs.map((r) => r.path)).toEqual(['./dist/a.mjs', './dist/b.mjs']);
  });

  it('returns [] for a package with no entry points', () => {
    expect(collectExportPaths({ name: 'x', version: '0.0.0' })).toEqual([]);
  });
});

describe('isDistJsArtifact', () => {
  it('accepts js/mjs/cjs under dist/ at any depth', () => {
    expect(isDistJsArtifact('dist/index.js')).toBe(true);
    expect(isDistJsArtifact('dist/index.mjs')).toBe(true);
    expect(isDistJsArtifact('dist/components/Button.cjs')).toBe(true);
  });

  it('rejects declarations, css, and files outside dist/', () => {
    expect(isDistJsArtifact('dist/index.d.ts')).toBe(false);
    expect(isDistJsArtifact('styles.css')).toBe(false);
    expect(isDistJsArtifact('src/index.js')).toBe(false);
    expect(isDistJsArtifact('dist/')).toBe(false);
  });
});

// ── verifyPack (pure gate) ───────────────────────────────────
describe('verifyPack', () => {
  it('passes when every referenced path exists and ships', () => {
    expect(verifyPack({ pkg: PKG, packedPaths: PACKED, fileExists: allExist })).toEqual([]);
  });

  it('flags paths missing on disk, naming the field and path', () => {
    const problems = verifyPack({
      pkg: PKG,
      packedPaths: PACKED,
      fileExists: (rel) => rel !== 'dist/index.mjs',
    });
    expect(problems).toEqual([
      'module → ./dist/index.mjs: missing on disk',
      'exports["."]["import"] → ./dist/index.mjs: missing on disk',
    ]);
  });

  it('flags referenced paths absent from the npm pack file list', () => {
    const packed = PACKED.filter((p) => p !== 'styles.css');
    const problems = verifyPack({ pkg: PKG, packedPaths: packed, fileExists: allExist });
    expect(problems).toEqual([
      'exports["./styles.css"] → ./styles.css: not in the npm pack file list',
    ]);
  });

  it('requires at least one dist JS artifact in the tarball', () => {
    const pkg = { main: './styles.css' };
    const problems = verifyPack({
      pkg,
      packedPaths: ['styles.css', 'package.json'],
      fileExists: allExist,
    });
    expect(problems).toEqual([
      'npm pack ships no dist JS artifact (expected at least one dist/**/*.{js,mjs,cjs})',
    ]);
  });

  it('skips wildcard subpath patterns (cannot be resolved statically)', () => {
    const pkg = { main: './dist/index.js', exports: { './*': './dist/*.mjs' } };
    const problems = verifyPack({
      pkg,
      packedPaths: ['dist/index.js'],
      fileExists: (rel) => rel === 'dist/index.js',
    });
    expect(problems).toEqual([]);
  });

  it('reports a package with no entry points at all', () => {
    const problems = verifyPack({ pkg: {}, packedPaths: ['dist/index.js'], fileExists: allExist });
    expect(problems).toEqual(['package.json declares no main/module/types/exports entry points']);
  });
});

// ── CLI exit codes (real npm pack over throwaway packages) ───
/** Build a minimal publishable package on disk; withDist=false = broken. */
function makeFixturePackage({ withDist = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'valet-verify-pack-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'verify-pack-fixture',
        version: '0.0.0',
        main: './dist/index.js',
        module: './dist/index.mjs',
        types: './dist/index.d.ts',
        exports: { '.': { import: './dist/index.mjs', require: './dist/index.js' } },
        files: ['dist'],
      },
      null,
      2,
    ),
  );
  if (withDist) {
    fs.mkdirSync(path.join(root, 'dist'));
    for (const f of ['index.js', 'index.mjs', 'index.d.ts']) {
      fs.writeFileSync(path.join(root, 'dist', f), '// stub\n');
    }
  }
  return root;
}

function runCli(root) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, '--root', root], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'], // capture child stderr instead of echoing it
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout), stderr: String(err.stderr) };
  }
}

describe('CLI', () => {
  it('exits 0 on a complete package', () => {
    const root = makeFixturePackage();
    try {
      const { status, stdout } = runCli(root);
      expect(status).toBe(0);
      expect(stdout).toContain('verify-pack: OK');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 1 with a listing of missing paths when dist/ is absent', () => {
    const root = makeFixturePackage({ withDist: false });
    try {
      const { status, stderr } = runCli(root);
      expect(status).toBe(1);
      expect(stderr).toContain('verify-pack: FAIL');
      expect(stderr).toContain('main → ./dist/index.js: missing on disk');
      expect(stderr).toContain('not in the npm pack file list');
      expect(stderr).toContain('no dist JS artifact');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
