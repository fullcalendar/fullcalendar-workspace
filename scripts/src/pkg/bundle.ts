import { join as joinPaths, resolve as resolvePath, dirname, isAbsolute } from 'path'
import { fileURLToPath } from 'url'
import { watch as watchPaths } from 'chokidar'
import { globby } from 'globby'
import {
  rollup,
  watch as rollupWatch,
  RollupWatcher,
  OutputOptions as RollupOutputOptions,
  Plugin as RollupPlugin,
} from 'rollup'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import { default as commonjsPlugin } from '@rollup/plugin-commonjs'
import { default as jsonPlugin } from '@rollup/plugin-json'
import { default as postcssPlugin } from 'rollup-plugin-postcss'
import { default as sourcemapsPlugin } from 'rollup-plugin-sourcemaps'
import { default as dtsPlugin } from 'rollup-plugin-dts'
import { EntryConfig, EntryConfigMap, readSrcPkgMeta, SrcPkgMeta } from './meta.js'
import { live } from '../utils/exec.js'

const workspaceScriptsDir = joinPaths(fileURLToPath(import.meta.url), '../../..')

export default async function(...args: string[]) {
  const pkgDir = process.cwd()
  const isDev = args.indexOf('--dev') !== -1
  const isWatch = args.indexOf('--watch') !== -1

  if (isWatch) {
    let rollupWatchers: RollupWatcher[] = []

    const closeRollupWatchers = () => {
      for (let bundler of rollupWatchers) {
        bundler.close()
      }
    }

    const srcJsonPath = joinPaths(pkgDir, 'package.json')
    const srcJsonWatcher = watchPaths(srcJsonPath).on('all', async () => {
      const pkgAnalysis = await analyzePkg(pkgDir)
      const contentMap = await generateContentMap(pkgAnalysis)

      closeRollupWatchers()
      rollupWatchers = [
        continuouslyBundleModules(pkgAnalysis, contentMap, isDev),
        ...continuouslyBundleIifes(pkgAnalysis, contentMap),
      ]
    })

    return new Promise<void>((resolve) => {
      process.once('SIGINT', () => {
        srcJsonWatcher.close()
        closeRollupWatchers()
        resolve()
      })
    })
  } else {
    const pkgAnalysis = await analyzePkg(pkgDir)
    const contentMap = await generateContentMap(pkgAnalysis)

    return Promise.all([
      bundleModules(pkgAnalysis, contentMap, isDev),
      bundleIifes(pkgAnalysis, contentMap),
      bundleTypes(pkgAnalysis),
    ])
  }
}

// Bundling Modules
// -------------------------------------------------------------------------------------------------

async function bundleModules(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
  isDev: boolean,
): Promise<void> {
  return rollup({
    input: buildSrcInputMap(pkgAnalysis),
    plugins: buildModulePlugins(pkgAnalysis, contentMap, isDev),
  }).then((bundle) => {
    return Promise.all([
      bundle.write(buildEsmOutputOptions(pkgAnalysis.pkgDir, isDev)),
      !isDev && bundle.write(buildCjsOutputOptions(pkgAnalysis.pkgDir)),
    ]).then(() => {
      bundle.close()
    })
  })
}

function continuouslyBundleModules(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
  isDev: boolean,
): RollupWatcher {
  return rollupWatch({
    input: buildSrcInputMap(pkgAnalysis),
    plugins: buildModulePlugins(pkgAnalysis, contentMap, isDev),
    output: buildEsmOutputOptions(pkgAnalysis.pkgDir, isDev),
  })
}

function buildModulePlugins(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
  isDev: boolean,
): (RollupPlugin | false)[]  {
  return [
    generatedContentPlugin(contentMap),
    externalizeDepsPlugin(pkgAnalysis),
    tscRerootPlugin(pkgAnalysis.pkgDir),
    isDev && sourcemapsPlugin(), // load preexisting sourcemaps
    ...buildContentProcessingPlugins(),
  ]
}

function buildEsmOutputOptions(pkgDir: string, isDev: boolean): RollupOutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgDir, 'dist'),
    entryFileNames: '[name].mjs',
    sourcemap: isDev,
  }
}

function buildCjsOutputOptions(pkgDir: string): RollupOutputOptions {
  return {
    format: 'cjs',
    exports: 'auto',
    dir: joinPaths(pkgDir, 'dist'),
    entryFileNames: '[name].cjs',
  }
}

// Bundling IIFEs
// -------------------------------------------------------------------------------------------------

