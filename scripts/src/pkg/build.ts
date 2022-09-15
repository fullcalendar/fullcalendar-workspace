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

const sourceGlobsProp = 'fileExports'
const sourceGeneratorsProp = 'generatedExports'
const iifeProp = 'iife'
const cjsExt = '.cjs'
const esmExt = '.mjs'
const iifeExt = '.js'
const dtsExt = '.d.ts'
const srcDirAbs = resolvePath('./src')
const tscDirAbs = resolvePath('./dist/.tsc')
const pkgJsonPath = resolvePath('package.json')

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

  const pkgJsonWatcher = watchPaths(pkgJsonPath).on('all', async () => {
    if (rollupWatcher) {
      rollupWatcher.close()
    }

    const origPkgJson = await readFile(pkgJsonPath, 'utf8')
    const origPkgMeta = JSON.parse(origPkgJson)
    const sourceGlobs = origPkgMeta[sourceGlobsProp] || {}
    const sourceGenerators = origPkgMeta[sourceGeneratorsProp] || {}
    const { fakeSourcePaths, sourceStrs } = await buildSourceStrs(sourceGenerators)
    const sourcePaths = { ...fakeSourcePaths, ...(await expandSourceGlobs(sourceGlobs)) }
    const rollupInput = buildRollupInput(sourcePaths)
    const exportPaths = buildExportPaths(sourceGlobs, sourceGenerators)

    // console.log('sourceGlobs', sourceGlobs)
    // console.log('sourceGenerators', sourceGenerators)
    // console.log('sourcePaths', sourcePaths)
    // console.log('sourceStrs', sourceStrs)
    // console.log('rollupInput', rollupInput)
    // console.log('exportPaths', exportPaths)
    // console.log('pkgMeta', buildPkgMeta(origPkgMeta, exportPaths, true))
    // process.exit(1)

    rollupWatcher = rollupWatch({
      input: rollupInput,
      plugins: buildRollupPlugins(sourceStrs, true),
      output: buildEsmOutputOptions(false),
    })

    const pkgMeta = buildPkgMeta(origPkgMeta, exportPaths, true)
    const pkgJson = JSON.stringify(pkgMeta, undefined, 2)
    await writeFile('./dist/package.json', pkgJson)
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
  const origPkgJson = await readFile(pkgJsonPath, 'utf8')
  const origPkgMeta = JSON.parse(origPkgJson)
  const sourceGlobs = origPkgMeta[sourceGlobsProp] || {}
  const sourceGenerators = origPkgMeta[sourceGeneratorsProp] || {}
  const { fakeSourcePaths, sourceStrs } = await buildSourceStrs(sourceGenerators)
  const sourcePaths = { ...(await expandSourceGlobs(sourceGlobs)), ...fakeSourcePaths }
  const rollupInput = buildRollupInput(sourcePaths)
  const exportPaths = buildExportPaths(sourceGlobs, sourceGenerators)

  // console.log('sourceGlobs', sourceGlobs)
  // console.log('sourceGenerators', sourceGenerators)
  // console.log('sourcePaths', sourcePaths)
  // console.log('sourceStrs', sourceStrs)
  // console.log('rollupInput', rollupInput)
  // console.log('exportPaths', exportPaths)
  // console.log('pkgMeta', buildPkgMeta(origPkgMeta, exportPaths, false))
  // process.exit(1)

  await mkdir('./dist', { recursive: true })

  const bundlePromise = rollup({
    input: rollupInput,
    plugins: buildRollupPlugins(sourceStrs, true),
  }).then((bundle) => {
    return Promise.all([
      bundle.write(buildEsmOutputOptions(false)),
      bundle.write(buildCjsOutputOptions())
    ]).then(() => {
      bundle.close()
    })
  })

  const globalNames = origPkgMeta[iifeProp]
  let iifeBundlePromises: Promise<void>[] = []

  if (globalNames) {
    // code-splitting doesn't work for iife. process each individual file
    for (const outputName in rollupInput) {
      iifeBundlePromises.push(
        rollup({
          input: rollupInput[outputName],
          plugins: buildRollupPlugins(sourceStrs, false),
        }).then((bundle) => {
          bundle.write(
            buildIifeOutputOptions(outputName, globalNames['./' + outputName] || '')
          ).then(() => {
            bundle.close()
          })
        })
      )
    }
  }

  const dtsBundlePromise = rollup({
    input: buildRollupDtsInput(sourcePaths),
    plugins: buildRollupDtsPlugins(),
  }).then((bundle) => {
    return bundle.write(buildDtsOutputOptions()).then(() => {
      bundle.close()
    })
  })

  const pkgMeta = buildPkgMeta(origPkgMeta, exportPaths, false)
  const pkgJson = JSON.stringify(pkgMeta, undefined, 2)
  const pkgJsonPromise = writeFile('./dist/package.json', pkgJson)

  return Promise.all([
    bundlePromise,
    ...iifeBundlePromises,
    dtsBundlePromise,
    pkgJsonPromise,
    writeNpmIgnore(),
  ])
}

// Rollup input
// -------------------------------------------------------------------------------------------------

function buildRollupInput(
  sourcePaths: { [entryName: string]: string },
): { [outputName: string]: string } {
  const rollupInput: { [outputName: string]: string } = {}

  for (const entryName in sourcePaths) {
    const entrySourcePath = sourcePaths[entryName]
    const outputName = stripSourcePath(entrySourcePath)

    rollupInput[outputName] = entrySourcePath
  }

  return rollupInput
}

function buildRollupDtsInput(
  sourcePaths: { [entryName: string]: string },
): { [entryName: string]: string } {
  const rollupInput: { [outputName: string]: string } = {}

  for (const entryName in sourcePaths) {
    const shortPath = stripSourcePath(sourcePaths[entryName])

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

function buildIifeOutputOptions(outputName: string, iifeGlobal: string): RollupOutputOptions {
  // for single output file, because code-splitting is disallowed
  const options: RollupOutputOptions = {
    format: 'iife',
    file: './dist/' + outputName + iifeExt,
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
  sourceStrs: { [fakeSourcePath: string]: string },
  externalize: boolean,
): (RollupPlugin | false)[] {
  return [
    sourceStrsPlugin(sourceStrs),
    externalize && externalizeOtherPkgsPlugin(),
    externalize && externalizeDotImportsPlugin(),
    tscRerootPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
    sourcemapsPlugin(), // load preexisting sourcemaps
    postcssPlugin({
      config: {
        path: require.resolve('../../postcss.config.cjs'),
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

function sourceStrsPlugin(sourceStrs: { [fakeSourcePath: string]: string }): RollupPlugin {
  return {
    name: 'source-strs',
    async resolveId(id, importer, options) {
      if (options.isEntry && sourceStrs[id]) {
        return id // no further resolving
      } else if (importer && sourceStrs[importer] && isRelative(id)) {
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
      return sourceStrs[id] // if undefined, fallback to normal file load
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

async function buildSourceStrs(
  sourceGenerators: { [entryName: string]: string },
): Promise<{
  fakeSourcePaths: { [entryName: string]: string }
  sourceStrs: { [fakeSourcePath: string]: string }
}> {
  const fakeSourcePaths: { [entryName: string]: string } = {}
  const sourceStrs: { [fakeSourcePath: string]: string } = {}

  for (const entryName in sourceGenerators) {
    const generatorFile = sourceGenerators[entryName]
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

      const fakeSourcePath = buildFakeSourcePath(entryName)

      fakeSourcePaths[entryName] = fakeSourcePath
      sourceStrs[fakeSourcePath] = generatorRes
    } else if (typeof generatorRes === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorRes) {
        const expandedEntryName = entryName.replace('*', key)
        const fakeSourcePath = buildFakeSourcePath(expandedEntryName)

        fakeSourcePaths[expandedEntryName] = fakeSourcePath
        sourceStrs[fakeSourcePath] = generatorRes[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { fakeSourcePaths, sourceStrs }
}

function buildFakeSourcePath(entryName: string): string {
  return './src/' + removeRelPrefix(entryName) + '.js'
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
    exportPaths[entryName] = './' + stripSourcePath(buildFakeSourcePath(entryName))
  }

  return exportPaths
}

function buildPkgMeta(
  origPkgMeta: any,
  exportPaths: { [entryName: string]: string },
  dev: boolean
): any {
  const pkgMeta = { ...origPkgMeta }
  delete pkgMeta[sourceGlobsProp]
  delete pkgMeta[sourceGeneratorsProp]
  delete pkgMeta[iifeProp]
  delete pkgMeta.scripts
  delete pkgMeta.devDependencies

  const mainExportPath = exportPaths['.']
  if (!mainExportPath) {
    throw new Error('There must be a root entry file')
  }

  pkgMeta.main = removeRelPrefix(mainExportPath + cjsExt)
  pkgMeta.module = removeRelPrefix(mainExportPath + esmExt)
  pkgMeta.types = removeRelPrefix(mainExportPath + dtsExt)
  pkgMeta.jsdelivr = removeRelPrefix(mainExportPath + iifeExt) // TODO: .min.js

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

  pkgMeta.exports = exportMap

  return pkgMeta
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
  sourceGlobs: { [entryName: string]: string },
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
