// ─────────────────────────────────────────────────────────────
// src/ssr-import.test.ts  | valet
// SSR dist-import regression (TEST-CI S10). Loads the BUILT
// package the way consumers do — require('./dist/index.js') AND
// import('./dist/index.mjs') — then renderToString's a styled
// fixture in plain Node, asserting deterministic z-<tag>-* class
// names (ENGINE S1's lazy guarded sheet init, at the dist level).
//
// No build, no failure: when dist/ is absent every test here
// SKIPS with a pointer to `npm run build`, so a plain `npm test`
// never requires a build. CI runs this file explicitly post-build
// (.github/workflows/ci.yml core job), where dist/ always exists.
// PACKAGING S4 (ESM-only per-module dist) rewrites the require
// half atomically inside its own PR — plan §3.2 S10.
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_CJS = path.join(ROOT, 'dist', 'index.js');
const DIST_MJS = path.join(ROOT, 'dist', 'index.mjs');
const hasDist = fs.existsSync(DIST_CJS) && fs.existsSync(DIST_MJS);

const SKIP_HINT =
  'dist/ is absent — skipping the SSR dist-import regression. ' +
  'Run `npm run build` to enable it (CI runs this file post-build).';

/* Minimal structural view of the public barrel — only what the
   fixture touches. dist types are not imported on purpose: this
   file must typecheck when dist/ (and its .d.ts) does not exist. */
type StyledComponent = React.FunctionComponent<{ children?: React.ReactNode }>;
type StyledTag = (strings: TemplateStringsArray, ...exprs: ReadonlyArray<unknown>) => unknown;
interface DistModule {
  styled: (tag: string) => StyledTag;
}

/** First class token in the rendered markup, or null. */
function firstClass(markup: string): string | null {
  const m = markup.match(/class="([^"]+)"/);
  return m ? m[1].split(/\s+/)[0] : null;
}

/* One shared fixture builder so the CJS and ESM loads hash IDENTICAL
   css text — class names are FNV-1a hashes of the normalized rule,
   so the two formats must agree on the class. */
function renderFixture(mod: DistModule): { html: string; cls: string | null } {
  const Box = mod.styled('div')`
    display: flex;
    padding: 4px;
  ` as StyledComponent;
  const html = renderToString(React.createElement(Box, null, 'ssr-fixture'));
  return { html, cls: firstClass(html) };
}

function loadCjs(): DistModule {
  const requireCjs = createRequire(import.meta.url);
  return requireCjs(DIST_CJS) as DistModule;
}

async function loadEsm(): Promise<DistModule> {
  return (await import(/* @vite-ignore */ pathToFileURL(DIST_MJS).href)) as DistModule;
}

describe('ssr dist import (skips without dist/ — run `npm run build`)', () => {
  if (!hasDist) {
    // Loud, single, actionable skip message (per-test skipIf below).
    // Raw stderr on purpose: vitest's reporter swallows console.* emitted
    // while collecting a fully-skipped file.
    process.stderr.write(`[ssr-import.test] ${SKIP_HINT}\n`);
  }

  it.skipIf(!hasDist)(
    "require('./dist/index.js') loads in plain Node and SSRs a deterministic class",
    () => {
      const mod = loadCjs();
      expect(typeof mod.styled).toBe('function');

      const a = renderFixture(mod);
      const b = renderFixture(mod);
      expect(a.html).toContain('ssr-fixture');
      expect(a.cls).toMatch(/^z-div-[0-9a-z]+-[0-9a-z]+$/);
      // Deterministic: identical css → identical class, render after render.
      expect(b.cls).toBe(a.cls);
      expect(b.html).toBe(a.html);
    },
  );

  it.skipIf(!hasDist)(
    "import('./dist/index.mjs') loads in plain Node and SSRs a deterministic class",
    async () => {
      const mod = await loadEsm();
      expect(typeof mod.styled).toBe('function');

      const a = renderFixture(mod);
      const b = renderFixture(mod);
      expect(a.html).toContain('ssr-fixture');
      expect(a.cls).toMatch(/^z-div-[0-9a-z]+-[0-9a-z]+$/);
      expect(b.cls).toBe(a.cls);
      expect(b.html).toBe(a.html);
    },
  );

  it.skipIf(!hasDist)(
    'CJS and ESM builds agree on the class for identical css (cross-format determinism)',
    async () => {
      const cjs = renderFixture(loadCjs());
      const esm = renderFixture(await loadEsm());
      expect(cjs.cls).not.toBeNull();
      expect(esm.cls).toBe(cjs.cls);
      expect(esm.html).toBe(cjs.html);
    },
  );
});
