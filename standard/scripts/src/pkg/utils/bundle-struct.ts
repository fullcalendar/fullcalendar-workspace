import { join as joinPaths } from 'path'
import { globby } from 'globby'
import { type MonorepoStruct, computeLocalDepDirs } from '../../utils/monorepo-struct.ts'
import { filterProps } from '../../utils/lang.ts'
import { pkgLog } from '../../utils/log.ts'
import { srcExtensions, transpiledSubdir, transpiledExtension } from './config.ts'

export interface PkgBundleStruct {
  pkgDir: string,
  pkgJson: any
  entryConfigMap: EntryConfigMap
  entryStructMap: { [entryAlias: string]: EntryStruct } // entryAlias like "index"
  miscWatchPaths: string[]
}

export interface EntryConfig {
  generator?: string
  module?: boolean
  iife?: boolean
  global?: string // own global
  external?: string[]
  globals?: { [dep: string]: string } // globals for externals
  cssExtract?: boolean | string
  cssMin?: boolean
  cssAsJs?: boolean
  src?: string // relative to src dir, no loeading "./", no extension
  types?: string // relative to src dir, no leading "./", no extension
  sideEffects?: boolean
}

export interface EntryStruct {
  entryGlob: string // like "." or "./locales/*"
  entrySrcPath: string // transpiled src. like "<absroot>/index.js"
  entrySrcBase: string // transpiled src. like "<absroot>/index"
  content?: string
}

export interface PkgJsonBuildConfig {
  exports?: EntryConfigMap
  dependencyGlobalVars?: GlobalVarMap
}

export type EntryConfigMap = { [entryGlob: string]: EntryConfig }
export type EntryStructMap = { [entryAlias: string]: EntryStruct }
export type GlobalVarMap = { [importPath: string]: string }

export type GeneratorFunc = (
  config: { pkgDir: string, entryGlob: string, log: (message: string) => void }
) => (string | { [entryName: string]: string })

export type IifeGeneratorFunc = (
  config: { pkgDir: string, entryAlias: string, log: (message: string) => void }
) => string

export type WatchPathsFunc = (pkgDir: string) => string[]

export async function buildPkgBundleStruct(
  pkgDir: string,
  pkgJson: any,
): Promise<PkgBundleStruct> {
  const buildConfig: PkgJsonBuildConfig = pkgJson.buildConfig || {}
  const entryConfigMap: EntryConfigMap = buildConfig.exports || {}
  const entryStructMap: { [entryAlias: string]: EntryStruct } = {}
  const miscWatchPaths: string[] = []

  await Promise.all(
    Object.keys(entryConfigMap).map(async (entryGlob) => {
      const entryConfig = entryConfigMap[entryGlob]
      const newEntryStructMap = entryConfig.generator ?
        await generateEntryStructMap(pkgDir, pkgJson, entryGlob, entryConfig.generator, miscWatchPaths) :
        await unglobEntryStructMap(pkgDir, entryGlob, entryConfig.src)

      Object.assign(entryStructMap, newEntryStructMap)
    }),
  )

  return { pkgDir, pkgJson, entryConfigMap, entryStructMap, miscWatchPaths }
}

// Source-File Entrypoints
// -------------------------------------------------------------------------------------------------

