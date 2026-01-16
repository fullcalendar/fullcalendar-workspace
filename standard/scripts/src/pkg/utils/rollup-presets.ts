import commonjsPluginLib from '@rollup/plugin-commonjs'
import jsonPluginLib from '@rollup/plugin-json'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import replacePluginLib from '@rollup/plugin-replace'
import { readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import handlebars from 'handlebars'
import { join as joinPaths } from 'path'
import { type OutputOptions, type Plugin, type RollupOptions } from 'rollup'
import dtsPlugin from 'rollup-plugin-dts'
import postcssPluginLib from 'rollup-plugin-postcss'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import { analyzePkg } from '../../utils/pkg-analysis.ts'
import { readPkgJson } from '../../utils/pkg-json.ts'
import { standardScriptsDir } from '../../utils/script-runner.ts'
import {
  computeGlobalExternalPkgs,
  computeModuleExternalPkgs,
  computeOwnExternalPaths,
  entryStructsToContentMap,
  type PkgBundleStruct
} from './bundle-struct.ts'
import {
  assetExtensions,
  esmExtension
} from './config.ts'
import { HashGenerator } from './hash-generator.ts'
import transformClassNamesPlugin from './rollup-plugins-theming.ts'
import {
  copyCssPlugin,
  externalizeExtensionsPlugin,
  externalizePathsPlugin,
  externalizePkgsPlugin,
  generatedContentPlugin,
  massageDtsPlugin,
  rerootPlugin
} from './rollup-plugins.ts'

const commonjsPlugin = cjsInterop(commonjsPluginLib)
const jsonPlugin = cjsInterop(jsonPluginLib)
const postcssPlugin = cjsInterop(postcssPluginLib)
const replacePlugin = cjsInterop(replacePluginLib)

export function buildModuleOptions(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  sourcemaps: boolean,
): RollupOptions {
  return {
    input: buildModuleInput(pkgBundleStruct),
    plugins: buildModulePlugins(
      pkgBundleStruct,
      isDev,
      sourcemaps, // sourcemapLoading
    ),
    output: buildModuleOutputOptions(pkgBundleStruct, sourcemaps),
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`${pkgBundleStruct.pkgDir}(esm): ${warning}`)
      }
    }
  }
}

export async function buildGlobalOptions(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  sourcemaps: boolean,
): Promise<RollupOptions> {
  const pkgAnalysis = analyzePkg(pkgBundleStruct.pkgDir)

  return {
    input: buildGlobalInput(pkgBundleStruct),
    plugins: await buildGlobalPlugins(
      pkgBundleStruct,
      isDev,
      sourcemaps, // sourcemapLoading
    ),
    output: { // TEMPORARY
      format: 'esm',
      dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks-global/[name]-[hash].js',
      sourcemap: sourcemaps,
    },
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`${pkgBundleStruct.pkgDir}(iife): ${warning}`)
      }
    },
    // Workaround for rollup being aggressive about tree-shacking
    treeshake: !pkgAnalysis.isTests,
  }
}

export function buildDtsOptions(pkgBundleStruct: PkgBundleStruct): RollupOptions {
  return {
    input: buildDtsInput(pkgBundleStruct),
    plugins: buildDtsPlugins(pkgBundleStruct),
    output: buildDtsOutputOptions(pkgBundleStruct),
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`${pkgBundleStruct.pkgDir}(dts): ${warning}`)
      }
    },
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

    if (entryConfig.format === 'module') {
      inputMap[entryAlias] = entryStruct.entrySrcPath
    }
  }

  return inputMap
}

function buildGlobalInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  let inputMap: InputMap = {}

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.format === 'global') {
      inputMap[entryAlias] = entryStruct.entrySrcPath
    }
  }

  return inputMap
}

function buildDtsInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  let inputMap: InputMap = {}

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.types) {
      if (entryConfig.format === 'module') {
        // HACK: will execute many times per-file
        // HACK: don't hardcode tsout dir
        inputMap[entryConfig.types] = joinPaths(pkgBundleStruct.pkgDir, 'dist/.tsout', entryConfig.types + '.d.ts')
      }
    } else if (entryConfig.format === 'module') {
      inputMap[entryAlias] = entryStruct.entrySrcBase + '.d.ts'
    }
  }

  return inputMap
}

// Output
// -------------------------------------------------------------------------------------------------

function buildModuleOutputOptions(
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
): OutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
    entryFileNames: 'esm/[name]' + esmExtension,
    chunkFileNames: 'esm/chunks/[name]-[hash]' + esmExtension,
    sourcemap,
  }
}

function buildDtsOutputOptions(pkgBundleStruct: PkgBundleStruct): OutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
    entryFileNames: 'esm/[name].d.ts',
    chunkFileNames: 'esm/chunks/[name]-[hash].d.ts',
  }
}

