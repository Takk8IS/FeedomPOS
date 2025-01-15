const webpack = require('webpack')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new webpack.EnvironmentPlugin({
    NODE_ENV: 'production',
    DEBUG: false,
  }),
  new HtmlWebpackPlugin({
    template: './src/index.html',
    filename: 'index.html',
    inject: 'body',
  }),
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'src/assets', to: 'assets' },
      { from: 'src/locales', to: 'locales' },
    ],
  }),
  new CleanWebpackPlugin(),
  new webpack.ProgressPlugin(),
  new ESLintPlugin({
    extensions: ['js', 'jsx', 'ts', 'tsx'],
  }),
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: '../bundle-analysis.html',
  }),
  new webpack.DefinePlugin({
    'process.env.VERSION': JSON.stringify(process.env.npm_package_version),
  }),
]
