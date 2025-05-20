const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    content: ['./src/content/content.js', './src/content/formatter.js'],
    background: ['./src/background/background.js'],
    // Removed './src/popup/popup.css' from here, will import in popup.js
    popup: ['./src/popup/popup.js', './src/popup/templateManager.js', './src/popup/themeManager.js', './src/popup/ui.js'],
    'browser-polyfill': './src/browser-polyfill.js',
    hunterMode: './src/content/hunterMode.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      },
      {
        test: /\.json$/,
        type: 'json',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/icons', to: 'icons' },
        { from: 'src/browser-polyfill.js', to: 'browser-polyfill.js' },
        { from: 'src/popup/bg-animation.js', to: 'bg-animation.js' }, // Added this line
        // Manifest must be included here for packaging
        { from: 'manifest.json', to: 'manifest.json' }, // Uncommented this line
      ],
    }),
  ],
  mode: 'production',
  devtool: 'inline-source-map',
  optimization: {
    minimize: true,
    minimizer: [
      (compiler) => {
        const TerserPlugin = require('terser-webpack-plugin');
        new TerserPlugin({
          terserOptions: {
            mangle: false,
            compress: {
              defaults: false,
              dead_code: true,
              unused: true,
              conditionals: true,
              evaluate: true,
            },
            output: {
              beautify: false,
              comments: false,
            },
          },
        }).apply(compiler);
      },
    ],
  },
};