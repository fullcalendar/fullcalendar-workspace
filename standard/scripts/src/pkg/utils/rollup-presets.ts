import { readFile } from 'fs/promises'
import { readFileSync } from 'fs'
import { join as joinPaths } from 'path'
import { type RollupOptions, type Plugin, type OutputOptions, type RollupWarning } from 'rollup'
import handlebars from 'handlebars'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import dtsPlugin from 'rollup-plugin-dts'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import commonjsPluginLib from '@rollup/plugin-commonjs'
import jsonPluginLib from '@rollup/plugin-json'
import postcssPluginLib from 'rollup-plugin-postcss'
import replacePluginLib from '@rollup/plugin-replace'
import { type MonorepoStruct } from '../../utils/monorepo-struct.ts'
import { analyzePkg } from '../../utils/pkg-analysis.ts'
import { readPkgJson } from '../../utils/pkg-json.ts'
import { standardScriptsDir } from '../../utils/script-runner.ts'
import {
  transpiledExtension,
  transpiledSubdir,
  esmExtension,
  iifeExtension,
  assetExtensions,
  manualChunkEntryAliases,
} from './config.ts'
import {
  computeExternalPkgs,
  computeIifeExternalPkgs,
  computeGlobals,
  computeOwnExternalPaths,
  computeOwnIifeExternalPaths,
  type EntryStruct,
  entryStructsToContentMap,
  type PkgBundleStruct,
  type GlobalVarMap,
} from './bundle-struct.ts'
import {
  externalizeExtensionsPlugin,
  externalizePathsPlugin,
  externalizePkgsPlugin,
  generatedContentPlugin,
  minifyJsSeparatelyPlugin,
  massageDtsPlugin,
  rerootPlugin,
  simpleDotAssignment,
  extractCssSeparatelyPlugin,
} from './rollup-plugins.ts'
import transformClassNamesPlugin from './rollup-plugins-theming.ts'
import { HashGenerator } from './hash-generator.ts'

const commonjsPlugin = cjsInterop(commonjsPluginLib)
const jsonPlugin = cjsInterop(jsonPluginLib)
const postcssPlugin = cjsInterop(postcssPluginLib)
const replacePlugin = cjsInterop(replacePluginLib)

export function buildEsmOptions(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  sourcemap: boolean,
): RollupOptions {
  return {
    input: buildModuleInput(pkgBundleStruct),
    plugins: buildModulePlugins(
      pkgBundleStruct,
      isDev,
      sourcemap,
    ),
    output: buildEsmOutputOptions(pkgBundleStruct, sourcemap),
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`${pkgBundleStruct.pkgDir}(esm): ${warning}`)
      }
    }
  }
}

export async function buildIifeOptions(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
  isDev: boolean,
  jsMin: boolean,
  cssMin: boolean,
  sourcemap: boolean,
): Promise<RollupOptions[]> {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct
  const pkgAnalysis = analyzePkg(pkgBundleStruct.pkgDir)
  const globalVarMap = computeGlobals(pkgBundleStruct, monorepoStruct)
  const banner = await buildBanner(pkgBundleStruct)
  const optionsObjs: RollupOptions[] = []

  for (let entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]

    if (entryConfig.iife || entryConfig.cssExtract) {
      optionsObjs.push({
        input: buildIifeInput(entryStruct),
        plugins: await buildIifePlugins(
          entryStruct,
          pkgBundleStruct,
          sourcemap,
          isDev,
          jsMin && (entryConfig.iife ?? false),
          entryConfig.cssExtract,
          cssMin && (entryConfig.cssMin ?? false),
          !isDev && (entryConfig.cssAsJs ?? false),
          !isDev && (entryConfig.classNameTransform ?? false),
        ),
        output: buildIifeOutputOptions(entryStruct, entryAlias, pkgBundleStruct, globalVarMap, banner, sourcemap),
        onwarn(warning) {
          if (warning.code !== 'CIRCULAR_DEPENDENCY') {
            console.error(`${pkgBundleStruct.pkgDir}(iife): ${warning}`)
          }
        },

        // Workaround for rollup being aggressive about tree-shacking
        treeshake: !pkgAnalysis.isTests,
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

    if (entryConfig.types) {
      if (entryConfig.module) {
        // HACK: will execute many times per-file
        // HACK: don't hardcode tsout dir
        inputMap[entryConfig.types] = joinPaths(pkgBundleStruct.pkgDir, 'dist/.tsout', entryConfig.types + '.d.ts')
      }
    } else if (entryConfig.module) {
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
    chunkFileNames: 'esm/chunks/[name]-[hash]' + esmExtension,
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
  sourcemap: boolean,
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
    ...buildJsPlugins(
        pkgBundleStruct,
        isDev,
        false, // cssExtract
      ),
    ...(sourcemap ? [sourcemapsPlugin()] : []), // load preexisting sourcemaps
  ]
}

/*
TODO: inefficient to repeatedly generate all this?
*/
async function buildIifePlugins(
  currentEntryStruct: EntryStruct,
  pkgBundleStruct: PkgBundleStruct,
  sourcemap: boolean,
  isDev: boolean,
  jsMin: boolean,
  cssExtract: boolean | string | undefined,
  cssMin: boolean,
  cssAsJs: boolean,
  classNameTransform: boolean,
): Promise<Plugin[]> {
  const { pkgDir, entryStructMap } = pkgBundleStruct
  const { isPublicMui } = analyzePkg(pkgDir)

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
    ...(classNameTransform ? [transformClassNamesPlugin(!isDev, isPublicMui)] : []),
    ...buildJsPlugins(
        pkgBundleStruct,
        isDev,
        cssExtract,
      ),
    ...(sourcemap ? [sourcemapsPlugin()] : []),
    ...((cssMin || cssAsJs) ? [await extractCssSeparatelyPlugin(cssMin, cssAsJs)] : []),
    ...(jsMin ? [minifyJsSeparatelyPlugin()] : []),
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

function buildJsPlugins(
  pkgBundleStruct: PkgBundleStruct,
  isDev: boolean,
  cssExtract: boolean | string | undefined,
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
  cssExtract: boolean | string | undefined,
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
