// Flat ESLint config for ESLint v9
// Bridges our prior .eslintrc settings to the modern format
//
// Coverage (TEST-CI S11 — audit eslint.config.mjs:22, the ~4,900
// previously-ungated release-critical lines):
//   1. src/** + docs/src/**           — the React library + docs app (TS/TSX)
//   2. scripts/** + root *.config.*   — build/release/MCP tooling + tsup/vitest
//                                        config (Node ESM, .mjs/.js/.ts)
//   3. packages/valet-mcp/src/**      — the MCP server source (Node ESM TS)
//   4. create-valet-app bin + scripts — the CLI + its validators (Node ESM)
// The library/docs block keeps the React + JSX rule set; the tooling
// blocks run the same TypeScript-recommended + prettier rules with Node
// globals and no React rules (none of those files render JSX).

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Shared rule set for the non-React Node tooling (scripts, configs, MCP
// server, CLI): TypeScript-recommended where the parser is in play, plus
// prettier. `no-undef` stays off (the base eslint:recommended is not
// extended here, matching the library block), so Node globals are declared
// via languageOptions only for completeness / future rule additions.
//
// `no-explicit-any` is downgraded to a warning (matching how the library
// block treats `react-hooks/exhaustive-deps`): the remaining `any`s live
// at loosely-typed boundaries — MCP-SDK callback args, JSON.parse of an
// arbitrary package.json, the DATA_INFO probe — where a precise type is a
// real refactor, not a mechanical edit. The smell still surfaces in lint
// output; it just does not fail the gate.
//
// `ban-ts-comment` keeps `@ts-ignore` banned (use `@ts-expect-error`) but
// permits `@ts-nocheck`: these JS scripts are now under `checkJs`
// (typecheck:scripts), and one extractor that drives the ts-morph node-
// union API carries a documented file-level `@ts-nocheck` escape hatch
// (its behavior is covered by tests + the mcp:build gate).
const toolingRules = {
  ...(tsPlugin.configs.recommended?.rules ?? {}),
  ...(prettierPlugin.configs.recommended?.rules ?? {}),
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-nocheck': false,
      'ts-ignore': true,
      'ts-expect-error': 'allow-with-description',
    },
  ],
};

const toolingPlugins = {
  '@typescript-eslint': tsPlugin,
  prettier: prettierPlugin,
};

export default [
  {
    ignores: [
      'dist/**',
      'docs/dist/**',
      'mcp-data/**',
      'node_modules/**',
      'packages/**/dist/**',
      'packages/**/node_modules/**',
      'packages/create-valet-app/templates/**',
      '.claude/**',
      '**/*.tsbuildinfo',
    ],
  },
  /* 1. The React library + docs app. */
  {
    files: ['src/**/*.{ts,tsx}', 'docs/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript recommended
      ...(tsPlugin.configs.recommended?.rules ?? {}),
      // React recommended
      ...(reactPlugin.configs.recommended?.rules ?? {}),
      // Use the modern JSX transform (no React in scope required)
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // React Hooks recommended
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Prettier integration
      ...(prettierPlugin.configs.recommended?.rules ?? {}),
    },
  },
  /* 1b. Type-aware deprecation gate for the docs app (the durable gate).
     The docs app consumes `@archway/valet` through the
     `docs/node_modules/@archway/valet -> ../../..` symlink; the published
     types (`dist/index.d.mts`) carry the `@deprecated` JSDoc tags emitted by
     tsup's dts build. Layering `no-deprecated` here — with type information
     from the docs tsconfig via `projectService` — fails the lint gate the
     moment a doc page (or CVA template that lands under docs/src) reaches for a
     deprecated 0.35.0 API, instead of only dev-warning at runtime in the
     browser. Scoped to `docs/src/**` so the type-checker program stays small
     and the non-type-aware src/** block above is untouched. */
  {
    files: ['docs/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', '*.tsx'],
          defaultProject: 'docs/tsconfig.app.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
  /* 2a. Build/release/MCP tooling scripts + the CLI (Node ESM, JS/MJS). */
  {
    files: [
      'scripts/**/*.{mjs,js}',
      'packages/create-valet-app/bin/**/*.js',
      'packages/create-valet-app/scripts/**/*.mjs',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: toolingPlugins,
    rules: toolingRules,
  },
  /* 2b. Root TypeScript config files (tsup + vitest). */
  {
    files: ['*.config.{ts,mjs}', 'vitest.config.ts', 'tsup.config.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: toolingPlugins,
    rules: toolingRules,
  },
  /* 3. The MCP server source (Node ESM TypeScript). The server speaks
     JSON-RPC over stdout, so stray console output corrupts the protocol;
     the source already gates its few deliberate console writes (selfcheck
     + TTY status to stderr) behind eslint-disable directives — enabling
     `no-console` here makes those directives load-bearing rather than
     unused, and rejects any new ungated console call. */
  {
    files: ['packages/valet-mcp/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: toolingPlugins,
    rules: {
      ...toolingRules,
      'no-console': 'error',
    },
  },
];
