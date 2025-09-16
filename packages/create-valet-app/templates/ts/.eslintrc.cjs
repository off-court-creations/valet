// ESLint config (TS-only)
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist/', 'node_modules/', 'src/**/*.d.ts'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: ['@typescript-eslint', 'react', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
      rules: {
        'react/no-unknown-property': 'off',
      },
    },
  ],
};
