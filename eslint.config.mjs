// Flat ESLint config for ESLint v9
// Bridges our prior .eslintrc settings to the modern format

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'docs/dist/**',
      'mcp-data/**',
      'node_modules/**',
      'packages/**/dist/**',
      '**/*.tsbuildinfo',
    ],
  },
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
];
