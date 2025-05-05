
// input
export const srcExtensions = ['.ts', '.tsx']
export const transpiledSubdir = 'dist/.tsout'
export const transpiledExtension = '.js'
export const assetExtensions = ['.css']

// output
export const cjsExtension = '.cjs'
export const esmExtension = '.js'
export const iifeExtension = '.js'

// for consistent chunk names
export const manualChunkEntryAliases: { [chunkName: string]: string[] } = {
  'internal-common': ['internal'],
}
