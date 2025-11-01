// Flat ESLint config for valet app (JS template)
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: { react, 'react-hooks': hooks, prettier },
    settings: { react: { version: 'detect' } },
    rules: {
      ...(react.configs.recommended?.rules ?? {}),
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...(prettier.configs.recommended?.rules ?? {}),
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

