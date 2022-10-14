import { join as joinPaths, resolve as resolvePath, dirname, isAbsolute, basename } from 'path'
import { watch as watchPaths } from 'chokidar'
import { globby } from 'globby'
import handlebars from 'handlebars'
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
import { workspaceScriptsDir } from '../monorepo/lib.js'
import { EntryConfig, EntryConfigMap, generateDistPkgMeta, getSubrepoInfo, IifeExternalsMap, readSrcPkgMeta, SrcPkgMeta } from './meta.js'
import { live } from '../utils/exec.js'
import { readFile } from 'fs/promises'

// TODO: continuous rollup building can do multiple output options

// TODO: entry iifes should NOT rely on non-iife source files being present

// https://rollupjs.org/guide/en/#thissetassetsource

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

      closeRollupWatchers()
      rollupWatchers = [
        continuouslyBundleModules(pkgAnalysis, isDev),
        ...(await continuouslyBundleIifes(pkgAnalysis)),
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

    return Promise.all([
      bundleModules(pkgAnalysis, isDev),
      bundleIifes(pkgAnalysis),
      bundleTypes(pkgAnalysis),
    ])
  }
}

// Bundling Modules
// -------------------------------------------------------------------------------------------------

async function bundleModules(pkgAnalysis: PkgAnalysis, isDev: boolean): Promise<void> {
  const buildConfig = pkgAnalysis.pkgMeta.buildConfig || {}
  const esmEnabled = buildConfig.esm ?? true
  const cjsEnabled = buildConfig.cjs ?? true

  if (!esmEnabled && !cjsEnabled) {
    return Promise.resolve()
  }

  return rollup({
    input: buildInputMap(pkgAnalysis, '.js'),
    plugins: buildModulePlugins(pkgAnalysis, isDev),
  }).then((bundle) => {
    return Promise.all([
      (esmEnabled) && bundle.write(buildEsmOutputOptions(pkgAnalysis.pkgDir, isDev)),
      (!isDev && cjsEnabled) && bundle.write(buildCjsOutputOptions(pkgAnalysis.pkgDir)),
    ]).then(() => {
      bundle.close()
    })
  })
}

function continuouslyBundleModules(pkgAnalysis: PkgAnalysis, isDev: boolean): RollupWatcher {
  return rollupWatch({
    input: buildInputMap(pkgAnalysis, '.js'),
    plugins: buildModulePlugins(pkgAnalysis, isDev),
    output: buildEsmOutputOptions(pkgAnalysis.pkgDir, isDev),
  })
}

function buildModulePlugins(pkgAnalysis: PkgAnalysis, isDev: boolean): (RollupPlugin | false)[]  {
  return [
    generatedContentPlugin(pkgAnalysis),
    externalizeDepsPlugin(pkgAnalysis),
    rerootAssetsPlugin(pkgAnalysis.pkgDir),
    isDev && sourcemapsPlugin(), // load preexisting sourcemaps
    ...buildContentProcessingPlugins(pkgAnalysis),
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
    exports: 'named',
    dir: joinPaths(pkgDir, 'dist'),
    entryFileNames: '[name].cjs',
  }
}

// Bundling IIFEs
// -------------------------------------------------------------------------------------------------

async function bundleIifes(pkgAnalysis: PkgAnalysis): Promise<void> {
  const { pkgDir, pkgMeta, entryConfigMap, relSrcPathMap } = pkgAnalysis
  const promises: Promise<void>[] = []
  const enableMin = pkgMeta.buildConfig?.min ?? true

  for (const entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]
    const entryConfig = entryConfigMap[entryId]
    const iifeConfig = entryConfig.iife

    if (iifeConfig) {
      for (const relSrcPath of relSrcPaths) {
        const outputOptions = await buildIifeOutputOptions(pkgAnalysis, entryConfig, relSrcPath)

        promises.push(
          rollup({
            input: buildTscPath(pkgDir, relSrcPath, '.iife.js'),
            plugins: buildIifePlugins(pkgAnalysis, entryId, entryConfig),
          }).then((bundle) => {
            return bundle.write(outputOptions)
              .then(() => Promise.all([
                bundle.close(),
                enableMin && minifyFile(outputOptions.file!),
              ]).then())
          }),
        )
      }
    }
  }

  await Promise.all(promises)
}

