const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
  },
  plugins: [
    new MomentLocalesPlugin(), // strip all locales except 'en'
    new MomentTimezoneDataPlugin({
      matchZones: ['Europe/Madrid'], // strip all zones except this one. used in the demo
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
  ]
}
