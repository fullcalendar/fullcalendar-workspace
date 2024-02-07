const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    'example-es': './src/example-es.js',
    'example-all': './src/example-all.js',
    'example-some': './src/example-some.js'
  },
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
    filename: '[name].js',
  },
}