async function continuouslyBundleIifes(pkgAnalysis: PkgAnalysis): Promise<RollupWatcher[]> {
  const { pkgDir, entryConfigMap, relSrcPathMap } = pkgAnalysis
  const watchers: RollupWatcher[] = []

  for (const entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]
    const entryConfig = entryConfigMap[entryId]

    if (entryConfig.iife) {
      for (const relSrcPath of relSrcPaths) {
        const outputOptions = await buildIifeOutputOptions(pkgAnalysis, entryConfig, relSrcPath)

        watchers.push(
          rollupWatch({
            input: buildTscPath(pkgDir, relSrcPath, '.iife.js'),
            plugins: buildIifePlugins(pkgAnalysis, entryId, entryConfig),
            output: outputOptions,
          }),
        )
      }
    }
  }

  return watchers
}

function buildIifePlugins(
  pkgAnalysis: PkgAnalysis,
  entryId: string,
  entryConfig: EntryConfig,
): RollupPlugin[] {
  const iifeExternals = entryConfig.iifeExternals
    ?? pkgAnalysis.pkgMeta.buildConfig?.iifeExternals
    ?? true

  return [
    generatedContentPlugin(pkgAnalysis),
    (iifeExternals) && externalizeDepsPlugin(pkgAnalysis),
    (typeof iifeExternals === 'object') && externalizeGlobals(iifeExternals),
    externalizeOwnGlobalsPlugin(pkgAnalysis, entryId),
    rerootAssetsPlugin(pkgAnalysis.pkgDir),
    ...buildContentProcessingPlugins(pkgAnalysis),
  ]
}

async function buildIifeOutputOptions(
  pkgAnalysis: PkgAnalysis,
  entryConfig: EntryConfig,
  relSrcPath: string,
): Promise<RollupOutputOptions> {
  const { pkgDir, pkgMeta, distMeta } = pkgAnalysis
  const iifeName = entryConfig.iife
  const iifeExternals = pkgMeta.buildConfig?.iifeExternals
  const iifeGlobals: { [importId: string]: string } = {}

  if (typeof iifeExternals === 'object') {
    for (const importId in iifeExternals) {
      const iifeVal = iifeExternals[importId]

      if (typeof iifeVal === 'string') {
        iifeGlobals[importId] = iifeVal
      }
    }
  }

  return {
    format: 'iife',
    file: joinPaths(pkgDir, 'dist', buildOutputId(relSrcPath)) + '.js',
    globals: { ...iifeGlobals, ...buildGlobalsForOwnExports(pkgAnalysis) },
    banner: await buildBanner(distMeta),
    ...(
      typeof iifeName === 'string'
        ? { name: iifeName }
        : { exports: 'none' }
    ),
  }
}

async function minifyFile(unminifiedIifePath: string): Promise<void> {
  return live([
    'pnpm', 'exec', 'terser',
    '--config-file', 'config/terser.json',
    '--output', unminifiedIifePath.replace(/\.js$/, '.min.js'),
    '--', unminifiedIifePath,
  ], {
    cwd: workspaceScriptsDir,
  })
}

async function buildBanner(distMeta: any): Promise<string> {
  const templatePath = joinPaths(workspaceScriptsDir, 'config/banner.tpl')
  const templateText = await readFile(templatePath, 'utf8')
  const template = handlebars.compile(templateText)
  return template(distMeta)
}

// Types
// -------------------------------------------------------------------------------------------------

