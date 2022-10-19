import { join as joinPaths } from 'path'
import { globby } from 'globby'
import { MonorepoStruct, computeLocalDepDirs } from '../../utils/monorepo-struct.js'

export interface PkgBundleStruct {
  pkgDir: string,
  pkgJson: any
  entryConfigMap: EntryConfigMap
  entryStructMap: { [entryAlias: string]: EntryStruct } // entryAlias like "./index"
  iifeGlobalsMap: IifeGlobalsMap
  miscWatchPaths: string[]
}

export interface EntryConfig {
  generator?: string
  iifeGenerator?: string
  iife?: boolean
}

export interface EntryStruct {
  entryGlob: string // like "." or "./locales/*"
  entrySrcPath: string // transpiled src. like "./index.js" or "./locales/en.js"
  entrySrcBase: string // transpiled src, but without the extension
  content?: string
}

export interface PkgJsonBuildConfig {
  exports?: EntryConfigMap
  iifeGlobals?: IifeGlobalsMap
}

export type EntryConfigMap = { [entryGlob: string]: EntryConfig }
export type EntryStructMap = { [entryAlias: string]: EntryStruct }
export type IifeGlobalsMap = { [importPath: string]: string }

export type GeneratorFunc = (entryGlob: string) => (string | { [entryName: string]: string })
export type IifeGeneratorFunc = (entryAlias: string) => string

export const transpiledSubdir = 'dist/.tsout'
export const transpiledExtension = '.js'
const srcExtensions = ['.ts', '.tsx']

export async function buildPkgBundleStruct(
  pkgDir: string,
  pkgJson: any,
): Promise<PkgBundleStruct> {
  const buildConfig: PkgJsonBuildConfig = pkgJson.buildConfig || {}
  const entryConfigMap: EntryConfigMap = buildConfig.exports || {}
  const entryStructMap: { [entryAlias: string]: EntryStruct } = {}
  const iifeGlobalsMap: IifeGlobalsMap = buildConfig.iifeGlobals || {}
  const miscWatchPaths: string[] = []

  await Object.keys(entryConfigMap).map(async (entryGlob) => {
    const entryConfig = entryConfigMap[entryGlob]

    Object.assign(
      entryStructMap,
      entryConfig.generator
        ? await generateEntryStructMap(pkgDir, entryGlob, entryConfig.generator, miscWatchPaths)
        : await unglobEntryStructMap(pkgDir, entryGlob),
    )
  })

  return { pkgDir, pkgJson, entryConfigMap, entryStructMap, iifeGlobalsMap, miscWatchPaths }
}

// Source-File Entrypoints
// -------------------------------------------------------------------------------------------------

async function unglobEntryStructMap(
  pkgDir: string,
  entryGlob: string,
): Promise<EntryStructMap> {
  const entryStructMap: EntryStructMap = {}
  const fullGlob =
    (entryGlob === '.' ? './index' : entryGlob) +
    '{' + srcExtensions.join(',') + '}'

  const transpiledDir = joinPaths(pkgDir, transpiledSubdir)
  const srcDir = joinPaths(pkgDir, 'src')
  const srcPaths = await globby(fullGlob, { cwd: srcDir })

  for (const srcPath of srcPaths) {
    for (const srcExtension of srcExtensions) {
      if (srcPath.endsWith(srcExtension)) {
        const entryAlias = srcPath.substring(0, srcPath.length - srcExtension.length)
        const entrySrcBase = joinPaths(transpiledDir, entryAlias)
        const entrySrcPath = entrySrcBase + transpiledExtension

        entryStructMap[entryAlias] = { entryGlob, entrySrcPath, entrySrcBase }
      }
    }
  }

  return entryStructMap
}

// Dynamically-Generated Entrypoints
// -------------------------------------------------------------------------------------------------

async function generateEntryStructMap(
  pkgDir: string,
  entryGlob: string,
  generatorPath: string,
  miscWatchPaths: string[], // pass-by-reference, modified
): Promise<EntryStructMap> {
  const generatorExports = await import(generatorPath)
  const generatorFunc: GeneratorFunc = generatorExports.default

  if (typeof generatorFunc !== 'function') {
    throw new Error('Generator must have a default function export')
  }

  const generatorRes = await generatorFunc(entryGlob)
  const transpiledDir = joinPaths(pkgDir, transpiledSubdir)
  const entryStructMap: EntryStructMap = {}

  if (typeof generatorRes === 'string') {
    if (entryGlob.includes('*')) {
      throw new Error('Generator string output can\'t have blob entrypoint name')
    }

    const entrySrcBase = joinPaths(transpiledDir, entryGlob)
    const entrySrcPath = entrySrcBase + transpiledExtension

    entryStructMap[entryGlob] = {
      entryGlob,
      entrySrcPath,
      entrySrcBase,
      content: generatorRes,
    }
  } else if (typeof generatorRes === 'object') {
    if (entryGlob.includes('*')) {
      throw new Error('Generator object output must have blob entrypoint name')
    }

    for (const key in generatorRes) {
      const entryAlias = entryGlob.replace('*', key)
      const entrySrcBase = joinPaths(transpiledDir, entryAlias)
      const entrySrcPath = entrySrcBase + transpiledExtension

      entryStructMap[entryAlias] = {
        entryGlob,
        entrySrcPath,
        entrySrcBase,
        content: generatorRes[key],
      }
    }
  } else {
    throw new Error('Invalid type of generator output')
  }

  const relWatchPaths: string[] = generatorExports.miscWatchPaths || []
  const absWatchPaths = relWatchPaths.map((relPath) => joinPaths(pkgDir, relPath))

  miscWatchPaths.push(...absWatchPaths)
  miscWatchPaths.push(generatorPath) // watch the generator script itself

  return entryStructMap
}

