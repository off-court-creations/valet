// ─────────────────────────────────────────────────────────────
// scripts/checks/engine-bench.mjs | valet
// Engine micro-benchmark (ENGINE S8). A REPORTING TOOL, NOT A GATE:
// prints ms numbers and always exits 0 when it can run (no thresholds).
// Runs against ./dist — run `npm run build` first, then
// `npm run check:bench`.
//
// Measurements
//  (a) COLD  — renderToString of N=2000 styled elements whose function
//      interpolations produce 2000 UNIQUE css strings (every string
//      pays compile + normalize + hash + cache insert).
//  (b) WARM  — the exact same 2000-element tree again (repeat strings;
//      with the S8 raw→className LRU the normalize+hash work is
//      skipped). Repeated REPS times; min + median reported.
//  (c) PER-RENDER overhead with function interpolations:
//      (c0) plain <div> reference loop (React floor, no styled);
//      (c1) fresh-instance loop — renderToString re-creates component
//           instances, so each render exercises compileTemplate + the
//           global raw-css memo (never the per-instance layer);
//      (c2) same-instance loop — one mounted component re-rendered with
//           unchanged props under jsdom + flushSync, exercising the S8
//           per-instance last-raw short-circuit.
//
// Phases (a)–(c1) run WITHOUT a DOM on purpose: sheet.ts records
// pending rule text (cheap array push), so the numbers are dominated
// by engine work, not jsdom CSSOM parsing. (c2) installs jsdom
// globals afterwards; the first paint flushes the pending rules once,
// outside the timed loop.
//
// CLI: node scripts/checks/engine-bench.mjs [--root <dir>]
//      [--n <uniqueStrings>] [--reps <warmReps>] [--iters <loopIters>]
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath, pathToFileURL } from 'url';

import React from 'react';
import { renderToString } from 'react-dom/server';

/* ─── CLI ────────────────────────────────────────────────────────────── */
function parseArgs(argv) {
  const opts = {
    root: path.resolve(fileURLToPath(import.meta.url), '../../..'),
    n: 2000,
    reps: 5,
    iters: 2000,
  };
  for (const [flag, key, map] of [
    ['--root', 'root', (v) => path.resolve(v)],
    ['--n', 'n', Number],
    ['--reps', 'reps', Number],
    ['--iters', 'iters', Number],
  ]) {
    const i = argv.indexOf(flag);
    if (i !== -1 && argv[i + 1]) opts[key] = map(argv[i + 1]);
  }
  return opts;
}

