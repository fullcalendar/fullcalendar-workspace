import { join as joinPaths } from 'path'
import { readFile, readdir as readDir } from 'fs/promises'
import { rollup } from 'rollup'

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

  console.log('entryFiles', entryFiles)
  console.log('entryContents', entryContents)

  // const bundle = await rollup({
  //   plugins: [
  //     {
  //       name: '',
  //       load(id: string) {
  //         // if undefined, fallback to normal file load
  //         return entryContents[id]
  //       }
  //     }
  //   ]
  // })
  // const { output } = await bundle.generate({
  // })
  // bundle.close()
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

      const generationId = createGenerationPath()

      entryFiles[entryName] = generationId
      entryContents[generationId] = generatorOuput
    } else if (typeof generatorOuput === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorOuput) {
        const specificEntryName = entryName.replace('*', key)
        const generationId = createGenerationPath()

        entryFiles[specificEntryName] = generationId
        entryContents[generationId] = generatorOuput[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { entryFiles, entryContents }
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
  const filenames = (await readDir(dirPath)).filter((filename) => !filename.match(/^\./))
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

function createGenerationPath() {
  return 'generation:' + (generationGuid++)
}
