import { join as joinPaths, resolve as resolvePath, isAbsolute, dirname } from 'path'
import { readFile, readdir as readDir } from 'fs/promises'
import { Plugin as RollupPlugin, rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'

type GeneratorOutput = string | { [generator: string] : string }

/*
Must be run from package root.
The `pnpm run` system does this automatically.
*/
export default async function() {
  const pkgJsonPath = joinPaths(process.cwd(), 'package.json')
  const pkgJson = (await readFile(pkgJsonPath)).toString()
  const pkgMeta = JSON.parse(pkgJson)

  const {
    entryFiles,
    entryContents,
  } = await determineEntryFiles(
    pkgMeta.fileExports || {},
    pkgMeta.generatedExports || {},
  )

  const bundle = await rollup({
    input: entryFiles,
    plugins: [
      strContentPlugin(entryContents), // must be before all else, to provide synthetic content
      tscRerootPlugin(),
      nodeResolve(), // determines index.js and .js/cjs/mjs
      externalizePlugin(),
      // TODO: resolve tsconfig.json paths
      // TODO: sourcemap plugin
    ]
  })

  await bundle.write({
    dir: 'dist',
  })
  bundle.close()
}

// Input map
// -------------------------------------------------------------------------------------------------

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

      entryFiles[cleanEntryName(entryName)] = generationId
      entryContents[generationId] = generatorOuput
    } else if (typeof generatorOuput === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorOuput) {
        const specificEntryName = entryName.replace('*', key)
        const generationId = createGenerationId()

        entryFiles[cleanEntryName(specificEntryName)] = generationId
        entryContents[generationId] = generatorOuput[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { entryFiles, entryContents }
}

// HACK
function cleanEntryName(n: string) {
  return n === '.' ? 'index' : n.replace(/^\.\//, '')
}

// Rollup plugins
// -------------------------------------------------------------------------------------------------

function strContentPlugin(entryContents: { [entryName: string]: string }): RollupPlugin {
  return {
    name: 'str-content',
    resolveId(id, importer, options) {
      if (options.isEntry && entryContents[id]) {
        return id
      }
    },
    load(id: string) {
      return entryContents[id] // if undefined, fallback to normal file load
    },
  }
}

function tscRerootPlugin(): RollupPlugin {
  const srcDir = resolvePath('./src')
  const tscDir = resolvePath('./tsc')

  return {
    name: 'tsc-output',
    resolveId(id, importer, options) {
      if (options.isEntry) {
        // move entrypoints within tsc dirs
        const absPath = joinPaths(process.cwd(), id)
        if (isWithinDir(absPath, srcDir)) {
          return tscDir + forceExtension(absPath.substring(srcDir.length), '.js')
        }
      } else if (importer && isRelative(id)) {
        // move paths with extensions back to src
        const ext = getExtension(id)
        if (ext) {
          const absPath = joinPaths(dirname(importer), id)
          if (isWithinDir(absPath, tscDir)) {
            return srcDir + absPath.substring(tscDir.length)
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
    return { [cleanEntryName(entryName)]: pathGlob }
  }

  const dirPath = pathGlob.substring(0, starIndex)
  const ext = pathGlob.substring(starIndex + 1)
  const filenames = (await readDir(dirPath)).filter((filename) => !filename.match(/^\./))
  const entryFiles: { [entryName: string]: string } = {}

  for (let filename of filenames) {
    if (filename.endsWith(ext)) {
      const filenameNoExt = filename.substring(0, filename.length - ext.length)
      const specificEntryName = entryName.replace('*', filenameNoExt)
      entryFiles[cleanEntryName(specificEntryName)] = dirPath + filename
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
