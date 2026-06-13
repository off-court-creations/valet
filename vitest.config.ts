// ─────────────────────────────────────────────────────────────
// vitest.config.ts | valet
// Two-project test harness (ruling R28 — TEST-CI owns this file)
//
// • 'node'  — environment node; plain unit tests over pure modules
//             (src/**/*.test.ts, scripts/**/*.test.{js,mjs,ts})
// • 'dom'   — environment jsdom; selected by the *.dom.test.ts(x)
//             suffix (src/**/*.dom.test.{ts,tsx})
//
// Conventions: tests are colocated in src/; `.spec.*` is banned
// (it would never match these globs). pool 'forks' is load-bearing:
// the house TZ convention (withTZ) relies on per-file processes.
// ─────────────────────────────────────────────────────────────
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  /* tsx tests use the modern JSX transform (no React in scope).
     vitest 4 bundles rolldown-vite, where oxc supersedes esbuild —
     an `esbuild: { jsx: 'automatic' }` block would be ignored with
     a warning. The esbuild fallback path reads tsconfig's
     `"jsx": "react-jsx"` and lands on the same transform. */
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    pool: 'forks',
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.{js,mjs,ts}'],
          exclude: [...configDefaults.exclude, '**/*.dom.test.*'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.{ts,tsx}'],
        },
      },
    ],
  },
});
