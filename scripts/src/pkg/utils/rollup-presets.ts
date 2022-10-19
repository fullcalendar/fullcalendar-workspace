import { readFile } from 'fs/promises'
import { join as joinPaths } from 'path'
import { RollupOptions, Plugin, OutputOptions } from 'rollup'
import handlebars from 'handlebars'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import dtsPlugin from 'rollup-plugin-dts'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import commonjsPluginLib from '@rollup/plugin-commonjs'
import jsonPluginLib from '@rollup/plugin-json'
import postcssPluginLib from 'rollup-plugin-postcss'
import { mapObj } from '../../utils/lang.js'
import { MonorepoStruct } from '../../utils/monorepo-struct.js'
import { analyzePkg } from '../../utils/pkg-analysis.js'
import { readPkgJson } from '../../utils/pkg-json.js'
import { monorepoScriptsDir } from '../../utils/script-runner.js'
import {
  computeExternalPkgs,
  computeIifeExternalPkgs,
  computeIifeGlobals,
  computeOwnExternalPaths,
  EntryStruct,
  entryStructsToContentMap,
  generateIifeContent,
  PkgBundleStruct,
  transpiledExtension,
  transpiledSubdir,
} from './bundle-struct.js'
import {
  externalizeExtensionsPlugin,
  externalizePathsPlugin,
  externalizePkgsPlugin,
  generatedContentPlugin,
  minifySeparatelyPlugin,
  rerootPlugin,
} from './rollup-plugins.js'

const assetExtensions = ['.css']

export function buildModuleOptions(
  pkgBundleStruct: PkgBundleStruct,
  esm: boolean,
  cjs: boolean,
  sourcemap: boolean,
): RollupOptions[] {
  if (esm || cjs) {
    return [{
      input: buildModuleInput(pkgBundleStruct),
      plugins: buildModulePlugins(pkgBundleStruct, sourcemap),
      output: [
        ...(esm ? [buildEsmOutputOptions(pkgBundleStruct, sourcemap)] : []),
        ...(cjs ? [buildCjsOutputOptions(pkgBundleStruct, sourcemap)] : []),
      ],
    }]
  }

  return []
}

export function buildDtsOptions(pkgBundleStruct: PkgBundleStruct): RollupOptions {
  return {
    input: buildDtsInput(pkgBundleStruct),
    plugins: buildDtsPlugins(pkgBundleStruct),
    output: buildDtsOutputOptions(pkgBundleStruct),
  }
}

export async function buildIifeOptions(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
  minify: boolean,
): Promise<RollupOptions[]> {
  const { entryStructMap } = pkgBundleStruct
  const banner = await buildBanner(pkgBundleStruct)
  const iifeContentMap = await generateIifeContent(pkgBundleStruct)

  return Object.keys(entryStructMap).map((entryAlias)  => {
    const entryStruct = entryStructMap[entryAlias]

    return {
      input: buildIifeInput(entryStruct),
      plugins: buildIifePlugins(pkgBundleStruct, iifeContentMap, minify),
      output: buildIifeOutputOptions(entryAlias, pkgBundleStruct, monorepoStruct, banner),
    }
  })
}

// Input
// -------------------------------------------------------------------------------------------------

type InputMap = { [entryAlias: string]: string }

function buildModuleInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  return mapObj(pkgBundleStruct.entryStructMap, (entryStruct: EntryStruct) => {
    return entryStruct.entrySrcPath
  })
}

function buildIifeInput(entryStruct: EntryStruct): string {
  return entryStruct.entrySrcBase + '.iife' + transpiledExtension
}

function buildDtsInput(pkgBundleStruct: PkgBundleStruct): InputMap {
  return mapObj(pkgBundleStruct.entryStructMap, (entryStruct: EntryStruct) => {
    return entryStruct.entrySrcBase + '.d.ts'
  })
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
    entryFileNames: '[name].mjs',
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
    entryFileNames: '[name].cjs',
    sourcemap,
  }
}

function buildIifeOutputOptions(
  entryAlias: string,
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
  banner: string,
): OutputOptions {
  const { pkgDir, iifeGlobalsMap } = pkgBundleStruct
  const globalName = iifeGlobalsMap['.']

  return {
    format: 'iife',
    banner,
    file: joinPaths(pkgDir, 'dist', entryAlias) + '.js',
    globals: computeIifeGlobals(pkgBundleStruct, monorepoStruct),
    ...(
      globalName
        ? { name: globalName }
        : { exports: 'none' }
    ),
  }
}

