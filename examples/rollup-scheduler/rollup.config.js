const nodeResolve = require('@rollup/plugin-node-resolve').default
const postcss = require('rollup-plugin-postcss')

module.exports = {
  input: 'src/index.js',
  plugins: [
    nodeResolve(),
    postcss({
      config: false, // don't attempt to load a postcss config
      inject: true,  // inject CSS into <style> tag at runtime
    })
  ],
  output: {
    file: 'dist/index.js',
    format: 'iife'
  }
}
