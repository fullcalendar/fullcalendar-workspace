import { readFile } from 'fs/promises'
import { readFileSync } from 'fs'
import { join as joinPaths } from 'path'
import { createHash } from 'crypto'
import { RollupOptions, Plugin, OutputOptions, RollupWarning } from 'rollup'
import handlebars from 'handlebars'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import dtsPlugin from 'rollup-plugin-dts'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import commonjsPluginLib from '@rollup/plugin-commonjs'
import jsonPluginLib from '@rollup/plugin-json'
import postcssPluginLib from 'rollup-plugin-postcss'
import replacePluginLib from '@rollup/plugin-replace'
import { mapProps } from '../../utils/lang.js'
import { MonorepoStruct } from '../../utils/monorepo-struct.js'
import { analyzePkg } from '../../utils/pkg-analysis.js'
import { readPkgJson } from '../../utils/pkg-json.js'
import { standardScriptsDir } from '../../utils/script-runner.js'
import {
  transpiledExtension,
  transpiledSubdir,
  cjsExtension,
  esmExtension,
  iifeExtension,
  assetExtensions,
  manualChunkEntryAliases,
} from './config.js'
import {
  computeExternalPkgs,
  computeIifeExternalPkgs,
  computeGlobals,
  computeOwnExternalPaths,
  computeOwnIifeExternalPaths,
  EntryStruct,
  entryStructsToContentMap,
  PkgBundleStruct,
  GlobalVarMap,
} from './bundle-struct.js'
import {
  externalizeExtensionsPlugin,
  externalizePathsPlugin,
  externalizePkgsPlugin,
  generatedContentPlugin,
  minifySeparatelyPlugin,
  massageDtsPlugin,
  rerootPlugin,
  simpleDotAssignment,
} from './rollup-plugins.js'

const commonjsPlugin = cjsInterop(commonjsPluginLib)
const jsonPlugin = cjsInterop(jsonPluginLib)
const postcssPlugin = cjsInterop(postcssPluginLib)
const replacePlugin = cjsInterop(replacePluginLib)

/*
TODO: converge with buildCjsOptions and just have multiple outputs?
*/
export function buildEsmOptions(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
  minifyCss: boolean,
): RollupOptions {
  return {
    input: buildModuleInput(pkgBundleStruct),
    plugins: buildModulePlugins(pkgBundleStruct, sourcemap, minifyCss),
    output: buildEsmOutputOptions(pkgBundleStruct, sourcemap),
    onwarn,
  }
}

export function buildCjsOptions(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
  minifyCss: boolean,
): RollupOptions {
  return {
    input: buildModuleInput(pkgBundleStruct),
    plugins: buildModulePlugins(pkgBundleStruct, sourcemap, minifyCss),
    output: buildCjsOutputOptions(pkgBundleStruct, sourcemap),
    onwarn,
  }
}

export async function buildIifeOptions(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
  minify: boolean,
  sourcemap: boolean,
): Promise<RollupOptions[]> {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  const globalVarMap = computeGlobals(pkgBundleStruct, monorepoStruct)
  const banner = await buildBanner(pkgBundleStruct)
  const optionsObjs: RollupOptions[] = []

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.iife) {
      optionsObjs.push({
        input: buildIifeInput(entryStruct),
        plugins: buildIifePlugins(entryStruct, pkgBundleStruct, sourcemap, minify),
        output: buildIifeOutputOptions(entryStruct, entryAlias, pkgBundleStruct, globalVarMap, banner, sourcemap),
        onwarn,
      })
    }
  }

  return optionsObjs
}

export function buildDtsOptions(pkgBundleStruct: PkgBundleStruct): RollupOptions {
  return {
    input: buildDtsInput(pkgBundleStruct),
    plugins: buildDtsPlugins(pkgBundleStruct),
    output: buildDtsOutputOptions(pkgBundleStruct),
    onwarn,
  }
}

// Input
// -------------------------------------------------------------------------------------------------

type InputMap = { [entryAlias: string]: string }

function buildModuleInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  let inputMap: InputMap = {}

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.module) {
      inputMap[entryAlias] = entryStruct.entrySrcPath
    }
  }

  return inputMap
}

function buildIifeInput(entryStruct: EntryStruct): string {
  return entryStruct.entrySrcBase + transpiledExtension
}

function buildDtsInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  let inputMap: InputMap = {}

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.module) {
      inputMap[entryAlias] = entryStruct.entrySrcBase + '.d.ts'
    }
  }

  return inputMap
}

// Output
// -------------------------------------------------------------------------------------------------

function buildEsmOutputOptions(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
): OutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
    entryFileNames: 'esm/[name]' + esmExtension,
    chunkFileNames: 'esm/[name]' + esmExtension,
    manualChunks: buildManualChunks(pkgBundleStruct, transpiledExtension),
    sourcemap,
  }
}

