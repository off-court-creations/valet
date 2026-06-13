// ─────────────────────────────────────────────────────────────
// src/ssr-import.test.ts  | valet
// SSR dist-import regression (TEST-CI S10). Loads the BUILT
// package the way consumers do — import('./dist/index.mjs') —
// then renderToString's a styled fixture in plain Node, asserting
// deterministic z-<tag>-* class names (ENGINE S1's lazy guarded
// sheet init, at the dist level).
//
// ESM-only since PACKAGING S4 (ruling Q1(a)): the CJS build is
// gone, so the old require('./dist/index.js') half of this suite
// was rewritten away atomically inside S4's PR — plan §3.2 S10.
//
// No build, no failure: when dist/ is absent every test here
// SKIPS with a pointer to `npm run build`, so a plain `npm test`
// never requires a build. CI runs this file explicitly post-build
// (.github/workflows/ci.yml core job), where dist/ always exists.
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_MJS = path.join(ROOT, 'dist', 'index.mjs');
const hasDist = fs.existsSync(DIST_MJS);

const SKIP_HINT =
  'dist/ is absent — skipping the SSR dist-import regression. ' +
  'Run `npm run build` to enable it (CI runs this file post-build).';

/* Minimal structural view of the public barrel — only what the
   fixture touches. dist types are not imported on purpose: this
   file must typecheck when dist/ (and its .d.mts) does not exist. */
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

/* Fixture builder — class names are FNV-1a hashes of the normalized
   rule, so identical css must yield the identical class on every
   load and every render. */
function renderFixture(mod: DistModule): { html: string; cls: string | null } {
  const Box = mod.styled('div')`
    display: flex;
    padding: 4px;
  ` as StyledComponent;
  const html = renderToString(React.createElement(Box, null, 'ssr-fixture'));
  return { html, cls: firstClass(html) };
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
    "import('./dist/index.mjs') loads in plain Node and SSRs a deterministic class",
    async () => {
      const mod = await loadEsm();
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
    'independent styled() definitions of identical css agree on the class (hash determinism)',
    async () => {
      const mod = await loadEsm();
      // Two separate styled() calls over byte-identical css must hash to
      // the same class — the per-module dist must not fork engine state.
      const a = renderFixture(mod);
      const b = renderFixture(mod);
      expect(a.cls).not.toBeNull();
      expect(b.cls).toBe(a.cls);
    },
  );
});
