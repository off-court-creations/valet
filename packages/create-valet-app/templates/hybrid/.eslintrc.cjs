// Hybrid ESLint config (TS + JS)
module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['dist/', 'node_modules/', 'src/**/*.d.ts'],
  overrides: [
    // TypeScript files — strict rules
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
    // JavaScript files — lighter rules
    {
      files: ['**/*.js', '**/*.jsx'],
      env: { browser: true, node: true, es2021: true },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: ['react', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
      rules: {
        'react/prop-types': 'off',
        'react/no-unknown-property': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      },
    },
  ],
};