function buildCjsOutputOptions(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
): OutputOptions {
  return {
    format: 'cjs',
    exports: 'named',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
    entryFileNames: 'cjs/[name]' + cjsExtension,
    chunkFileNames: 'cjs/[name]' + cjsExtension,
    manualChunks: buildManualChunks(pkgBundleStruct, transpiledExtension),
    sourcemap,
  }
}

function buildIifeOutputOptions(
  entryStruct: EntryStruct,
  entryAlias: string,
  pkgBundleStruct: PkgBundleStruct,
  globalVarMap: GlobalVarMap,
  banner: string,
  sourcemap: boolean,
): OutputOptions {
  const { pkgDir, entryConfigMap } = pkgBundleStruct
  const globalVar = entryConfigMap[entryStruct.entryGlob].globalVar

  return {
    format: 'iife',
    banner,
    file: joinPaths(pkgDir, 'dist', entryAlias) + iifeExtension,
    globals: globalVarMap,
    ...(
      globalVar
        ? { exports: 'named', name: globalVar }
        : { exports: 'none' }
    ),
    interop: 'auto',
    freeze: false,
    sourcemap,
  }
}

function buildDtsOutputOptions(pkgBundleStruct: PkgBundleStruct): OutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist/esm'),
    entryFileNames: '[name].d.ts',
    chunkFileNames: '[name].d.ts',
    manualChunks: buildManualChunks(pkgBundleStruct, '.d.ts'),
  }
}

// Chunk Options
// -------------------------------------------------------------------------------------------------

function buildManualChunks(
  pkgBundleStruct: PkgBundleStruct,
  inExtension: string,
): { [absPath: string]: string[] } {
  const { pkgDir, entryStructMap } = pkgBundleStruct
  const manualChunks: { [absPath: string]: string[] } = {}

  for (const chunkName in manualChunkEntryAliases) {
    const entryAliases = manualChunkEntryAliases[chunkName]
    const validEntryPaths: string[] = []

    for (const entryAlias of entryAliases) {
      if (entryStructMap[entryAlias]) {
        validEntryPaths.push(joinPaths(pkgDir, transpiledSubdir, entryAlias + inExtension))
      }
    }

    if (validEntryPaths.length) {
      manualChunks[chunkName] = validEntryPaths
    }
  }

  return manualChunks
}

// Plugins Lists
// -------------------------------------------------------------------------------------------------

function buildModulePlugins(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
  minifyCss: boolean,
): Plugin[] {
  const { pkgDir, entryStructMap } = pkgBundleStruct

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin({
      pkgNames: computeExternalPkgs(pkgBundleStruct),
    }),
    generatedContentPlugin(
      entryStructsToContentMap(entryStructMap),
    ),
    ...buildJsPlugins(pkgBundleStruct, minifyCss),
    ...(sourcemap ? [sourcemapsPlugin()] : []), // load preexisting sourcemaps
  ]
}

/*
TODO: inefficient to repeatedly generate all this?
*/
function buildIifePlugins(
  currentEntryStruct: EntryStruct,
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
  minify: boolean,
): Plugin[] {
  const { pkgDir, entryStructMap } = pkgBundleStruct

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin({
      pkgNames: computeIifeExternalPkgs(pkgBundleStruct),
    }),
    externalizePathsPlugin({
      paths: computeOwnIifeExternalPaths(currentEntryStruct, pkgBundleStruct),
    }),
    generatedContentPlugin(entryStructsToContentMap(entryStructMap)),
    simpleDotAssignment(),
    ...buildJsPlugins(pkgBundleStruct, minify),
    ...(sourcemap ? [sourcemapsPlugin()] : []),
    ...(minify ? [minifySeparatelyPlugin()] : []),
  ]
}

function buildDtsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  return [
    externalizeAssetsPlugin(),
    externalizePkgsPlugin({
      pkgNames: computeExternalPkgs(pkgBundleStruct),
      moduleSideEffects: true, // for including ambient declarations in other packages
    }),
    // rollup-plugin-dts normally gets confused with code splitting. this helps a lot.
    externalizePathsPlugin({
      paths: computeOwnExternalPaths(pkgBundleStruct),
    }),
    dtsPlugin(),
    massageDtsPlugin(),
    nodeResolvePlugin({
      ignoreSideEffectsForRoot: true,
    }),
  ]
}

function buildJsPlugins(pkgBundleStruct: PkgBundleStruct, minifyCss: boolean): Plugin[] {
  const pkgAnalysis = analyzePkg(pkgBundleStruct.pkgDir)

  if (pkgAnalysis.isTests) {
    return buildTestJsPlugins()
  } else {
    return buildNormalJsPlugins(pkgBundleStruct, minifyCss)
  }
}

