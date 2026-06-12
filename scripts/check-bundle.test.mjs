// ─────────────────────────────────────────────────────────────
// scripts/check-bundle.test.mjs  | valet
// Tests for the tree-shake/payload probe (node environment):
// pure scan checks over synthetic outputs/metafiles, plus the
// plan-mandated negative test (§3.3 verification) — a fixture that
// re-adds `import hljs from 'highlight.js'` must trip the probe.
// Real-dist bundling tests skip when dist/ is absent (same
// convention as src/ssr-import.test.ts); CI runs post-build.
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  GZIP_LIMIT_BYTES,
  bundleFixture,
  checkBarrelEvaluates,
  checkSize,
  scanContributions,
  scanMarkers,
  scanSpecifiers,
} from './check-bundle.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CLI = path.join(ROOT, 'scripts', 'check-bundle.mjs');
const hasDist = fs.existsSync(path.join(ROOT, 'dist', 'index.mjs'));
const SKIP_HINT = 'dist/ is absent — run `npm run build` (CI runs this post-build)';

// ── pure scans ───────────────────────────────────────────────
describe('scanSpecifiers', () => {
  it('flags quoted specifiers of each forbidden package (incl. subpaths)', () => {
    expect(scanSpecifiers('import x from"highlight.js";')).toHaveLength(1);
    expect(scanSpecifiers('import"highlight.js/lib/core";')).toHaveLength(1);
    expect(scanSpecifiers("from'marked'")).toHaveLength(1);
    expect(scanSpecifiers('require("react-dropzone")')).toHaveLength(1);
  });

  it('does NOT false-positive on Button’s own CSS or plain words', () => {
    expect(scanSpecifiers('-webkit-tap-highlight-color: transparent;')).toEqual([]);
    expect(scanSpecifiers('const marked = true; // marked as done')).toEqual([]);
    expect(scanSpecifiers('"highlighter"')).toEqual([]);
  });
});

describe('scanMarkers', () => {
  it('flags distinctive package literals and passes clean output', () => {
    expect(scanMarkers('e="Could not find the language \'"+t')).toHaveLength(1);
    expect(scanMarkers('"https://github.com/markedjs/marked."')).toHaveLength(1);
    expect(scanMarkers('{noDragEventsBubbling:!1}')).toHaveLength(1);
    expect(scanMarkers('-webkit-tap-highlight-color: transparent;')).toEqual([]);
  });
});

describe('scanContributions', () => {
  const meta = (file, bytesInOutput) => ({
    outputs: { 'stdin.js': { inputs: { [file]: { bytesInOutput } } } },
  });

  it('flags forbidden node_modules files that contribute bytes', () => {
    expect(scanContributions(meta('node_modules/highlight.js/lib/core.js', 10))).toHaveLength(1);
    expect(scanContributions(meta('node_modules/marked/lib/marked.esm.js', 1))).toHaveLength(1);
    expect(
      scanContributions(meta('node_modules/react-dropzone/dist/es/index.js', 5)),
    ).toHaveLength(1);
  });

  it('ignores graph members with zero output bytes (tree-shaken away)', () => {
    expect(scanContributions(meta('node_modules/highlight.js/lib/core.js', 0))).toEqual([]);
  });

  it('ignores ordinary contributors', () => {
    expect(scanContributions(meta('dist/components/fields/Button.mjs', 500))).toEqual([]);
  });
});

describe('checkSize', () => {
  it('passes a compact bundle and reports its sizes', () => {
    const text = 'x'.repeat(8 * 1024); // compresses far below the ceiling
    const { problems, raw, gzip } = checkSize(text);
    expect(problems).toEqual([]);
    expect(raw).toBe(8 * 1024);
    expect(gzip).toBeLessThanOrEqual(GZIP_LIMIT_BYTES);
  });

  it('fails when gzip exceeds the ceiling (incompressible payload)', () => {
    // random bytes are incompressible: ~43KB base64 gzips far above 12KB
    const big = randomBytes(32 * 1024).toString('base64');
    const { problems } = checkSize(big);
    expect(problems.some((p) => p.includes('over the'))).toBe(true);
  });

  it('fails a vacuously tiny bundle (anti-vacuity floor)', () => {
    const { problems } = checkSize('export{};');
    expect(problems.some((p) => p.includes('vacuous'))).toBe(true);
  });
});

// ── CLI negative: missing dist ───────────────────────────────
describe('check-bundle CLI', () => {
  it('exits 1 with a build hint when dist/ is absent', () => {
    const emptyRoot = fs.mkdtempSync(path.join(ROOT, 'node_modules', '.check-bundle-test-'));
    try {
      let status = 0;
      let stderr = '';
      try {
        execFileSync(process.execPath, [CLI, '--root', emptyRoot], { encoding: 'utf8' });
      } catch (err) {
        status = err.status;
        stderr = String(err.stderr ?? '');
      }
      expect(status).toBe(1);
      expect(stderr).toContain('npm run build');
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});

// ── real-dist integration (skips pre-build) ──────────────────
describe.skipIf(!hasDist)(`bundled dist probes (${SKIP_HINT})`, () => {
  it('Button-only fixture passes every probe against the built dist', async () => {
    const { text, metafile } = await bundleFixture(ROOT);
    expect(checkSize(text).problems).toEqual([]);
    expect(scanContributions(metafile)).toEqual([]);
    expect(scanSpecifiers(text)).toEqual([]);
    expect(scanMarkers(text)).toEqual([]);
  });

  it('NEGATIVE: re-adding `import hljs from "highlight.js"` trips the probe', async () => {
    const poisoned =
      "export { Button } from '@archway/valet';\n" +
      "import hljs from 'highlight.js';\n" +
      'export const __keepAlive = hljs;\n';
    const { text, metafile } = await bundleFixture(ROOT, poisoned);
    expect(scanContributions(metafile).length).toBeGreaterThan(0);
    expect(scanMarkers(text).length).toBeGreaterThan(0);
    // all of highlight.js blows straight through the gzip ceiling too
    expect(checkSize(text).problems.length).toBeGreaterThan(0);
  });

  it('the full barrel evaluates in a fresh Node process', () => {
    expect(checkBarrelEvaluates(ROOT)).toEqual([]);
  });
});
