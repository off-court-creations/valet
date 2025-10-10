// ─────────────────────────────────────────────────────────────
// .eslintrc.cjs | valet
// configure TypeScript and React linting with Prettier
// ─────────────────────────────────────────────────────────────

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
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
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['docs/src/**/*.{ts,tsx,js,jsx}'],
      env: { browser: true, es2022: true },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        // Keep docs ergonomics friendly; tighten as needed later
      },
    },
  ],
};