// Plugins Lists
// -------------------------------------------------------------------------------------------------

function buildModulePlugins(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  sourcemapLoading: boolean,
): Plugin[] {
  const { pkgDir, entryStructMap } = pkgBundleStruct
  const { isPublicMui } = analyzePkg(pkgDir)

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin({
      pkgNames: computeModuleExternalPkgs(pkgBundleStruct),
    }),
    generatedContentPlugin(
      entryStructsToContentMap(entryStructMap),
    ),
    transformClassNamesPlugin(!isDev, isPublicMui),
    ...buildJsPlugins(
        pkgBundleStruct,
        isDev,
        pkgBundleStruct.moduleConfig?.cssExtract || '',
      ),
    ...(sourcemapLoading ? [sourcemapsPlugin()] : []),
    copyCssPlugin({ srcToDest: pkgBundleStruct.cssSrcToDest }),
  ]
}

async function buildGlobalPlugins(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  sourcemapLoading: boolean,
): Promise<Plugin[]> {
  const { pkgDir, entryStructMap } = pkgBundleStruct
  const { isPublicMui } = analyzePkg(pkgDir)

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin({
      pkgNames: computeGlobalExternalPkgs(pkgBundleStruct),
    }),
    generatedContentPlugin(
      entryStructsToContentMap(entryStructMap)
    ),
    // simpleDotAssignment(), // need anymore?
    transformClassNamesPlugin(!isDev, isPublicMui),
    ...buildJsPlugins(
        pkgBundleStruct,
        isDev,
        pkgBundleStruct.globalConfig?.cssExtract || '',
      ),
    ...(sourcemapLoading ? [sourcemapsPlugin()] : []),
    // ...((cssMin || cssAsJs) ? [await extractCssSeparatelyPlugin(cssMin, cssAsJs)] : []),
    // ...(jsMin ? [minifyJsSeparatelyPlugin()] : []),
  ]
}

function buildDtsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  return [
    externalizeAssetsPlugin(),
    externalizePkgsPlugin({
      pkgNames: computeModuleExternalPkgs(pkgBundleStruct),
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

function buildJsPlugins(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  cssExtract: string,
): Plugin[] {
  const pkgAnalysis = analyzePkg(pkgBundleStruct.pkgDir)

  if (pkgAnalysis.isTests) {
    return buildTestJsPlugins()
  } else {
    return buildNormalJsPlugins(pkgBundleStruct, isDev, cssExtract)
  }
}

function buildNormalJsPlugins(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  cssExtract: string,
): Plugin[] {
  const { pkgJson } = pkgBundleStruct

  return [
    nodeResolvePlugin({
      ignoreSideEffectsForRoot: true,
    }),
    commonjsPlugin(), // for React :(
    cssPlugin({
      extract: cssExtract,
      minifyClassNames: !isDev,
    }),
    replacePlugin({
      delimiters: ['<%= ', ' %>'], // affect all "values" below
      preventAssignment: true,
      values: {
        releaseDate: new Date().toISOString().replace(/T.*/, ''), // just YYYY-MM-DD
        pkgName: pkgJson.name,
        pkgVersion: pkgJson.version,
      },
    }),
    replacePlugin({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(
          isDev
            ? 'development'
            : 'production'
        ),
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
    cssPlugin({
      // have JS store and attach CSS
      // BUG: in JS, the CSS string gets written twice for some reason
      extract: false,
      inject: true,
    }),
    replacePlugin({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
    }),
  ]
}

// Plugins Wrappers
// -------------------------------------------------------------------------------------------------

function cssPlugin(options?: {
  extract?: boolean | string,
  minifyClassNames?: boolean,
  inject?: boolean,
}): Plugin {
  const { extract, minifyClassNames, inject } = options || {}

  return postcssPlugin({
    config: {
      path: joinPaths(standardScriptsDir, 'config/postcss.config.cjs'),
      ctx: {}, // arguments given to config file
    },
    modules: {
      generateScopedName(localName: string, resourcePath: string) {
        return minifyClassNames
          ? 'fc-' + hashGenerator.generate(localName + resourcePath)
          : 'f-' + localName
      },
    },
    extract,
    inject: inject || false,
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
// TODO: revive

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

function cjsInterop<DefaultExport>(namespace: { default: DefaultExport }): DefaultExport {
  return namespace.default || (namespace as DefaultExport)
}

const pkgManifestJson = readFileSync('./package.json', 'utf8')
const pkgManifest = JSON.parse(pkgManifestJson)
if (!pkgManifest.version) {
  throw new Error('Must have package.json#version')
}
const hashGenerator = new HashGenerator(2, pkgManifest.version)