const fmtMs = (ms) => `${ms.toFixed(2)} ms`;
const fmtUs = (us) => `${us.toFixed(2)} µs`;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/* ─── main ───────────────────────────────────────────────────────────── */
async function main() {
  const { root, n, reps, iters } = parseArgs(process.argv.slice(2));

  const distMjs = path.join(root, 'dist', 'index.mjs');
  if (!fs.existsSync(distMjs)) {
    console.error('engine-bench: dist/index.mjs missing. Run `npm run build` first.');
    return 1;
  }

  const valet = await import(pathToFileURL(distMjs).href);
  const { styled } = valet;

  /* ENGINE S10: `styleCache` is no longer exported — read it from the
     shared style registry on globalThis (created at engine import). */
  const registry = globalThis[Symbol.for('@archway/valet/style-registry/v1')];
  if (!registry?.styleCache) {
    console.error(
      'engine-bench: style registry missing at globalThis[Symbol.for(\'@archway/valet/style-registry/v1\')]',
    );
    return 1;
  }
  const styleCache = registry.styleCache;

  console.log('engine-bench — reporting tool, not a gate (no thresholds; exit 0)');
  console.log(`node ${process.version} · dist ${path.relative(process.cwd(), distMjs)}`);
  console.log(`params: n=${n} unique css strings · reps=${reps} · iters=${iters}\n`);

  /* Fixture: static prefix exercises the quote/url()-aware normalizer;
     three function interpolations make every render prop-dependent. */
  const Box = styled('div')`
    display: flex;
    padding: 4px 8px;
    background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>");
    content: 'valet  bench';
    ${(p) => `width: ${p.$w}px;`}
    ${(p) => p.$hot && 'outline: 1px solid red;'}
    ${(p) => `color: rgb(${p.$r}, ${p.$g}, ${p.$b});`}
  `;

  const uniqueProps = (i) => ({
    $w: 100 + i,
    $hot: i % 2 === 0,
    $r: i % 256,
    $g: (i * 7) % 256,
    $b: (i * 13) % 256,
  });
  const bigTree = () =>
    React.createElement(
      React.Fragment,
      null,
      Array.from({ length: n }, (_, i) =>
        React.createElement(Box, { key: i, ...uniqueProps(i) }, null),
      ),
    );

  /* Warm up React + the styled pipeline on a DIFFERENT component so the
     cold measurement below isn't paying first-render JIT costs. */
  const Warmup = styled('span')`
    font-weight: 600;
    ${(p) => `letter-spacing: ${p.$ls}px;`}
  `;
  for (let i = 0; i < 300; i += 1) {
    renderToString(React.createElement(Warmup, { $ls: i % 4 }));
  }

  /* (a) COLD — every css string unique and unseen ---------------------- */
  const cacheBefore = styleCache.size;
  const t0 = performance.now();
  renderToString(bigTree());
  const cold = performance.now() - t0;
  const uniqueAdded = styleCache.size - cacheBefore;
  console.log(`(a) cold  styled render, ${n} unique css strings: ${fmtMs(cold)}`);
  console.log(`          (${fmtUs((cold * 1000) / n)} per unique string · ${uniqueAdded} classes cached)`);

  /* (b) WARM — identical tree, identical strings ----------------------- */
  const warmRuns = [];
  for (let r = 0; r < reps; r += 1) {
    const t = performance.now();
    renderToString(bigTree());
    warmRuns.push(performance.now() - t);
  }
  const warmMin = Math.min(...warmRuns);
  console.log(
    `(b) warm  re-render of the same ${n} strings ×${reps}: min ${fmtMs(warmMin)} · median ${fmtMs(median(warmRuns))}`,
  );
  console.log(
    `          (${fmtUs((warmMin * 1000) / n)} per repeat string · runs: ${warmRuns.map((x) => x.toFixed(1)).join(' / ')})`,
  );

  /* (c) per-render overhead with function interpolations --------------- */
  const TREE = 20; // components per renderToString call
  const fixed = uniqueProps(1); // constant props → constant raw css
  const renders = iters * TREE;

  /* (c0) plain <div> reference — the React floor. */
  const plainTree = () =>
    React.createElement(
      React.Fragment,
      null,
      Array.from({ length: TREE }, (_, i) => React.createElement('div', { key: i }, null)),
    );
  const tPlain = performance.now();
  for (let i = 0; i < iters; i += 1) renderToString(plainTree());
  const plain = performance.now() - tPlain;

  /* (c1) fresh instances — global memo path (renderToString never reuses
     component instances, so the per-instance layer cannot hit here). */
  const styledTree = () =>
    React.createElement(
      React.Fragment,
      null,
      Array.from({ length: TREE }, (_, i) => React.createElement(Box, { key: i, ...fixed }, null)),
    );
  const tStyled = performance.now();
  for (let i = 0; i < iters; i += 1) renderToString(styledTree());
  const styledMs = performance.now() - tStyled;

  console.log(`(c) fn-interpolation per-render overhead (${renders} renders):`);
  console.log(`    (c0) plain <div> reference:        ${fmtMs(plain)} (${fmtUs((plain * 1000) / renders)}/render)`);
  console.log(
    `    (c1) styled, fresh instances:      ${fmtMs(styledMs)} (${fmtUs((styledMs * 1000) / renders)}/render · +${fmtUs(((styledMs - plain) * 1000) / renders)} over plain)`,
  );

  /* (c2) same instance re-rendered with unchanged raw css (jsdom). */
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://valet.invalid/bench',
  });
  for (const [k, v] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
  })) {
    Object.defineProperty(globalThis, k, { value: v, configurable: true });
  }
  const { createRoot } = await import('react-dom/client');
  const { flushSync } = await import('react-dom');

  const container = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(container);
  const reactRoot = createRoot(container);
  /* Mount once outside the timed loop — this also flushes every pending
     rule recorded during (a)–(c1) into the fresh jsdom sheet. */
  flushSync(() => reactRoot.render(React.createElement(Box, fixed, null)));

  const c2Iters = iters * 2;
  const tSame = performance.now();
  for (let i = 0; i < c2Iters; i += 1) {
    /* New element object each pass (identical values) so React re-renders
       the SAME fiber instead of bailing out on element identity. */
    flushSync(() => reactRoot.render(React.createElement(Box, { ...fixed }, null)));
  }
  const same = performance.now() - tSame;
  console.log(
    `    (c2) styled, same instance (jsdom): ${fmtMs(same)} (${fmtUs((same * 1000) / c2Iters)}/render, unchanged raw css ×${c2Iters})`,
  );

  console.log(`\nsanity: styleCache holds ${styleCache.size} classes`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('engine-bench: crashed —', err);
    process.exit(1);
  },
);