export function entryStructsToContentMap(
  entryStructMap: EntryStructMap,
): { [path: string]: string } {
  const contentMap: { [path: string]: string } = {}

  for (const entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]

    if (typeof entryStruct.content === 'string') {
      contentMap[entryStruct.entrySrcPath] = entryStruct.content
    }
  }

  return contentMap
}

export async function generateIifeContent(
  pkgBundleStruct: PkgBundleStruct,
): Promise<{ [path: string]: string }> {
  const { pkgDir, entryConfigMap, entryStructMap } = pkgBundleStruct
  const contentMap: { [path: string]: string } = {}

  for (const entryAlias in entryStructMap) {
    const entryStruct = entryStructMap[entryAlias]
    const entryConfig = entryConfigMap[entryStruct.entryGlob]
    const { iifeGenerator } = entryConfig

    if (iifeGenerator) {
      const iifeGeneratorPath = joinPaths(pkgDir, iifeGenerator)
      const iifeGeneratorExports = await import(iifeGeneratorPath)
      const iifeGeneratorFunc: IifeGeneratorFunc = iifeGeneratorExports.default

      if (typeof iifeGeneratorFunc !== 'function') {
        throw new Error('iifeGenerator must have a default function export')
      }

      const iifeGeneratorRes = await iifeGeneratorFunc(entryAlias)

      if (typeof iifeGeneratorRes !== 'string') {
        throw new Error('iifeGenerator must return a string')
      }

      const transpiledDir = joinPaths(pkgDir, transpiledSubdir)
      const transpiledPath = joinPaths(transpiledDir, entryAlias) + transpiledExtension

      contentMap[transpiledPath] = iifeGeneratorRes
    }
  }

  return contentMap
}

// External Packages
// -------------------------------------------------------------------------------------------------

export function computeExternalPkgs(pkgBundleStruct: PkgBundleStruct): string[] {
  const { pkgJson } = pkgBundleStruct

  return Object.keys({
    ...pkgJson.dependencies,
    ...pkgJson.peerDependencies,
    ...pkgJson.optionalDependencies,
  })
}

export function computeIifeExternalPkgs(pkgBundleStruct: PkgBundleStruct): string[] {
  const { iifeGlobalsMap } = pkgBundleStruct

  return computeExternalPkgs(pkgBundleStruct)
    .filter((pkgName) => (
      iifeGlobalsMap[pkgName] &&
      iifeGlobalsMap['*']
    ))
}

// External File Paths
// -------------------------------------------------------------------------------------------------

export function computeOwnExternalPaths(pkgBundleStruct: PkgBundleStruct): string[] {
  return Object.values(pkgBundleStruct.entryStructMap)
    .map((entryStruct) => entryStruct.entrySrcPath)
}

export function computeOwnIifeExternalPaths(pkgBundleStruct: PkgBundleStruct): string[] {
  const { entryConfigMap, entryStructMap } = pkgBundleStruct

  return Object.values(entryStructMap)
    .filter((entryStruct) => entryConfigMap[entryStruct.entryGlob].iife)
    .map((entryStruct) => entryStruct.entrySrcPath)
}

// IIFE Browser Globals
// -------------------------------------------------------------------------------------------------

export function computeIifeGlobals(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
): IifeGlobalsMap {
  const allGlobalsMap: IifeGlobalsMap = {}

  const { pkgJson, entryStructMap, iifeGlobalsMap } = pkgBundleStruct
  const pkgName = pkgJson.name

  // scan the package's own unglobbed entrypoints
  for (const entryAlias in entryStructMap) {
    const { entrySrcPath, entryGlob } = entryStructMap[entryAlias]
    const globalName = iifeGlobalsMap[entryGlob]

    if (globalName) {
      const fullImportId = entryGlob === '.' ?
        pkgName :
        pkgName + entryAlias.substring(1)

      allGlobalsMap[fullImportId] = globalName
      allGlobalsMap[entrySrcPath] = globalName // add file path too
    }
  }

  // scan the package's external dependencies
  for (const importId in iifeGlobalsMap) {
    const globalName = iifeGlobalsMap[importId]

    if (importId !== '.' && !importId.startsWith('./')) {
      allGlobalsMap[importId] = globalName
    }
  }

  const depDirs = computeLocalDepDirs(monorepoStruct, pkgJson)
  const depPkgJsons = depDirs.map((depDir) => monorepoStruct.pkgDirToJson[depDir])

  // scan the package's dependencies that live in the monorepo
  for (const depPkgJson of depPkgJsons) {
    const depPkgName = depPkgJson.name
    const depBuildConfig: PkgJsonBuildConfig = depPkgJson.buildConfig || {}
    const depIifeGlobalsMap = depBuildConfig.iifeGlobals || {}

    for (const importId in depIifeGlobalsMap) {
      const globalName = depIifeGlobalsMap[importId]

      if (importId === '.') {
        allGlobalsMap[depPkgName] = globalName
      } else if (importId.startsWith('./')) {
        allGlobalsMap[depPkgName + importId.substring(1)] = globalName
      }
    }
  }

  return allGlobalsMap
}
