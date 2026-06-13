// ─────────────────────────────────────────────────────────────
// tsup.config.ts  | valet
// ESM-only per-module dist (PACKAGING S4, ruling Q1(a); veto
// register: stay on tsup, barrel is the ONLY public entry, single
// bundled index.d.mts, target pinned es2020).
//
// Two passes:
//  • JS — every src module is an entry (tests/test-utils excluded),
//    format esm + code splitting, so consumers' bundlers tree-shake
//    at module granularity (sandbox: Button-only consumer
//    136KB→~17KB raw / 40KB→~6.4KB gzip). The emitted files mirror
//    src/ under dist/ but are NOT public API: package.json `exports`
//    resolves only the barrel (./dist/index.mjs), ./styles.css and
//    ./package.json — deep imports stay unsupported.
//  • DTS — the barrel alone, bundled to a single dist/index.d.mts.
//
// The package pins `"type": "commonjs"` (explicit, publint-clean):
// every shipped runtime/declaration file is .mjs / .d.mts, so the
// extensions carry the ESM format unambiguously — and the CJS-typed
// package is exactly what pins tsup's output extensions to the
// veto-registered names (a `"type": "module"` package would emit
// .js/.d.ts instead).
// `clean` is intentionally NOT set here — with two configs it would
// race (the second pass would wipe the first); the build script owns
// `npm run clean`.
// ─────────────────────────────────────────────────────────────
import { defineConfig } from 'tsup';

export default defineConfig([
  /* Pass 1 — JS: per-module ESM with shared chunks */
  {
    entry: [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.test.*', // *.test.ts(x) + *.dom.test.ts(x) + ssr-import.test.ts
      '!src/test-utils/**',
      '!src/**/*.d.ts', // ambient declarations are not runtime entries
    ],
    format: ['esm'],
    target: 'es2020',
    splitting: true,
    treeshake: true,
    sourcemap: false,
    dts: false,
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
  },
  /* Pass 2 — DTS: single bundled declaration for the barrel */
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: { only: true },
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
  },
]);
