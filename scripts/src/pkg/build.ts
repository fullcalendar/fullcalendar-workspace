import { join as joinPaths, resolve as resolvePath, isAbsolute, dirname } from 'path'
import { createRequire } from 'module'
import { readFile, readdir as readDir, writeFile, mkdir } from 'fs/promises'
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

const require = createRequire(import.meta.url)

const cjsExt = '.cjs'
const esmExt = '.mjs'
const iifeExt = '.js'
const dtsExt = '.d.ts'
const srcDirAbs = resolvePath('./src')
const tscDirAbs = resolvePath('./dist/.tsc')
const packageJsonPath = resolvePath('package.json')

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
  let rollupWatcher: RollupWatcher | undefined

  await mkdir('./dist', { recursive: true })

  const pkgJsonWatcher = watchPaths(packageJsonPath).on('all', async () => {
    if (rollupWatcher) {
      rollupWatcher.close()
    }

    const origPackageJson = await readFile(packageJsonPath, 'utf8')
    const origPackageMeta = JSON.parse(origPackageJson)
    const sourceGlobs = origPackageMeta.fileExports || {}
    const sourceGenerators = origPackageMeta.generatedExports || {}
    const [ sourcePaths, sourceStrings ] = await Promise.all([
      expandSourceGlobs(sourceGlobs),
      buildSourceStrings(sourceGenerators)
    ])
    const { rollupInput, rollupInputStrings } = buildRollupInput(sourcePaths, sourceStrings)
    const exportPaths = buildExportPaths(sourceGlobs, sourceGenerators)

    // console.log('sourceGlobs', sourceGlobs)
    // console.log('sourceGenerators', sourceGenerators)
    // console.log('sourcePaths', sourcePaths)
    // console.log('sourceStrings', sourceStrings)
    // console.log('rollupInput', rollupInput)
    // console.log('rollupInputStrings', rollupInputStrings)
    // console.log('exportPaths', exportPaths)
    // console.log('packageMeta', buildPackageMeta(origPackageMeta, exportPaths, true))
    // process.exit(1)

    rollupWatcher = rollupWatch({
      input: rollupInput,
      plugins: buildRollupPlugins(rollupInputStrings, true),
      output: buildEsmOutputOptions(false),
    })

    const packageMeta = buildPackageMeta(origPackageMeta, exportPaths, true)
    const packageJson = JSON.stringify(packageMeta, undefined, 2)
    await writeFile('./dist/package.json', packageJson)
  })

  const watcherPromise = new Promise<void>((resolve) => {
    process.once('SIGINT', () => {
      pkgJsonWatcher.close()

      if (rollupWatcher) {
        rollupWatcher.close()
      }

      resolve()
    })
  })

  return Promise.all([
    watcherPromise,
    writeNpmIgnore(),
  ])
}

async function runProd() {
  const origPackageJson = await readFile(packageJsonPath, 'utf8')
  const origPackageMeta = JSON.parse(origPackageJson)
  const sourceGlobs = origPackageMeta.fileExports || {}
  const sourceGenerators = origPackageMeta.generatedExports || {}
  const [ sourcePaths, sourceStrings ] = await Promise.all([
    expandSourceGlobs(sourceGlobs),
    buildSourceStrings(sourceGenerators)
  ])
  const { rollupInput, rollupInputStrings } = buildRollupInput(sourcePaths, sourceStrings)
  const exportPaths = buildExportPaths(sourceGlobs, sourceGenerators)

  // console.log('sourceGlobs', sourceGlobs)
  // console.log('sourceGenerators', sourceGenerators)
  // console.log('sourcePaths', sourcePaths)
  // console.log('sourceStrings', sourceStrings)
  // console.log('rollupInput', rollupInput)
  // console.log('rollupInputStrings', rollupInputStrings)
  // console.log('exportPaths', exportPaths)
  // console.log('packageMeta', buildPackageMeta(origPackageMeta, exportPaths, false))
  // console.log('buildRollupDtsInput', buildRollupDtsInput(sourcePaths, sourceStrings))
  // process.exit(1)

  await mkdir('./dist', { recursive: true })

  const bundlePromise = rollup({
    input: rollupInput,
    plugins: buildRollupPlugins(rollupInputStrings, true),
  }).then((bundle) => {
    return Promise.all([
      bundle.write(buildEsmOutputOptions(false)),
      bundle.write(buildCjsOutputOptions())
    ]).then(() => {
      bundle.close()
    })
  })

  let iifeBundlePromise: Promise<void> | undefined

  if (origPackageMeta.generateIIFE) {
    iifeBundlePromise = rollup({
      input: rollupInput,
      plugins: buildRollupPlugins(rollupInputStrings, false),
    }).then((bundle) => {
      bundle.write(buildIifeOutputOptions()).then(() => {
        bundle.close()
      })
    })
  }

  const dtsBundlePromise = rollup({
    input: buildRollupDtsInput(sourcePaths, sourceStrings),
    plugins: buildRollupDtsPlugins(),
  }).then((bundle) => {
    return bundle.write(buildDtsOutputOptions()).then(() => {
      bundle.close()
    })
  })

  const packageMeta = buildPackageMeta(origPackageMeta, exportPaths, false)
  const packageJson = JSON.stringify(packageMeta, undefined, 2)
  const packageJsonPromise = writeFile('./dist/package.json', packageJson)

  return Promise.all([
    bundlePromise,
    iifeBundlePromise,
    dtsBundlePromise,
    packageJsonPromise,
    writeNpmIgnore(),
  ])
}