function bundleIifes(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
): Promise<void> {
  const { pkgDir, entryConfigMap, relSrcPathMap, importIdToGlobal } = pkgAnalysis
  const srcDir = joinPaths(pkgDir, 'src')
  const promises: Promise<void>[] = []

  for (const entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]
    const entryConfig = entryConfigMap[entryId]
    const { iife } = entryConfig

    if (iife) {
      for (const relSrcPath of relSrcPaths) {
        const outputOptions = buildIifeOutputOptions(
          pkgDir,
          entryConfig,
          relSrcPath,
          importIdToGlobal,
        )

        promises.push(
          rollup({
            input: joinPaths(srcDir, relSrcPath),
            plugins: buildIifePlugins(pkgAnalysis, contentMap),
          }).then((bundle) => {
            return bundle.write(outputOptions)
              .then(() => Promise.all([
                bundle.close(),
                minifyFile(outputOptions.file!),
              ]).then())
          })
        )
      }
    }
  }

  return Promise.all(promises).then()
}

function continuouslyBundleIifes(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
): RollupWatcher[] {
  const { pkgDir, entryConfigMap, relSrcPathMap, importIdToGlobal } = pkgAnalysis
  const srcDir = joinPaths(pkgDir, 'src')
  const watchers: RollupWatcher[] = []

  for (const entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]
    const entryConfig = entryConfigMap[entryId]
    const { iife } = entryConfig

    if (iife) {
      for (const relSrcPath of relSrcPaths) {
        const outputOptions = buildIifeOutputOptions(
          pkgDir,
          entryConfig,
          relSrcPath,
          importIdToGlobal,
        )

        watchers.push(
          rollupWatch({
            input: joinPaths(srcDir, relSrcPath),
            plugins: buildIifePlugins(pkgAnalysis, contentMap),
            output: outputOptions,
          })
        )
      }
    }
  }

  return watchers
}

function buildIifePlugins(
  pkgAnalysis: PkgAnalysis,
  contentMap: { [srcPath: string]: string },
): RollupPlugin[] {
  return [
    generatedContentPlugin(contentMap),
    externalizeDepsPlugin(pkgAnalysis),
    externalizeExportsPlugin(pkgAnalysis),
    tscRerootPlugin(pkgAnalysis.pkgDir),
    ...buildContentProcessingPlugins(),
  ]
}

function buildIifeOutputOptions(
  pkgDir: string,
  entryConfig: EntryConfig,
  relSrcPath: string,
  importIdToGlobal: { [importId: string]: string },
): RollupOutputOptions {
  return {
    format: 'iife',
    file: joinPaths(pkgDir, 'dist', buildOutputId(relSrcPath)) + '.js',
    globals: importIdToGlobal,
    ...(
      typeof entryConfig.iife === 'string'
        ? { name: entryConfig.iife }
        : { exports: 'none' }
    )
  }
}

async function minifyFile(unminifiedPath: string): Promise<void> {
  return live([
    'pnpm', 'exec', 'terser',
    '--config-file', 'terser.json',
    '--output', unminifiedPath.replace(/\.js$/, '.min.js'),
    '--', unminifiedPath,
  ])
}

// Types
// -------------------------------------------------------------------------------------------------

async function bundleTypes(pkgAnalysis: PkgAnalysis): Promise<void> {
  return rollup({
    input: buildTypesInputMap(pkgAnalysis),
    plugins: buildTypesPlugins(pkgAnalysis),
  }).then((bundle) => {
    return bundle.write(buildTypesOutputOptions(pkgAnalysis.pkgDir)).then(() => {
      bundle.close()
    })
  })
}

function buildTypesPlugins(pkgAnalysis: PkgAnalysis): RollupPlugin[] {
  return [
    externalizeAssetsPlugin(),
    externalizeDepsPlugin(pkgAnalysis),
    externalizeExportsPlugin(pkgAnalysis), // because dts-bundler gets confused by code-splitting
    dtsPlugin(),
    nodeResolvePlugin(),
  ]
}

function buildTypesOutputOptions(pkgDir: string): RollupOutputOptions {
  return {
    format: 'esm',
    dir: joinPaths(pkgDir, 'dist'),
    entryFileNames: '[name].d.ts',
  }
}

// Rollup Input
// -------------------------------------------------------------------------------------------------

type RollupInputMap = { [outputId: string]: string }

function buildSrcInputMap(pkgAnalysis: PkgAnalysis): RollupInputMap {
  const { pkgDir, relSrcPathMap } = pkgAnalysis
  const srcDir = joinPaths(pkgDir, 'src')
  const inputs: { [outputId: string]: string } = {}

  for (let entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]

    for (const relSrcPath of relSrcPaths) {
      const outputId = buildOutputId(relSrcPath)
      inputs[outputId] = joinPaths(srcDir, relSrcPath)
    }
  }

  return inputs
}

