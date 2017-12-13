const path = require('path')
const webpack = require('webpack')
const { CheckerPlugin } = require('awesome-typescript-loader') // for https://github.com/webpack/webpack/issues/3460
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const packageConfig = require('./package.json')

/*
NOTE: js and typescript module names shouldn't have a .js extention,
however, all other types of modules should.
*/
const MODULES = {
  'scheduler': './src/main.ts',
  'scheduler.css': './src/main.scss'
}

const BANNER =
  '<%= title %> v<%= version %>\n' +
  'Docs & License: <%= homepage %>\n' +
  '(c) <%= copyright %>'

module.exports = {

  entry: MODULES,

  externals: {
    jquery: {
      commonjs: 'jquery',
      commonjs2: 'jquery',
      amd: 'jquery',
      root: 'jQuery'
    },
    moment: 'moment',
    fullcalendar: {
      commonjs: 'fullcalendar',
      commonjs2: 'fullcalendar',
      amd: 'fullcalendar',
      root: 'FullCalendar'
    }
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // use our slimmed down version
      // still need to npm-install the original though, for typescript transpiler
      tslib: path.resolve(__dirname, 'src/tslib-lite.js')
    }
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract([ 'css-loader' ])
      },
      {
        test: /\.(sass|scss)$/,
        loader: ExtractTextPlugin.extract([ 'css-loader', 'sass-loader' ])
      }
    ]
  },

  plugins: [
    new CheckerPlugin(),
    new ExtractTextPlugin({
      filename: '[name]', // the module name should already have .css in it!
      allChunks: true
    }),
    new webpack.BannerPlugin(BANNER)
  ],

  output: {
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/'),
    devtoolModuleFilenameTemplate: 'webpack:///' + packageConfig.name + '[resource-path]'
  }

}