function buildDtsOutputOptions(pkgBundleStruct: PkgBundleStruct): OutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgBundleStruct.pkgDir, 'dist'),
    entryFileNames: '[name].d.ts',
  }
}

// Plugins Lists
// -------------------------------------------------------------------------------------------------

function buildModulePlugins(pkgBundleStruct: PkgBundleStruct, sourcemap: boolean): Plugin[] {
  const { pkgDir, entryStructMap } = pkgBundleStruct

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin(computeExternalPkgs(pkgBundleStruct)),
    generatedContentPlugin(entryStructsToContentMap(entryStructMap)),
    ...buildJsPlugins(pkgBundleStruct),
    ...(sourcemap ? [sourcemapsPlugin()] : []), // load preexisting sourcemaps
  ]
}

function buildIifePlugins(
  pkgBundleStruct: PkgBundleStruct,
  iifeContentMap: { [path: string]: string },
  minify: boolean,
): Plugin[] {
  const { pkgDir, entryStructMap } = pkgBundleStruct

  return [
    rerootAssetsPlugin(pkgDir),
    externalizePkgsPlugin(computeIifeExternalPkgs(pkgBundleStruct)),
    generatedContentPlugin({
      ...entryStructsToContentMap(entryStructMap),
      ...iifeContentMap,
    }),
    ...buildJsPlugins(pkgBundleStruct),
    ...(minify ? [minifySeparatelyPlugin()] : []),
  ]
}

function buildDtsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  return [
    externalizeAssetsPlugin(),
    externalizePkgsPlugin(
      computeExternalPkgs(pkgBundleStruct),
    ),
    externalizePathsPlugin({
      paths: computeOwnExternalPaths(pkgBundleStruct),
      extensions: { '.js': '.mjs' }, // tsout references .js, but we need .mjs for dist
    }),
    dtsPlugin(),
    nodeResolvePlugin(),
  ]
}

function buildJsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  const pkgAnalysis = analyzePkg(pkgBundleStruct.pkgDir)

  if (pkgAnalysis.isTests) {
    return buildTestsJsPlugins(pkgBundleStruct)
  } else {
    return buildNormalJsPlugins(pkgBundleStruct)
  }
}

function buildNormalJsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  const { pkgDir, pkgJson } = pkgBundleStruct

  return [
    nodeResolvePlugin(),
    cssPlugin({
      injector: {
        importId: pkgJson.name === '@fullcalendar/core' ?
          joinPaths(pkgDir, transpiledSubdir, 'styleUtils', transpiledExtension) :
          '@fullcalendar/core',
        importProp: 'injectStyles',
      },
    }),
  ]
}

function buildTestsJsPlugins(pkgBundleStruct: PkgBundleStruct): Plugin[] {
  return [
    nodeResolvePlugin({ // determines index.js and .js/cjs/mjs
      browser: true, // for xhr-mock (use non-node shims that it wants to)
      preferBuiltins: false, // for xhr-mock (use 'url' npm package)
    }),
    commonjsPluginLib.default(), // for moment and moment-timezone
    jsonPluginLib.default(), // for moment-timezone
    cssPlugin(),
  ]
}

// Plugins Wrappers
// -------------------------------------------------------------------------------------------------

interface CssInjector {
  importId: string
  importProp: string
}

function cssPlugin(options?: { injector?: CssInjector }): Plugin {
  const injector = options?.injector

  return postcssPluginLib.default({
    config: {
      path: joinPaths(monorepoScriptsDir, 'config/postcss.config.cjs'),
      ctx: {}, // arguments given to config file
    },
    inject: !injector ? false : (cssVarName: string) => {
      return `import { ${injector.importProp} } from ${JSON.stringify(injector.importId)};\n` +
        `injectStyles(${cssVarName});\n`
    },
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
  const templatePath = joinPaths(monorepoScriptsDir, 'config/banner.tpl')
  const templateText = await readFile(templatePath, 'utf8')
  const template = handlebars.compile(templateText)

  return template(fullPkgJson)
}