function buildTypesInputMap(pkgAnalysis: PkgAnalysis): RollupInputMap {
  const { pkgDir, relSrcPathMap } = pkgAnalysis
  const inputs: { [outputId: string]: string } = {}

  for (let entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]

    for (const relSrcPath of relSrcPaths) {
      const outputId = buildOutputId(relSrcPath)
      inputs[outputId] = buildTscPath(pkgDir, relSrcPath, '.d.ts')
    }
  }

  return inputs
}

// Rollup Plugins
// -------------------------------------------------------------------------------------------------

function buildContentProcessingPlugins() {
  return [
    nodeResolvePlugin({ // determines index.js and .js/cjs/mjs
      browser: true, // for xhr-mock (use non-node shims that it wants to)
      preferBuiltins: false // for xhr-mock (use 'url' npm package)
    }),
    commonjsPlugin(), // for moment and moment-timezone
    jsonPlugin(), // for moment-timezone
    postcssPlugin({
      config: {
        path: joinPaths(workspaceScriptsDir, 'postcss.config.cjs'),
        ctx: {}, // arguments given to config file
      }
    }),
  ]
}

function externalizeDepsPlugin(pkgAnalysis: PkgAnalysis): RollupPlugin {
  const deps = pkgAnalysis.pkgMeta.dependencies || {}

  return {
    name: 'externalize-deps',
    resolveId(id) {
      const pkgName = id.match(/^([^\/]*)/)![0]

      if (pkgName in deps) {
        return { id, external: true }
      }
    },
  }
}

function externalizeExportsPlugin(pkgAnalysis: PkgAnalysis): RollupPlugin {
  return {
    name: 'externalize-exports',
    resolveId(id, importer) {
      const importPath = computeImportIdPath(id, importer)

      if (importPath && pkgAnalysis.tscPathToEntryId[importPath]) {
        return {
          // out source files reference eachother via .js, but esm output uses .mjs
          id: id.replace(/\.js$/, '.mjs'),
          external: true,
        }
      }
    }
  }
}

function externalizeAssetsPlugin(): RollupPlugin {
  return {
    name: 'externalize-assets',
    resolveId(id, importer) {
      const importPath = computeImportIdPath(id, importer)

      if (importPath && isPathAsset(importPath)) {
        return { id, external: true }
      }
    }
  }
}

function tscRerootPlugin(pkgDir: string): RollupPlugin {
  const srcDir = joinPaths(pkgDir, 'src')
  const tscDir = joinPaths(pkgDir, 'dist', '.tsc')

  return {
    name: 'tsc-reroot',
    resolveId(id, importer, options) {
      const importPath = computeImportIdPath(id, importer)

      if (importPath) {
        // move entrypoints to tsc dir
        if (options.isEntry) {
          if (isPathWithinDir(importPath, srcDir)) {
            return tscDir + importPath.substring(srcDir.length).replace(/\.tsx?$/, '.js')
          }

        // move asset paths back to src
        } else if (isPathAsset(importPath)) {
          if (isPathWithinDir(importPath, tscDir)) {
            return srcDir + importPath.substring(tscDir.length)
          }
        }
      }
    }
  }
}

function generatedContentPlugin(contentMap: { [srcPath: string]: string }): RollupPlugin {
  return {
    name: 'generated-content',
    async resolveId(id, importer, options) {
      const importPath = computeImportIdPath(id, importer)

      if (importPath) {
        // whitelist entry paths that have generated content
        // (do not allow them to be rerooted into the tsc dir)
        if (options.isEntry && contentMap[importPath]) {
          return id

        // handle relative imports from a generated source file
        // HACK until tscRerootPlugin is more robust
        } else if (
          importer &&
          contentMap[importer] &&
          !isPathAsset(importPath)
        ) {
          return await this.resolve(importPath, undefined, { isEntry: true })
        }
      }
    },
    load(id) {
      if (isAbsolute(id)) {
        return contentMap[id] // if undefined, fallback to normal file load
      }
    }
  }
}

// Generated Content
// -------------------------------------------------------------------------------------------------

async function generateContentMap(
  pkgAnalysis: PkgAnalysis
): Promise<{ [srcPath: string]: string }> {
  const { pkgDir, entryConfigMap } = pkgAnalysis
  const contentMap: { [srcPath: string]: string } = {}

  await Promise.all(
    Object.keys(entryConfigMap).map(async (entryId) => {
      const generatorRelPath = entryConfigMap[entryId].generator

      if (generatorRelPath) {
        const generatorPath = joinPaths(pkgDir, generatorRelPath)
        const generatorExports = await import(generatorPath)
        const generatorFunc = generatorExports.default

        if (typeof generatorFunc !== 'function') {
          throw new Error('Generator must have a default function export')
        }

        const generatorRes = await generatorFunc()

        if (typeof generatorRes === 'string') {
          if (entryId.indexOf('*') !== -1) {
            throw new Error('Generator string output can\'t have blob entrypoint name')
          }

          contentMap[fabricateSrcPath(pkgDir, entryId)] = generatorRes

        } else if (typeof generatorRes === 'object') {
          if (entryId.indexOf('*') === -1) {
            throw new Error('Generator object output must have blob entrypoint name')
          }

          for (const key in generatorRes) {
            const expandedEntryId = entryId.replace('*', key)
            contentMap[fabricateSrcPath(pkgDir, expandedEntryId)] = generatorRes[key]
          }
        } else {
          throw new Error('Invalid type of generator output')
        }
      }
    })
  )

  return contentMap
}