async function bundleTypes(pkgAnalysis: PkgAnalysis): Promise<void> {
  const typesEnabled = pkgAnalysis.pkgMeta.buildConfig?.types ?? true

  if (!typesEnabled) {
    return Promise.resolve()
  }

  return rollup({
    input: buildInputMap(pkgAnalysis, '.d.ts'),
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
    externalizeOwnExportsPlugin(pkgAnalysis), // because dts-bundler gets confused by code-splitting
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

function buildInputMap(pkgAnalysis: PkgAnalysis, ext: string): RollupInputMap {
  const { pkgDir, relSrcPathMap } = pkgAnalysis
  const inputs: { [outputId: string]: string } = {}

  for (let entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]

    for (const relSrcPath of relSrcPaths) {
      const outputId = buildOutputId(relSrcPath)
      inputs[outputId] = buildTscPath(pkgDir, relSrcPath, ext)
    }
  }

  return inputs
}

// Rollup Plugins
// -------------------------------------------------------------------------------------------------

function buildContentProcessingPlugins(pkgAnalysis: PkgAnalysis) {
  return [
    nodeResolvePlugin({ // determines index.js and .js/cjs/mjs
      browser: true, // for xhr-mock (use non-node shims that it wants to)
      preferBuiltins: false, // for xhr-mock (use 'url' npm package)
    }),
    commonjsPlugin(), // for moment and moment-timezone
    jsonPlugin(), // for moment-timezone
    postcssPlugin({
      config: {
        path: joinPaths(workspaceScriptsDir, 'config/postcss.config.cjs'),
        ctx: {}, // arguments given to config file
      },
      inject: basename(pkgAnalysis.pkgDir) === 'tests' ?
        true :
        function (cssVarName: string) {
          const importPath = pkgAnalysis.pkgMeta.name === '@fullcalendar/core'
            ? joinPaths(pkgAnalysis.pkgDir, 'dist/.tsout/styleUtils.js') // TODO: use util
            : '@fullcalendar/core'

          return `import { injectStyles } from ${JSON.stringify(importPath)};\n` +
            `injectStyles(${cssVarName});\n`
        },
    }),
  ]
}

function externalizeDepsPlugin(pkgAnalysis: PkgAnalysis): RollupPlugin {
  const { pkgMeta } = pkgAnalysis
  const deps = {
    ...pkgMeta.dependencies,
    ...pkgMeta.peerDependencies,
    // will NOT externalize devDependencies
  }

  return {
    name: 'externalize-deps',
    resolveId(id) {
      const pkgName = extractPkgName(id)

      if (pkgName && (pkgName in deps)) {
        return { id, external: true }
      }
    },
  }
}

function externalizeGlobals(iifeGlobals: IifeExternalsMap): RollupPlugin {
  return {
    name: 'externalize-globals',
    resolveId(id) {
      if (iifeGlobals[id]) {
        return { id, external: true }
      }
    },
  }
}

function externalizeOwnExportsPlugin(pkgAnalysis: PkgAnalysis): RollupPlugin {
  const { pkgDir, relSrcPathMap } = pkgAnalysis
  const tscPathMap: { [tscPath: string]: boolean } = {}

  for (let entryId in relSrcPathMap) {
    const relSrcPaths = relSrcPathMap[entryId]

    for (const relSrcPath of relSrcPaths) {
      tscPathMap[buildTscPath(pkgDir, relSrcPath, '.js')] = true
    }
  }

  return {
    name: 'externalize-own-exports',
    resolveId(id, importer) {
      const importPath = computeImportPath(id, importer)

      if (importPath && tscPathMap[importPath]) {
        return {
          // out source files reference eachother via .js, but esm output uses .mjs
          id: id.replace(/\.js$/, '.mjs'),
          external: true,
        }
      }
    },
  }
}

function externalizeOwnGlobalsPlugin(
  pkgAnalysis: PkgAnalysis,
  currentEntryId: string,
): RollupPlugin {
  const { pkgDir, pkgMeta, relSrcPathMap } = pkgAnalysis
  const entryConfigMap = pkgMeta.buildConfig?.exports || {}
  const tscPathMap: { [tscPath: string]: boolean } = {}

  for (let entryId in entryConfigMap) {
    if (entryId !== currentEntryId) { // don't externalize itself
      const entryConfig = entryConfigMap[entryId]
      const relSrcPaths = relSrcPathMap[entryId]

      if (typeof entryConfig.iife === 'string') {
        for (const relSrcPath of relSrcPaths) {
          tscPathMap[buildTscPath(pkgDir, relSrcPath, '.js')] = true
        }
      }
    }
  }

  return {
    name: 'externalize-own-globals',
    resolveId(id, importer) {
      const importPath = computeImportPath(id, importer)

      if (importPath && tscPathMap[importPath]) {
        return { id: importPath, external: true }
      }
    },
  }
}

/*
supports usage of externalizeOwnGlobalsPlugin
*/
function buildGlobalsForOwnExports(pkgAnalysis: PkgAnalysis) {
  const { pkgDir, pkgMeta, relSrcPathMap } = pkgAnalysis
  const entryConfigMap = pkgMeta.buildConfig?.exports || {}
  const globalsMap: { [absPath: string]: string } = {}

  for (let entryId in entryConfigMap) {
    const entryConfig = entryConfigMap[entryId]
    const relSrcPaths = relSrcPathMap[entryId]
    const iifeName = entryConfig.iife

    if (typeof iifeName === 'string') {
      for (const relSrcPath of relSrcPaths) {
        globalsMap[buildTscPath(pkgDir, relSrcPath, '.js')] = iifeName
      }
    }
  }

  return globalsMap
}

function externalizeAssetsPlugin(): RollupPlugin {
  return {
    name: 'externalize-assets',
    resolveId(id, importer) {
      const importPath = computeImportPath(id, importer)

      if (importPath && isPathAsset(importPath)) {
        return { id, external: true }
      }
    },
  }
}

function rerootAssetsPlugin(pkgDir: string): RollupPlugin {
  const srcDir = joinPaths(pkgDir, 'src')
  const tscDir = joinPaths(pkgDir, 'dist', '.tsout')

  return {
    name: 'reroot-assets',
    resolveId(id, importer) {
      const importPath = computeImportPath(id, importer)

      if (importPath && isPathAsset(importPath)) {
        if (isPathWithinDir(importPath, tscDir)) {
          return srcDir + importPath.substring(tscDir.length)
        }
      }
    },
  }
}

function generatedContentPlugin(pkgAnalysis: PkgAnalysis): RollupPlugin {
  const { pkgDir, entryContentMap, iifeEntryContentMap } = pkgAnalysis
  const pathContentMap: { [path: string]: string } = {}

  for (let entryId in entryContentMap) {
    const fakePath = (entryId === '.' ? 'index' : entryId) + '.ts' // TODO: use path util
    pathContentMap[buildTscPath(pkgDir, fakePath, '.js')] = entryContentMap[entryId]
  }

  for (let entryId in iifeEntryContentMap) {
    const fakePath = (entryId === '.' ? 'index' : entryId) + '.ts' // TODO: use path util
    pathContentMap[buildTscPath(pkgDir, fakePath, '.iife.js')] = iifeEntryContentMap[entryId]
  }

  return {
    name: 'generated-content',
    async resolveId(id, importer) {
      const importPath = computeImportPath(id, importer)

      if (importPath && pathContentMap[importPath]) {
        return importPath
      }
    },
    load(id) {
      return pathContentMap[id] // if undefined, fallback to normal file load
    },
  }
}

// Package Analysis
// -------------------------------------------------------------------------------------------------

interface PkgAnalysis {
  pkgDir: string
  pkgMeta: SrcPkgMeta
  entryConfigMap: EntryConfigMap
  relSrcPathMap: RelSrcPathMap
  entryContentMap: EntryContentMap // entryIds are expanded
  iifeEntryContentMap: EntryContentMap // entryIds are expanded
  distMeta: any // hack
}

async function analyzePkg(pkgDir: string): Promise<PkgAnalysis> {
  const pkgMeta = await readSrcPkgMeta(pkgDir)
  const buildConfig = pkgMeta.buildConfig || {}
  const entryConfigMap = buildConfig.exports || {}
  const relSrcPathMap: RelSrcPathMap = {}
  const entryContentMap: EntryContentMap = {}
  const iifeEntryContentMap: EntryContentMap = {}

  // HACK
  const subrepoInfo = await getSubrepoInfo(pkgDir)
  const distMeta = (
    // TODO: more DRY
    pkgMeta.buildConfig &&
    pkgMeta.publishConfig?.linkDirectory
  )
    ? generateDistPkgMeta(subrepoInfo, pkgMeta, true) // isDev
    : pkgMeta // don't process

  await Promise.all(
    Object.keys(entryConfigMap).map(async (entryId) => {
      const entryConfig = entryConfigMap[entryId]
      let relSrcPaths: string[]

      if (entryConfig.generator) {
        const generatorPath = joinPaths(pkgDir, entryConfig.generator)
        const contentMap = await generateEntryContent(entryId, generatorPath)

        Object.assign(entryContentMap, contentMap)

        relSrcPaths = Object.keys(contentMap).map((entryId) => {
          // TODO: use path util
          return (entryId === '.' ? 'index' : entryId) + '.ts'
        })
      } else {
        relSrcPaths = await queryRelSrcPaths(pkgDir, entryId)
      }

      relSrcPathMap[entryId] = relSrcPaths

      const { iifeGenerator } = entryConfig
      if (iifeGenerator) {
        for (const relSrcPath of relSrcPaths) {
          const expandedEntryId = relSrcPath.replace(/\.tsx?/, '') // TODO: util
          const generatorPath = joinPaths(pkgDir, iifeGenerator)
          const contentMap = await generateEntryContent(expandedEntryId, generatorPath)
          for (let entryId in contentMap) {
            iifeEntryContentMap[entryId] = contentMap[entryId]
          }
        }
      }
    }),
  )

  return {
    pkgDir,
    pkgMeta,
    entryConfigMap,
    relSrcPathMap,
    entryContentMap,
    iifeEntryContentMap,
    distMeta,
  }
}

// Generated Content
// -------------------------------------------------------------------------------------------------

type EntryContentMap = { [expandedEntryId: string]: string }

async function generateEntryContent(
  entryId: string,
  generatorPath: string,
): Promise<EntryContentMap> {
  const generatorExports = await import(generatorPath)
  const generatorFunc = generatorExports.default
  const entryContentMap: EntryContentMap = {}

  if (typeof generatorFunc !== 'function') {
    throw new Error('Generator must have a default function export')
  }

  const generatorRes = await generatorFunc(entryId)

  if (typeof generatorRes === 'string') {
    if (entryId.indexOf('*') !== -1) {
      throw new Error('Generator string output can\'t have blob entrypoint name')
    }

    entryContentMap[entryId] = generatorRes

  } else if (typeof generatorRes === 'object') {
    if (entryId.indexOf('*') === -1) {
      throw new Error('Generator object output must have blob entrypoint name')
    }

    for (const key in generatorRes) {
      const expandedEntryId = entryId.replace('*', key)
      entryContentMap[expandedEntryId] = generatorRes[key]
    }
  } else {
    throw new Error('Invalid type of generator output')
  }

  return entryContentMap
}

// App-Specific Path Utils
// -------------------------------------------------------------------------------------------------

type RelSrcPathMap = { [entryId: string]: string[] }

async function queryRelSrcPaths(pkgDir: string, entryId: string): Promise<string[]> {
  const srcDir = joinPaths(pkgDir, 'src')

  return (
    await globby(
      (entryId === '.' ? 'index' : entryId.replace(/^\.\//, '')) + '.{ts,tsx}',
      { cwd: srcDir },
    )
  ).map((entry) => entry.toString())
}

function buildTscPath(pkgDir: string, relSrcPath: string, ext: string) {
  return joinPaths(pkgDir, 'dist', '.tsout', relSrcPath).replace(/\.tsx?$/, '') + ext
}

// TODO: use <context>.getFileName(referenceId) ?
// https://rollupjs.org/guide/en/#thisgetfilename
function computeImportPath(id: string, importer: string | undefined): string | undefined {
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
  return relSrcPath
    .replace(/^\.\//, '') // TODO: use util
    .replace(/\.[jt]sx?$/, '')
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
    joinPaths(dirPath, 'a').replace(/a$/, ''),
  ) === 0
}

function isPathRelative(path: string): boolean {
  return /^\.\.?\/?/.test(path)
}

function extractPkgName(importId: string): string | undefined {
  const m = importId.match(/^(@[a-z-.]+\/)?[a-z-.]+/)

  if (m) {
    return m[0]
  }
}