async function unglobEntryStructMap(
  pkgDir: string,
  entryGlob: string,
  maybeSrcAlias: string | undefined,
): Promise<EntryStructMap> {
  const srcGlob = maybeSrcAlias ? `./${maybeSrcAlias}` : entryGlob
  const entryStructMap: EntryStructMap = {}
  const massagedGlob =
    (srcGlob === '.' ? 'index' : removeDotSlash(srcGlob)) +
    '{' + srcExtensions.join(',') + '}'

  const transpiledDir = joinPaths(pkgDir, transpiledSubdir)
  const srcDir = joinPaths(pkgDir, 'src')
  const srcPaths = await globby(massagedGlob, { cwd: srcDir })

  if (!srcPaths.length) {
    throw new Error(`Glob '${entryGlob}' does not exist in package '${pkgDir}'`)
  }

  for (const srcPath of srcPaths) {
    for (const srcExtension of srcExtensions) {
      if (srcPath.endsWith(srcExtension)) {
        const entrySrcAlias = srcPath.substring(0, srcPath.length - srcExtension.length)
        const entrySrcBase = joinPaths(transpiledDir, entrySrcAlias)
        const entrySrcPath = entrySrcBase + transpiledExtension
        let entryAlias = entrySrcAlias

        if (maybeSrcAlias) {
          if (entryGlob.includes('*')) {
            throw new Error('Cannot remap glob entrypoints to other src files just yet')
          } else {
            entryAlias = entryGlob.replace(/^\.\//, '')
          }
        }

        entryStructMap[entryAlias] = { entryGlob, entrySrcPath, entrySrcBase }
      }
    }
  }

  return entryStructMap
}

// Dynamically-Generated Entrypoint Content
// -------------------------------------------------------------------------------------------------

async function generateEntryStructMap(
  pkgDir: string,
  pkgJson: any,
  entryGlob: string,
  generatorSubpath: string,
  miscWatchPaths: string[], // pass-by-reference, modified
): Promise<EntryStructMap> {
  const generatorPath = joinPaths(pkgDir, generatorSubpath)
  const generatorExports = await import(generatorPath)
  const generatorFunc: GeneratorFunc = generatorExports.default

  if (typeof generatorFunc !== 'function') {
    throw new Error('Generator must have a default function export')
  }

  const generatorConfig = { pkgDir, entryGlob, log: pkgLog.bind(undefined, pkgJson.name) }
  const generatorRes = await generatorFunc(generatorConfig)

  const transpiledDir = joinPaths(pkgDir, transpiledSubdir)
  const entryStructMap: EntryStructMap = {}

  if (typeof generatorRes === 'string') {
    if (entryGlob.includes('*')) {
      throw new Error('Generator string output can\'t have glob entrypoint name')
    }

    const entryAlias = entryGlob === '.' ? 'index' : removeDotSlash(entryGlob)
    const entrySrcBase = joinPaths(transpiledDir, entryAlias)
    const entrySrcPath = entrySrcBase + transpiledExtension

    entryStructMap[entryAlias] = {
      entryGlob,
      entrySrcPath,
      entrySrcBase,
      content: generatorRes,
    }
  } else if (typeof generatorRes === 'object') {
    if (!entryGlob.includes('*')) {
      throw new Error('Generator object output must have glob entrypoint name')
    }

    for (const key in generatorRes) {
      const entryAlias = removeDotSlash(entryGlob).replace('*', key)
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

  miscWatchPaths.push(
    generatorPath,
    ...(generatorExports.getWatchPaths ? generatorExports.getWatchPaths(generatorConfig) : []),
  )

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

// External File Paths
// -------------------------------------------------------------------------------------------------

export function computeOwnExternalPaths(pkgBundleStruct: PkgBundleStruct): string[] {
  return Object.values(pkgBundleStruct.entryStructMap)
    .map((entryStruct) => entryStruct.entrySrcPath)
}

export function computeOwnIifeExternalPaths(
  currentEntryStruct: EntryStruct,
  pkgBundleStruct: PkgBundleStruct,
): string[] {
  const { entryStructMap, entryConfigMap } = pkgBundleStruct
  const currentGlobalVar = entryConfigMap[currentEntryStruct.entryGlob].global

  const iifeEntryStructMap = filterProps(entryStructMap, (entryStruct) => {
    const globalVar = entryConfigMap[entryStruct.entryGlob].global

    return Boolean(
      // not the current entrypoint
      entryStruct.entryGlob !== currentEntryStruct.entryGlob &&
      // has a global variable
      globalVar &&
      // not equal to or nested within current global var???
      (!currentGlobalVar || !(
        globalVar === currentGlobalVar ||
        globalVar.startsWith(currentGlobalVar + '.')
      )),
    )
  })

  return Object.values(iifeEntryStructMap)
    .map((entryStruct) => entryStruct.entrySrcPath)
}

// IIFE Browser Globals
// -------------------------------------------------------------------------------------------------

export function computeGlobalsVars(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
): GlobalVarMap {
  const allGlobalVars: GlobalVarMap = {}

  const { pkgJson, entryStructMap, entryConfigMap } = pkgBundleStruct
  const pkgName = pkgJson.name

  // scan the package's own unglobbed entrypoints
  for (const entryAlias in entryStructMap) {
    const { entrySrcPath, entryGlob } = entryStructMap[entryAlias]
    const globalVar = entryConfigMap[entryGlob].global

    if (globalVar) {
      const fullImportId = entryGlob === '.' ?
        pkgName :
        pkgName + '/' + entryAlias

      allGlobalVars[fullImportId] = globalVar
      allGlobalVars[entrySrcPath] = globalVar // add file path too
      allGlobalVars[entrySrcPath.replace(/\.js$/, '')] = globalVar // without .js
    }
  }

  const depDirs = computeLocalDepDirs(monorepoStruct, pkgJson)
  const depPkgJsons = depDirs.map((depDir) => monorepoStruct.pkgDirToJson[depDir])

  // scan the package's dependencies that live in the monorepo
  for (const depPkgJson of depPkgJsons) {
    const depPkgName = depPkgJson.name
    const depBuildConfig: PkgJsonBuildConfig = depPkgJson.buildConfig || {}
    const depExportsMap = depBuildConfig.exports || {}

    for (const exportId in depExportsMap) {
      const globalVar = depExportsMap[exportId].global

      if (globalVar) {
        if (exportId === '.') {
          allGlobalVars[depPkgName] = globalVar
        } else if (exportId.startsWith('./')) {
          allGlobalVars[depPkgName + exportId.substring(1)] = globalVar
        }
      }
    }
  }

  return allGlobalVars
}

// Utils
// -------------------------------------------------------------------------------------------------

function removeDotSlash(path: string): string {
  return path.replace(/^\.\//, '')
}