// Package Analysis
// -------------------------------------------------------------------------------------------------

interface PkgAnalysis {
  pkgDir: string
  pkgMeta: SrcPkgMeta
  entryConfigMap: EntryConfigMap
  relSrcPathMap: RelSrcPathMap
  importIdToGlobal: { [importId: string]: string }
  tscPathToEntryId: { [tscPath: string]: string }
}

async function analyzePkg(pkgDir: string): Promise<PkgAnalysis> {
  const pkgMeta = await readSrcPkgMeta(pkgDir)
  const buildConfig = pkgMeta.buildConfig || {}
  const entryConfigMap = buildConfig.exports || {}

  const relSrcPathMap = await queryRelSrcPathMap(pkgDir, entryConfigMap)
  const importIdToGlobal: { [importId: string]: string } = { ...buildConfig.externalGlobals }
  const tscPathToEntryId: { [tscPath: string]: string } = {}

  for (const entryId in entryConfigMap) {
    const entryConfig = entryConfigMap[entryId]
    const relSrcPaths = relSrcPathMap[entryId]

    for (const relSrcPath of relSrcPaths) {
      const tscPath = buildTscPath(pkgDir, relSrcPath, '.js')

      tscPathToEntryId[tscPath] = entryId

      if (typeof entryConfig.iife === 'string') {
        importIdToGlobal[tscPath] = entryConfig.iife
      }
    }
  }

  return {
    pkgDir,
    pkgMeta,
    entryConfigMap,
    relSrcPathMap,
    importIdToGlobal,
    tscPathToEntryId,
  }
}

// App-Specific Path Utils
// -------------------------------------------------------------------------------------------------

type RelSrcPathMap = { [entryId: string]: string[] }

async function queryRelSrcPathMap(
  pkgDir: string,
  entryConfigMap: EntryConfigMap,
): Promise<RelSrcPathMap> {
  const relSrcPathMap: RelSrcPathMap = {}

  await Promise.all(
    Object.keys(entryConfigMap).map(async (entryId) => {
      relSrcPathMap[entryId] = await queryRelSrcPaths(pkgDir, entryId)
    })
  )

  return relSrcPathMap
}

async function queryRelSrcPaths(pkgDir: string, entryId: string): Promise<string[]> {
  const srcDir = joinPaths(pkgDir, 'src')

  return (
    await globby(
      (entryId === '.' ? 'index' : entryId.replace(/^\.\//, '')) + '.{ts,tsx}',
      { cwd: srcDir },
    )
  ).map((entry) => entry.toString())
}

function fabricateSrcPath(pkgDir: string, entryId: string): string {
  return joinPaths(
    pkgDir,
    'src',
    entryId === '.' ? './index.ts' : entryId + '.ts',
  )
}

function buildTscPath(pkgDir: string, relSrcPath: string, ext: string) {
  return joinPaths(pkgDir, 'dist', '.tsc', relSrcPath).replace(/\.tsx?$/, ext)
}

function computeImportIdPath(id: string, importer: string | undefined): string | undefined {
  // an entrypoint
  if (!importer) {
    if (isPathRelative(id)) {
      return resolvePath(id) // relative to CWD
    } else {
      return id
    }
  } else {
    if (isPathRelative(id)) {
      return joinPaths(dirname(importer), id)
    }
    // otherwise, probably a dependency
  }
}

function buildOutputId(relSrcPath: string): string {
  return relSrcPath.replace(/\.[jt]sx?$/, '')
}

function isPathAsset(path: string): boolean {
  const assetExts = ['.css']

  for (let assetExt of assetExts) {
    if (path.endsWith(assetExt)) {
      return true
    }
  }

  return false
}

// General Path Utils
// -------------------------------------------------------------------------------------------------

function isPathWithinDir(path: string, dirPath: string): boolean {
  return path.indexOf(
    joinPaths(dirPath, 'a').replace(/a$/, '')
  ) === 0
}

function isPathRelative(path: string): boolean {
  return /^\.\.?\/?/.test(path)
}
