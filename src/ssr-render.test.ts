// ─────────────────────────────────────────────────────────────
// src/ssr-render.test.ts  | valet
// SSR render regression (1.0 prep, W3). Loads the BUILT package
// the way a Next.js/Remix consumer does — import('./dist/index.mjs')
// — and renderToString's the app-shell components in plain Node.
//
// Guards the two hard SSR crashes the 1.0 readiness eval found:
//   • AppBar — createPortal(bar, document.body) ran in render and
//     `fixed`/`portal` default true, so a default <AppBar> hit
//     `document is not defined` on the server. Fixed by the
//     mounted-gate portal (render inline on the server + first
//     client render, portal after mount).
//   • Drawer — a bare `HTMLElement instanceof` in a useState
//     initializer (runs during render) threw `HTMLElement is not
//     defined` in Node. Fixed by guarding the global.
//
// Also a broad no-throw + determinism smoke over common components
// inside a <Surface> (Accordion's reduced-motion read now flows
// through usePrefersReducedMotion, whose server snapshot is false).
//
// No build, no failure: skips when dist/ is absent (CI runs this
// file post-build, like ssr-import.test.ts).
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
  'dist/ is absent — skipping the SSR render regression. ' +
  'Run `npm run build` to enable it (CI runs this file post-build).';

/* The dist .d.mts may be absent when this file typechecks, so the
   barrel is loaded as a loose record of components. */
type Comp = React.ElementType;
type Barrel = Record<string, Comp> & { styled?: unknown };

async function loadBarrel(): Promise<Barrel> {
  return (await import(/* @vite-ignore */ pathToFileURL(DIST_MJS).href)) as Barrel;
}

const h = React.createElement;

describe('ssr renderToString (skips without dist/ — run `npm run build`)', () => {
  if (!hasDist) process.stderr.write(`[ssr-render.test] ${SKIP_HINT}\n`);

  it.skipIf(!hasDist)('a default <AppBar> SSRs inside <Surface> without crashing', async () => {
    const v = await loadBarrel();
    const { Surface, AppBar, Typography } = v;
    // Default AppBar is `fixed` → previously portaled to document.body in render.
    const html = renderToString(h(Surface, null, h(AppBar, null, h(Typography, null, 'Title'))));
    expect(typeof html).toBe('string');
    expect(html).toContain('Title');
  });

  it.skipIf(!hasDist)(
    'a default (closed) <Drawer> SSRs inside <Surface> without crashing',
    async () => {
      const v = await loadBarrel();
      const { Surface, Drawer, Typography } = v;
      // The offsetTop useState initializer (bare HTMLElement instanceof) runs in
      // render regardless of open state, so even a closed Drawer hit the crash.
      // (An OPEN overlay Drawer portals to the overlay root — a client-only
      // scenario; overlays open on interaction, not during SSR.)
      expect(() => {
        renderToString(h(Surface, null, h(Drawer, null, h(Typography, null, 'Panel'))));
        renderToString(
          h(
            Surface,
            null,
            h(Drawer, { open: false } as Record<string, unknown>, h(Typography, null, 'Panel')),
          ),
        );
      }).not.toThrow();
    },
  );

  it.skipIf(!hasDist)(
    'a broad component tree SSRs without throwing and deterministically',
    async () => {
      const v = await loadBarrel();
      const { Surface, AppBar, Drawer, Box, Stack, Panel, Grid, Typography, Divider, Accordion } =
        v;
      const tree = () =>
        h(
          Surface,
          null,
          h(AppBar, null, h(Typography, { weight: 'bold' } as Record<string, unknown>, 'App')),
          h(Drawer, { open: false } as Record<string, unknown>, h(Typography, null, 'Nav')),
          h(
            Box,
            null,
            h(
              Stack,
              null,
              h(Panel, null, h(Typography, null, 'Panel body')),
              h(Grid, null, h(Typography, null, 'Grid cell')),
              h(Divider, null),
              // Accordion's $reduced now comes from usePrefersReducedMotion
              // (server snapshot false) instead of an in-render matchMedia read.
              h(
                Accordion,
                null,
                h(
                  (Accordion as unknown as { Item: Comp }).Item,
                  { header: 'Section' } as Record<string, unknown>,
                  h(Typography, null, 'Section body'),
                ),
              ),
            ),
          ),
        );

      let a = '';
      let b = '';
      expect(() => {
        a = renderToString(tree());
        b = renderToString(tree());
      }).not.toThrow();
      expect(a).toContain('Panel body');
      expect(a).toContain('Section');
      // Deterministic server output: identical render → identical markup (no
      // matchMedia/Date/random nondeterminism leaking into class names).
      expect(b).toBe(a);
    },
  );
});
