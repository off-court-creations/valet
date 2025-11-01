// Flat ESLint config for valet app (TS template)
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/**/*.d.ts'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': ts, react, 'react-hooks': hooks, prettier },
    settings: { react: { version: 'detect' } },
    rules: {
      ...(ts.configs.recommended?.rules ?? {}),
      ...(react.configs.recommended?.rules ?? {}),
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...(prettier.configs.recommended?.rules ?? {}),
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': 'off',
    },
  },
];