function buildNormalJsPlugins(pkgBundleStruct: PkgBundleStruct, minifyCss: boolean): Plugin[] {
  const { pkgDir, pkgJson } = pkgBundleStruct

  return [
    nodeResolvePlugin({
      ignoreSideEffectsForRoot: true,
    }),
    cssPlugin({
      inject: {
        importId: pkgJson.name === '@fullcalendar/core' ?
          joinPaths(pkgDir, transpiledSubdir, 'styleUtils' + transpiledExtension) :
          '@fullcalendar/core/internal',
        importProp: 'injectStyles',
      },
      minify: minifyCss,
    }),
    replacePlugin({
      delimiters: ['<%= ', ' %>'],
      preventAssignment: true,
      values: {
        releaseDate: new Date().toISOString().replace(/T.*/, ''), // just YYYY-MM-DD
        pkgName: pkgJson.name,
        pkgVersion: pkgJson.version,
      },
    }),
  ]
}

function buildTestJsPlugins(): Plugin[] {
  return [
    nodeResolvePlugin({ // determines index.js and .js/cjs/mjs
      browser: true, // for xhr-mock (use non-node shims that it wants to)
      preferBuiltins: false, // for xhr-mock (use 'url' npm package)
      ignoreSideEffectsForRoot: true,
    }),
    commonjsPlugin(), // for moment and moment-timezone
    jsonPlugin(), // for moment-timezone
    cssPlugin({ inject: true }),
    replacePlugin({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': '"development"',
      },
    }),
  ]
}

// Plugins Wrappers
// -------------------------------------------------------------------------------------------------

interface CssInjector {
  importId: string
  importProp: string
}

function cssPlugin(options?: {
  inject?: CssInjector | boolean,
  minify?: boolean,
}): Plugin {
  const { inject, minify } = options || {}

  return postcssPlugin({
    config: {
      path: joinPaths(standardScriptsDir, 'config/postcss.config.cjs'),
      ctx: {}, // arguments given to config file
    },
    modules: {
      generateScopedName(localName: string, resourcePath: string) {
        return minify
          ? 'fc-' + hashGenerator.generate(localName + resourcePath)
          : 'f-' + localName
      },
    },
    inject: typeof inject === 'object' ?
      (cssVarName: string) => {
        return `import { ${inject.importProp} } from ${JSON.stringify(inject.importId)};\n` +
          `injectStyles(${cssVarName});\n`
      } :
      (inject || false),
    minimize: true,
  })
}

function rerootAssetsPlugin(pkgDir: string): Plugin {
  return rerootPlugin({
    extensions: assetExtensions,
    oldRoot: joinPaths(pkgDir, 'dist', '.tsout'),
    newRoot: joinPaths(pkgDir, 'src'),
  })
}

function externalizeAssetsPlugin(): Plugin {
  return externalizeExtensionsPlugin(assetExtensions)
}

// Misc
// -------------------------------------------------------------------------------------------------

async function buildBanner(pkgBundleStruct: PkgBundleStruct): Promise<string> {
  const { pkgDir, pkgJson } = pkgBundleStruct

  const pkgAnalysis = analyzePkg(pkgDir)
  const basePkgJson = await readPkgJson(pkgAnalysis.metaRootDir) // TODO: use a cached version
  const fullPkgJson = { ...basePkgJson, ...pkgJson }

  // TODO: cache the template
  const templatePath = joinPaths(standardScriptsDir, 'config/banner.tpl')
  const templateText = await readFile(templatePath, 'utf8')
  const template = handlebars.compile(templateText)

  return template(fullPkgJson).trim()
}

function onwarn(warning: RollupWarning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    console.error(warning.toString())
  }
}

function cjsInterop<DefaultExport>(namespace: { default: DefaultExport }): DefaultExport {
  return namespace.default || (namespace as DefaultExport)
}

// Crypto
// -------------------------------------------------------------------------------------------------

class HashGenerator {
  private hashMap: Map<string, string> = new Map()
  private usedHashes: Set<string> = new Set()

  constructor(private hashLength: number, private salt: string) {
  }

  generate(input: string) {
    if (this.hashMap.has(input)) {
      return this.hashMap.get(input)
    }

    const hash = this.generateNew(input)
    this.hashMap.set(input, hash)
    return hash
  }

  generateNew(input: string) {
    let attemptCnt = 0
    let hash

    do {
      hash = this.generateAttempt(input, attemptCnt++)
    } while (this.usedHashes.has(hash));

    this.usedHashes.add(hash)
    return hash
  }

  generateAttempt(input: string, attemptNum: number) {
    if (attemptNum > 100) {
      throw new Error('Too many attempts. Consider increasing hashLength')
    }

    return hashToAlphaNumeric(String(attemptNum) + this.salt + input)
      .substring(0, this.hashLength)
  }
}

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function hashToAlphaNumeric(input: string) {
  const hash = createHash('md5').update(input).digest() // Buffer of 16 bytes
  let num = BigInt('0x' + hash.toString('hex')) // Convert to BigInt

  // Convert to base62
  let result = ''
  while (num > 0n) {
    result += CHARS[Number(num % 62n)]
    num = num / 62n
  }

  return result
}

const pkgManifestJson = readFileSync('./package.json', 'utf8')
const pkgManifest = JSON.parse(pkgManifestJson)
if (!pkgManifest.version) {
  throw new Error('Must have package.json#version')
}
const hashGenerator = new HashGenerator(2, pkgManifest.version)
