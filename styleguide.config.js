// styleguide.config.js
const path = require('path');
const {
  withDefaultConfig
} = require('react-docgen-typescript');

module.exports = {
  title: '🧱 valet Style Guide',

  // Which files to load as “components”
  components: 'src/components/**/[A-Z]*.{ts,tsx}',

  // Use the TS parser, with a propFilter built in
  propsParser: withDefaultConfig({
    tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
    shouldExtractLiteralValuesFromEnum: true,
    savePropValueAsString: true,
    // Ignore props coming from node_modules (e.g. React’s own props)
    propFilter: (prop) =>
      prop.parent == null ||
      !/node_modules/.test(prop.parent.fileName),
  }).parse,

  // This tells react-docgen to pick up both named & default exports
  resolver: require('react-docgen').resolver.findAllComponentDefinitions,

  webpackConfig: {
    resolve: {
      alias: {
        '@valet/core': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        },
      ],
    },
  },

  styleguideDir: 'styleguide',
};
