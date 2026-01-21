
// input
export const srcExtensions = ['.ts', '.tsx']
export const transpiledSubdir = 'dist/.tsout'
export const transpiledExtension = '.js'
export const assetExtensions = [
  '.css',
  '.module.css.js', // HACK for externalizing CSS modules via .d.ts files
]

// output
export const esmExtension = '.js'
export const iifeExtension = '.js'
