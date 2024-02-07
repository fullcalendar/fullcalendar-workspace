const nodeResolve = require('@rollup/plugin-node-resolve').default
const postcss = require('rollup-plugin-postcss')

module.exports = {
  input: 'src/index.js',
  plugins: [
    nodeResolve(),
    postcss({
      config: false, // don't attempt to load a postcss config
    })
  ],
  output: {
    file: 'dist/index.js',
    format: 'iife'
  }
}
