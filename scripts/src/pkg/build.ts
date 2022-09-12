import { join as joinPaths, resolve as resolvePath, isAbsolute, dirname } from 'path'
import { createRequire } from 'module'
import { readFile, readdir as readDir, writeFile } from 'fs/promises'
import {
  rollup,
  watch as rollupWatch,
  Plugin as RollupPlugin,
  InputOptions as RollupInputOptions,
  OutputOptions as RollupOutputOptions,
  RollupWatcher,
} from 'rollup'
import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve'
import dtsPlugin from 'rollup-plugin-dts'
import postcssPlugin from 'rollup-plugin-postcss'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import { watch as watchPaths } from 'chokidar'

type GeneratorOutput = string | { [generator: string] : string }

const require = createRequire(import.meta.url)

const cjsExt = '.cjs'
const esmExt = '.mjs'
const iifeExt = '.js'
const typesExt = '.d.ts'
const distDir = './dist'
const tscDir = './dist/.tsc' // also './.tsc/' below
const srcDirAbs = resolvePath('./src')
const tscDirAbs = resolvePath(tscDir)
const pkgJsonPath = joinPaths(process.cwd(), 'package.json')

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

  const pkgJsonWatcher = watchPaths(pkgJsonPath).on('all', async () => {
    if (rollupWatcher) {
      rollupWatcher.close()
    }

    const pkgJson = await readFile(pkgJsonPath, 'utf8')
    const pkgMeta = JSON.parse(pkgJson)

    const { entryFiles, entryContents } = await determineEntryFiles(
      pkgMeta.fileExports || {},
      pkgMeta.generatedExports || {},
    )

    rollupWatcher = rollupWatch({
      ...buildRollupInputOptions(entryFiles, entryContents, true),
      output: buildRollupOutputOptions('esm', false),
    })

    const distMeta = buildDistMeta(pkgMeta, true)
    const distMetaJson = JSON.stringify(distMeta, undefined, 2)
    await writeFile('./dist/package.json', distMetaJson)
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
  const pkgJson = await readFile(pkgJsonPath, 'utf8')
  const pkgMeta = JSON.parse(pkgJson)

  const { entryFiles, entryContents } = await determineEntryFiles(
    pkgMeta.fileExports || {},
    pkgMeta.generatedExports || {},
  )

  const bundlePromise = rollup(
    buildRollupInputOptions(entryFiles, entryContents, true)
  ).then((bundle) => {
    return Promise.all([
      bundle.write(buildRollupOutputOptions('esm', false)),
      bundle.write(buildRollupOutputOptions('cjs', false))
    ]).then(() => {
      bundle.close()
    })
  })

  let iifeBundlePromise: Promise<void> | undefined
  if (pkgMeta.generateIIFE) {
    iifeBundlePromise = rollup(
      buildRollupInputOptions(entryFiles, entryContents, false)
    ).then((bundle) => {
      bundle.write(buildRollupOutputOptions('iife', false)).then(() => {
        bundle.close()
      })
    })
  }

  // const dtsBundle = rollup(
  //   buildRollupDtsInputOptions(entryFiles),
  // ).then((bundle) => {
  //   return bundle.write(buildRollupDtsOutputOptions()).then(() => {
  //     bundle.close()
  //   })
  // })

  const distMeta = buildDistMeta(pkgMeta, false)
  const distMetaJson = JSON.stringify(distMeta, undefined, 2)
  const distMetaPromise = writeFile('./dist/package.json', distMetaJson)

  return Promise.all([
    bundlePromise,
    iifeBundlePromise,
    distMetaPromise,
    writeNpmIgnore(),
  ])
}

// package.json
// -------------------------------------------------------------------------------------------------

function buildDistMeta(pkgMeta: any, dev: boolean): any {
  const fileExports = pkgMeta.fileExports || {}
  const generatedExports = pkgMeta.generatedExports || {}
  const allExports = { ...fileExports, ...generatedExports }

  const distMeta = { ...pkgMeta }
  delete distMeta.fileExports
  delete distMeta.generatedExports
  delete distMeta.devDependencies

  if (!allExports['.']) {
    throw new Error('There must be a root entry file')
  }

  distMeta.main = 'index' + cjsExt
  distMeta.module = 'index' + esmExt
  distMeta.types = 'index' + typesExt

  const exportMap: any = {
    './package.json': './package.json'
  }

  for (let entryName in allExports) {
    const pathNoExt = entryName === '.' ? './index' : entryName
    const srcFile = fileExports[entryName]
    const typesPathNoExt = (dev && srcFile)
      ? removeExtension(srcFile).replace('./src/', './.tsc/')
      : pathNoExt

    exportMap[entryName] = {
      require: pathNoExt + cjsExt,
      import: pathNoExt + esmExt,
      types: typesPathNoExt + typesExt
    }
  }

  distMeta.exports = exportMap

  return distMeta
}

// .npmignore
// -------------------------------------------------------------------------------------------------

function writeNpmIgnore() {
  return writeFile(joinPaths(distDir, '.npmignore'), [
    '.tsc',
    'tsconfig.tsbuildinfo',
  ].join("\n"))
}

// Entry map
// -------------------------------------------------------------------------------------------------

/*
TODO: improve out filename for fileExports
*/
async function determineEntryFiles(
  entryFilesUnexpanded: { [entryName: string]: string },
  entryGenerators: { [entryName: string]: string },
): Promise<{
  entryFiles: { [entryName: string]: string },
  entryContents: { [generationId: string]: string },
}> {
  const entryFiles: { [entryName: string]: string } = await expandEntryFiles(entryFilesUnexpanded)
  const entryContents: { [entryName: string]: string } = {}
  const generatorOutputs: { [generator: string]: GeneratorOutput } = {}

  for (const entryName in entryGenerators) {
    const generatorFile = entryGenerators[entryName]
    const generatorExports = await import(joinPaths(process.cwd(), generatorFile))
    const generatorFunc = generatorExports.default

    if (typeof generatorFunc !== 'function') {
      throw new Error('Generator must have a default function export')
    }

    generatorOutputs[entryName] = await generatorFunc(entryName)
  }

  for (let entryName in generatorOutputs) {
    const generatorOuput = generatorOutputs[entryName]

    if (typeof generatorOuput === 'string') {
      if (entryName.indexOf('*') !== -1) {
        throw new Error('Generator string output can\'t have blob entrypoint name')
      }

      const generationId = createGenerationId()

      entryFiles[entryName] = generationId
      entryContents[generationId] = generatorOuput
    } else if (typeof generatorOuput === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorOuput) {
        const specificEntryName = entryName.replace('*', key)
        const generationId = createGenerationId()

        entryFiles[specificEntryName] = generationId
        entryContents[generationId] = generatorOuput[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { entryFiles, entryContents }
}

// Rollup options
// -------------------------------------------------------------------------------------------------

function buildRollupInputOptions(
  entryFiles: { [entryName: string]: string },
  entryContents: { [genetionId: string]: string },
  externalize: boolean,
): RollupInputOptions {
  return {
    input: entryFilesToInput(entryFiles),
    plugins: [
      strContentPlugin(entryContents), // provides synthetic content
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
}

function buildRollupOutputOptions(
  format: 'esm' | 'cjs' | 'iife',
  dev: boolean,
): RollupOutputOptions {
  switch (format) {
    case 'esm':
      return {
        format: 'esm',
        dir: distDir,
        entryFileNames: '[name]' + esmExt,
        sourcemap: dev,
      }
    case 'cjs':
      return {
        format: 'cjs',
        exports: 'auto',
        dir: distDir,
        entryFileNames: '[name]' + cjsExt,
      }
    case 'iife':
      return {
        format: 'iife',
        dir: distDir,
        entryFileNames: '[name]' + iifeExt,
      }
  }
}

// Rollup plugins
// -------------------------------------------------------------------------------------------------

function entryFilesToInput(
  entryFiles: { [entryName: string] : string }
): { [inputName: string] : string } {
  const input: { [inputName: string] : string } = {}

  for (let entryName in entryFiles) {
    const inputName = entryName === '.' ? 'index' : entryName.replace(/^\.\//, '')
    input[inputName] = entryFiles[entryName]
  }

  return input
}

function strContentPlugin(entryContents: { [entryName: string]: string }): RollupPlugin {
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
        // move paths with extensions back to src
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

// Glob
// -------------------------------------------------------------------------------------------------

async function expandEntryFiles(
  entryFiles: { [name: string]: string },
): Promise<{ [specificEntryName: string]: string }> {
  const promises: Promise<{ [specificEntryName: string]: string }>[] = []

  for (let entryName in entryFiles) {
    promises.push(
      expandEntryFile(entryName, entryFiles[entryName])
    )
  }

  const maps = await Promise.all(promises)

  return Object.assign({}, ...maps) // merge all maps
}

async function expandEntryFile(
  entryName: string,
  pathGlob: string,
): Promise<{ [specificEntryName: string]: string }> {
  const starIndex = pathGlob.indexOf('*')

  // not a glob
  if (starIndex === -1) {
    return { [entryName]: pathGlob }
  }

  const dirPath = pathGlob.substring(0, starIndex)
  const ext = pathGlob.substring(starIndex + 1)
  const filenames = (await readDir(dirPath)).filter((filename) => !isFilenameHidden(filename))
  const entryFiles: { [entryName: string]: string } = {}

  for (let filename of filenames) {
    if (filename.endsWith(ext)) {
      const filenameNoExt = filename.substring(0, filename.length - ext.length)
      const specificEntryName = entryName.replace('*', filenameNoExt)
      entryFiles[specificEntryName] = dirPath + filename
    }
  }

  return entryFiles
}

// Generation ID
// -------------------------------------------------------------------------------------------------

let generationGuid = 0

function createGenerationId() {
  return '\0generation:' + (generationGuid++)
}

// Path utils
// -------------------------------------------------------------------------------------------------

function isRelative(path: string): boolean {
  return Boolean(path.match(/^\.\.?\//))
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

function isFilenameHidden(filename: string): boolean {
  return Boolean(filename.match(/^\./))
}
