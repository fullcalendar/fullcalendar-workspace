import { join as joinPaths, resolve as resolvePath, isAbsolute, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import {
  rollup,
  watch as rollupWatch,
  Plugin as RollupPlugin,
  OutputOptions as RollupOutputOptions,
  RollupWatcher,
} from 'rollup'
import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve'
import dtsPlugin from 'rollup-plugin-dts'
import postcssPlugin from 'rollup-plugin-postcss'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import { watch as watchPaths } from 'chokidar'
import { live } from '../utils/exec'

const srcGlobsProp = 'fileExports'
const srcGeneratorsProp = 'generatedExports'
const iifeProp = 'iife'
const cjsExt = '.cjs'
const esmExt = '.mjs'
const iifeExt = '.js'
const iifeMinExt = '.min.js'
const dtsExt = '.d.ts'
const pkgJsonPath = resolvePath('./package.json')
const srcDirAbs = resolvePath('./src')
const tscDirAbs = resolvePath('./dist/.tsc')
const scriptsDirAbs = joinPaths(fileURLToPath(import.meta.url), '../../..')

/*
Must be run from package root.
The `pnpm run` system does this automatically.
*/
export default async function(...args: string[]) {
  return args.indexOf('--dev') !== -1
    ? runDev()
    : runProd()
}

async function runDev() {
  await mkdir('./dist', { recursive: true })

  let rollupWatcher: RollupWatcher | undefined

  const pkgJsonWatcher = watchPaths(pkgJsonPath).on('all', async () => {
    if (rollupWatcher) {
      rollupWatcher.close()
    }

    const { srcPaths, srcStrs, distMeta } = await processSrcMeta(true)

    rollupWatcher = rollupWatch({
      input: buildRollupInput(srcPaths),
      plugins: buildRollupPlugins(srcStrs, true), // externalize=true
      output: buildEsmOutputOptions(true), // dev=true
    })

    await writeDistMeta(distMeta)
  })

  const watcherPromise = new Promise<void>((resolve) => {
    process.once('SIGINT', () => {
      pkgJsonWatcher.close()
      Promise.resolve(rollupWatcher && rollupWatcher.close()).then(() => resolve())
    })
  })

  return Promise.all([
    watcherPromise,
    writeNpmIgnore(),
  ])
}

async function runProd() {
  await mkdir('./dist', { recursive: true })

  const { srcPaths, srcStrs, srcMeta, distMeta } = await processSrcMeta(false) // dev=false

  const bundlePromise = rollup({
    input: buildRollupInput(srcPaths),
    plugins: buildRollupPlugins(srcStrs, true), // externalize=true
  }).then((bundle) => {
    return Promise.all([
      bundle.write(buildEsmOutputOptions(false)), // dev=false
      bundle.write(buildCjsOutputOptions())
    ]).then(() => {
      bundle.close()
    })
  })

  const iifeGlobals = srcMeta[iifeProp] || {}
  const iifeBundlePromises = Object.keys(iifeGlobals).map((entryName) => {
    const iifeGlobal = iifeGlobals[entryName]
    const srcPath = srcPaths[entryName]

    return rollup({
      input: srcPath,
      plugins: buildRollupPlugins(srcStrs, false),  // externalize=true
    }).then((bundle) => {
      const options = buildIifeOutputOptions(srcPath, iifeGlobal)

      return bundle.write(options).then(() => Promise.all([
        bundle.close(),
        minifyFile(options.file!),
      ]))
    })
  })

  const dtsBundlePromise = rollup({
    input: buildRollupDtsInput(srcPaths),
    plugins: buildRollupDtsPlugins(),
  }).then((bundle) => {
    return bundle.write(buildDtsOutputOptions()).then(() => {
      return bundle.close()
    })
  })

  return Promise.all([
    bundlePromise,
    ...iifeBundlePromises,
    dtsBundlePromise,
    writeDistMeta(distMeta),
    writeNpmIgnore(),
  ])
}

// Rollup input
// -------------------------------------------------------------------------------------------------

function buildRollupInput(
  srcPaths: { [entryName: string]: string },
): { [distShortPath: string]: string } {
  const rollupInput: { [distShortPath: string]: string } = {}

  for (const entryName in srcPaths) {
    const srcPath = srcPaths[entryName]
    const distShortPath = buildDistShortPath(srcPath)

    rollupInput[distShortPath] = srcPath
  }

  return rollupInput
}

function buildRollupDtsInput(
  srcPaths: { [entryName: string]: string },
): { [entryName: string]: string } {
  const rollupInput: { [distShortPath: string]: string } = {}

  for (const entryName in srcPaths) {
    const srcPath = srcPaths[entryName]
    const distShortPath = buildDistShortPath(srcPath)

    rollupInput[distShortPath] = `./dist/.tsc/${distShortPath}.d.ts`
  }

  return rollupInput
}

// Rollup outpus
// -------------------------------------------------------------------------------------------------

function buildEsmOutputOptions(dev: boolean): RollupOutputOptions {
  return {
    format: 'esm',
    dir: './dist',
    entryFileNames: '[name]' + esmExt,
    sourcemap: dev,
  }
}

function buildCjsOutputOptions(): RollupOutputOptions {
  return {
    format: 'cjs',
    exports: 'auto',
    dir: './dist',
    entryFileNames: '[name]' + cjsExt,
  }
}

// for single output file, because code-splitting is disallowed
function buildIifeOutputOptions(
  srcPath: string,
  iifeGlobal: string,
): RollupOutputOptions {
  const options: RollupOutputOptions = {
    format: 'iife',
    file: './dist/' + buildDistShortPath(srcPath) + iifeExt,
  }

  if (iifeGlobal) {
    options.name = iifeGlobal
  } else {
    options.exports = 'none'
  }

  return options
}

function buildDtsOutputOptions(): RollupOutputOptions {
  return {
    format: 'esm',
    dir: './dist',
    entryFileNames: '[name]' + dtsExt,
  }
}

// Rollup plugins
// -------------------------------------------------------------------------------------------------

function buildRollupPlugins(
  srcStrs: { [fakeSrcPath: string]: string },
  externalize: boolean,
): (RollupPlugin | false)[] {
  return [
    srcStrsPlugin(srcStrs),
    externalize && externalizeOtherPkgsPlugin(),
    externalize && externalizeDotImportsPlugin(),
    tscRerootPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
    sourcemapsPlugin(), // load preexisting sourcemaps
    postcssPlugin({
      config: {
        path: joinPaths(scriptsDirAbs, 'postcss.config.cjs'),
        ctx: {}, // arguments given to config file
      }
    }),
    // TODO: resolve tsconfig.json paths
  ]
}

function buildRollupDtsPlugins(): RollupPlugin[] {
  return [
    externalizeOtherPkgsPlugin(),
    externalizeDotImportsPlugin(),
    externalizeAssetsPlugin(),
    dtsPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
  ]
}

function srcStrsPlugin(srcStrs: { [fakeSrcPath: string]: string }): RollupPlugin {
  return {
    name: 'source-strings',
    async resolveId(id, importer, options) {
      if (options.isEntry && srcStrs[id]) {
        return id // no further resolving
      } else if (importer && srcStrs[importer] && isRelative(id)) {
        // handle relative imports from a generated source file
        // HACK until tscRerootPlugin is more robust
        return await this.resolve(
          resolvePath(dirname(importer), id) + '.ts',
          undefined,
          { isEntry: true }
        )
      }
    },
    load(id: string) {
      return srcStrs[id] // if undefined, fallback to normal file load
    },
  }
}

function externalizeOtherPkgsPlugin(): RollupPlugin {
  return {
    name: 'externalize-other-pkgs',
    resolveId(id, importer, options) {
      if (!options.isEntry && !isRelative(id) && !isAbsolute(id)) {
        return { id, external: true }
      }
    },
  }
}

function externalizeDotImportsPlugin(): RollupPlugin {[]
  return {
    name: 'externalize-dot-imports',
    resolveId(id) {
      if (isRelativeDot(id)) {
        // when accessing the package root via '.' or '..', always externalize
        return { id, external: true }
      }
    }
  }
}

function externalizeAssetsPlugin(): RollupPlugin {
  return {
    name: 'externalize-assets',
    resolveId(id, importer) {
      if (importer && isRelative(id) && getExtension(id)) {
        return { id, external: true }
      }
    },
  }
}

function tscRerootPlugin(): RollupPlugin {
  return {
    name: 'tsc-reroot',
    resolveId(id, importer, options) {
      if (options.isEntry) {
        // move entrypoints within tsc dirs
        const absPath = resolvePath(id)

        if (isWithinDir(absPath, srcDirAbs)) {
          return tscDirAbs + forceExtension(absPath.substring(srcDirAbs.length), '.js')
        }
      } else if (importer && isRelative(id)) {
        // move asset (paths with extensions) back to src
        const ext = getExtension(id)

        if (ext) {
          const absPath = joinPaths(dirname(importer), id)

          if (isWithinDir(absPath, tscDirAbs)) {
            return srcDirAbs + absPath.substring(tscDirAbs.length)
          }
        }
      }
    }
  }
}

// Dynamic code generation
// -------------------------------------------------------------------------------------------------

async function buildSrcStrs(
  srcGenerators: { [entryName: string]: string },
): Promise<{
  fakeSrcPaths: { [entryName: string]: string }
  srcStrs: { [fakeSrcPath: string]: string }
}> {
  const fakeSrcPaths: { [entryName: string]: string } = {}
  const srcStrs: { [fakeSrcPath: string]: string } = {}

  for (const entryName in srcGenerators) {
    const generatorFile = srcGenerators[entryName]
    const generatorExports = await import(resolvePath(generatorFile))
    const generatorFunc = generatorExports.default

    if (typeof generatorFunc !== 'function') {
      throw new Error('Generator must have a default function export')
    }

    const generatorRes = await generatorFunc(entryName)

    if (typeof generatorRes === 'string') {
      if (entryName.indexOf('*') !== -1) {
        throw new Error('Generator string output can\'t have blob entrypoint name')
      }

      const fakeSrcPath = buildFakeSrcPath(entryName)

      fakeSrcPaths[entryName] = fakeSrcPath
      srcStrs[fakeSrcPath] = generatorRes
    } else if (typeof generatorRes === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorRes) {
        const expandedEntryName = entryName.replace('*', key)
        const fakeSrcPath = buildFakeSrcPath(expandedEntryName)

        fakeSrcPaths[expandedEntryName] = fakeSrcPath
        srcStrs[fakeSrcPath] = generatorRes[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { fakeSrcPaths, srcStrs }
}

function buildFakeSrcPath(entryName: string): string {
  return './src/' + removeRelPrefix(entryName) + '.js'
}

// package.json
// -------------------------------------------------------------------------------------------------

async function processSrcMeta(dev: boolean) {
  const srcJson = await readFile(pkgJsonPath, 'utf8')
  const srcMeta = JSON.parse(srcJson)
  const srcGlobs = srcMeta[srcGlobsProp] || {}
  const srcGenerators = srcMeta[srcGeneratorsProp] || {}
  const { fakeSrcPaths, srcStrs } = await buildSrcStrs(srcGenerators)
  const srcPaths = { ...(await expandSrcGlobs(srcGlobs)), ...fakeSrcPaths }
  const exportPaths = buildExportPaths(srcGlobs, srcGenerators)
  const distMeta = buildPkgMeta(srcMeta, exportPaths, dev)

  return { srcPaths, srcStrs, srcMeta, distMeta }
}

async function writeDistMeta(distPkgJson: any) {
  const pkgJson = JSON.stringify(distPkgJson, undefined, 2)

  await writeFile('./dist/package.json', pkgJson)
}

function buildExportPaths(
  srcGlobs: { [entryName: string]: string },
  srcGenerators: { [entryName: string]: string },
): { [entryName: string]: string } { // exportPaths
  const exportPaths: { [entryName: string]: string } = {}

  for (const entryName in srcGlobs) {
    exportPaths[entryName] = './' + buildDistShortPath(srcGlobs[entryName])
  }

  for (const entryName in srcGenerators) {
    exportPaths[entryName] = './' + buildDistShortPath(buildFakeSrcPath(entryName))
  }

  return exportPaths
}

function buildPkgMeta(
  srcMeta: any,
  exportPaths: { [entryName: string]: string },
  dev: boolean
): any {
  const distMeta = { ...srcMeta }
  delete distMeta[srcGlobsProp]
  delete distMeta[srcGeneratorsProp]
  delete distMeta[iifeProp]
  delete distMeta.scripts
  delete distMeta.devDependencies

  const mainExportPath = exportPaths['.']
  const mainIifeGlobal = (srcMeta[iifeProp] || {})['.']

  if (!mainExportPath) {
    throw new Error('There must be a root entry file')
  }

  distMeta.main = removeRelPrefix(mainExportPath + cjsExt)
  distMeta.module = removeRelPrefix(mainExportPath + esmExt)
  distMeta.types = removeRelPrefix(mainExportPath + dtsExt)
  distMeta.jsdelivr = removeRelPrefix(
    mainExportPath + (mainIifeGlobal === undefined ? esmExt : iifeMinExt)
  )

  const exportMap: any = {
    './package.json': './package.json'
  }

  for (let entryName in exportPaths) {
    const exportPath = exportPaths[entryName]

    exportMap[entryName] = {
      require: exportPath + cjsExt,
      import: exportPath + esmExt,
      types: (
        dev
          ? './.tsc/' + removeRelPrefix(exportPath)
          : exportPath
        ) + dtsExt,
    }
  }

  distMeta.exports = exportMap

  return distMeta
}

// .npmignore
// -------------------------------------------------------------------------------------------------

async function writeNpmIgnore() {
  await writeFile('./dist/.npmignore', [
    '.tsc',
    'tsconfig.tsbuildinfo',
  ].join("\n"))
}

// Glob
// -------------------------------------------------------------------------------------------------

async function expandSrcGlobs(
  srcGlobs: { [entryName: string]: string },
): Promise<{ [entryName: string]: string }> { //  srcPaths
  const promises: Promise<{ [expandedEntryName: string]: string }>[] = []

  for (let entryName in srcGlobs) {
    promises.push(
      expandSrcGlob(entryName, srcGlobs[entryName])
    )
  }

  const maps = await Promise.all(promises)
  return Object.assign({}, ...maps) // merge all maps
}

async function expandSrcGlob(
  entryName: string,
  srcGlob: string,
): Promise<{ [expandedEntryName: string]: string }> {
  const starIndex = srcGlob.indexOf('*')

  // not a glob
  if (starIndex === -1) {
    return { [entryName]: srcGlob }
  }

  const dirPath = srcGlob.substring(0, starIndex)
  const ext = srcGlob.substring(starIndex + 1)
  const filenames = (await readdir(dirPath)).filter((filename) => !isFilenameHidden(filename))
  const srcPaths: { [entryName: string]: string } = {}

  for (let filename of filenames) {
    if (filename.endsWith(ext)) {
      const filenameNoExt = filename.substring(0, filename.length - ext.length)
      srcPaths[entryName.replace('*', filenameNoExt)] = dirPath + filename
    }
  }

  return srcPaths
}

// JS minification
// -------------------------------------------------------------------------------------------------

async function minifyFile(unminifiedPath: string): Promise<void> {
  return live([
    'pnpm', 'exec', 'terser',
    '--config-file', 'terser.json',
    '--output', resolvePath(removeExtension(unminifiedPath) + iifeMinExt),
    '--', resolvePath(unminifiedPath),
  ], {
    cwd: scriptsDirAbs,
  })
}

// Path utils
// -------------------------------------------------------------------------------------------------

// does NOT include './dist/' at beginning
function buildDistShortPath(srcPath: string): string {
  return removeExtension(srcPath).replace(/^\.\/src\//, '')
}

function isRelative(path: string): boolean {
  return /^\.\.?\/?/.test(path)
}

function isRelativeDot(path: string): boolean { // '.', './', '..', '../'
  return /^\.\.?\/?$/.test(path)
}

function isFilenameHidden(filename: string): boolean {
  return Boolean(filename.match(/^\./))
}

function isWithinDir(path: string, dirPath: string): boolean {
  return path.indexOf(dirPath) === 0 // TODO: make sure dirPath ends in separator
}

function getExtension(path: string): string {
  if (isRelativeDot(path)) {
    return ''
  }
  const match = path.match(/\.[^\/]*$/)
  return match ? match[0] : ''
}

function forceExtension(path: string, ext: string): string {
  return removeExtension(path) + ext
}

function removeExtension(path: string): string {
  const match = path.match(/^(.*)\.([^\/]*)$/)
  return match ? match[1] : path
}

function removeRelPrefix(path: string) {
  return path.replace(/^\.\/?/, '')
}