// Rollup input
// -------------------------------------------------------------------------------------------------

function buildRollupInput(
  sourcePaths: { [entryName: string]: string },
  sourceStrings: { [entryName: string]: string },
): {
  rollupInput: { [outputName: string]: string },
  rollupInputStrings: { [outputName: string]: string },
} {
  const rollupInput: { [outputName: string]: string } = {}
  const rollupInputStrings: { [outputName: string]: string } = {}

  for (const entryName in sourcePaths) {
    const entrySourcePath = sourcePaths[entryName]
    const outputName = stripSourcePath(entrySourcePath)

    rollupInput[outputName] = entrySourcePath
  }

  for (const entryName in sourceStrings) {
    const outputName = removeRelPrefix(entryName) || 'index'
    const generationId = createGenerationId()

    rollupInput[outputName] = generationId
    rollupInputStrings[generationId] = sourceStrings[entryName]
  }

  return { rollupInput, rollupInputStrings }
}

function buildRollupDtsInput(
  sourcePaths: { [entryName: string]: string },
  sourceStrings: { [entryName: string]: string },
): { [entryName: string]: string } {
  const rollupInput: { [outputName: string]: string } = {}

  for (const entryName in sourcePaths) {
    const shortPath = stripSourcePath(sourcePaths[entryName])

    rollupInput[shortPath] = `./dist/.tsc/${shortPath}.d.ts`
  }

  for (const entryName in sourceStrings) {
    const shortPath = removeRelPrefix(entryName) // fake the source file

    rollupInput[shortPath] = `./dist/.tsc/${shortPath}.d.ts`
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

function buildIifeOutputOptions(): RollupOutputOptions {
  return {
    format: 'iife',
    dir: './dist',
    entryFileNames: '[name]' + iifeExt,
  }
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
  rollupInputStrings: { [generationId: string]: string },
  externalize: boolean,
): (RollupPlugin | false)[] {
  return [
    stringContentPlugin(rollupInputStrings),
    tscRerootPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
    externalize && externalizePlugin(),
    postcssPlugin({
      config: {
        path: require.resolve('../../postcss.config.cjs'),
        ctx: {}, // arguments given to config file
      }
    }),
    sourcemapsPlugin(), // load preexisting sourcemaps
    // TODO: resolve tsconfig.json paths
  ]
}

function buildRollupDtsPlugins() {
  return [
    dtsPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
    externalAssetsPlugin(),
  ]
}

function stringContentPlugin(entryContents: { [outputName: string]: string }): RollupPlugin {
  return {
    name: 'str-content',
    resolveId(id, importer, options) {
      if (options.isEntry) {
        if (entryContents[id]) {
          return id
        }
      } else if (
        importer &&
        entryContents[importer] &&
        isRelative(id)
      ) {
        // consider imports from generated-files as external
        return { id, external: true }
      }
    },
    load(id: string) {
      return entryContents[id] // if undefined, fallback to normal file load
    },
  }
}

function tscRerootPlugin(): RollupPlugin {
  return {
    name: 'tsc-reroot',
    resolveId(id, importer, options) {
      if (options.isEntry) {
        // move entrypoints within tsc dirs
        const absPath = joinPaths(process.cwd(), id)
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

function externalizePlugin(): RollupPlugin {
  return {
    name: 'externalize',
    resolveId(id, importer, options) {
      if (!options.isEntry && !isRelative(id) && !isAbsolute(id)) {
        return { id, external: true }
      }
    },
  }
}

/*
externalize asset (paths with extensions)
*/
function externalAssetsPlugin(): RollupPlugin {
  return {
    name: 'externalize-assets',
    resolveId(id, importer, options) {
      if (importer && isRelative(id) && getExtension(id)) {
        return { id, external: true }
      }
    },
  }
}

// Dynamic code generation
// -------------------------------------------------------------------------------------------------

let generationGuid = 0

function createGenerationId() {
  return '\0generation:' + (generationGuid++) // virtual file path
}

async function buildSourceStrings(
  sourceGenerators: { [entryName: string]: string },
): Promise<{ [entryName: string]: string }> { // sourceStrings
  const sourceStrings: { [entryName: string]: string } = {}

  for (const entryName in sourceGenerators) {
    const generatorFile = sourceGenerators[entryName]
    const generatorExports = await import(joinPaths(process.cwd(), generatorFile))
    const generatorFunc = generatorExports.default

    if (typeof generatorFunc !== 'function') {
      throw new Error('Generator must have a default function export')
    }

    const generatorRes = await generatorFunc(entryName)

    if (typeof generatorRes === 'string') {
      if (entryName.indexOf('*') !== -1) {
        throw new Error('Generator string output can\'t have blob entrypoint name')
      }

      sourceStrings[entryName] = generatorRes
    } else if (typeof generatorRes === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorRes) {
        const expandedEntryName = entryName.replace('*', key)

        sourceStrings[expandedEntryName] = generatorRes[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return sourceStrings
}

// package.json
// -------------------------------------------------------------------------------------------------

function buildExportPaths(
  sourceGlobs: { [entryName: string]: string },
  sourceGenerators: { [entryName: string]: string },
): { [entryName: string]: string } { // exportPaths
  const exportPaths: { [entryName: string]: string } = {}

  for (const entryName in sourceGlobs) {
    exportPaths[entryName] = './' + stripSourcePath(sourceGlobs[entryName])
  }

  for (const entryName in sourceGenerators) {
    exportPaths[entryName] = entryName // generator path not used
  }

  return exportPaths
}

function buildPackageMeta(
  origPackageMeta: any,
  exportPaths: { [entryName: string]: string },
  dev: boolean
): any {
  const packageMeta = { ...origPackageMeta }
  delete packageMeta.fileExports
  delete packageMeta.generatedExports
  delete packageMeta.devDependencies

  const mainExportPath = exportPaths['.']
  if (!mainExportPath) {
    throw new Error('There must be a root entry file')
  }

  packageMeta.main = removeRelPrefix(mainExportPath + cjsExt)
  packageMeta.module = removeRelPrefix(mainExportPath + esmExt)
  packageMeta.types = removeRelPrefix(mainExportPath + dtsExt)

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

  packageMeta.exports = exportMap

  return packageMeta
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

async function expandSourceGlobs(
  sourceGlobs: { [name: string]: string },
): Promise<{ [entryName: string]: string }> { //  sourcePaths
  const promises: Promise<{ [expandedEntryName: string]: string }>[] = []

  for (let entryName in sourceGlobs) {
    promises.push(
      expandSourceGlob(entryName, sourceGlobs[entryName])
    )
  }

  const maps = await Promise.all(promises)
  return Object.assign({}, ...maps) // merge all maps
}

async function expandSourceGlob(
  entryName: string,
  sourceGlob: string,
): Promise<{ [expandedEntryName: string]: string }> {
  const starIndex = sourceGlob.indexOf('*')

  // not a glob
  if (starIndex === -1) {
    return { [entryName]: sourceGlob }
  }

  const dirPath = sourceGlob.substring(0, starIndex)
  const ext = sourceGlob.substring(starIndex + 1)
  const filenames = (await readDir(dirPath)).filter((filename) => !isFilenameHidden(filename))
  const sourcePaths: { [entryName: string]: string } = {}

  for (let filename of filenames) {
    if (filename.endsWith(ext)) {
      const filenameNoExt = filename.substring(0, filename.length - ext.length)
      sourcePaths[entryName.replace('*', filenameNoExt)] = dirPath + filename
    }
  }

  return sourcePaths
}

// Path utils
// -------------------------------------------------------------------------------------------------

function stripSourcePath(path: string): string {
  return removeExtension(path).replace(/^\.\/src\//, '')
}

function isRelative(path: string): boolean {
  return Boolean(path.match(/^\.\.?\//))
}

function isFilenameHidden(filename: string): boolean {
  return Boolean(filename.match(/^\./))
}

function isWithinDir(path: string, dirPath: string): boolean {
  return path.indexOf(dirPath) === 0 // TODO: make sure dirPath ends in separator
}

function getExtension(path: string): string {
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
