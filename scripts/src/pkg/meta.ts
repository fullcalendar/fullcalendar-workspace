import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'

interface BuildConfig {
  exports?: { [path: string]: ExportConfig }
  esm?: boolean
  cjs?: boolean
  types?: boolean
}

interface ExportConfig {
  typesPath?: string
  generator?: string
  esm?: boolean
  cjs?: boolean
  iife?: boolean | string
  types?: boolean
}

export default async function(...args: string[]) {
  const pkgDir = process.cwd()
  const isDev = args.indexOf('--dev') !== -1

  const srcMeta = await readSrcPkgMeta(pkgDir)
  const distMeta = generateDistPkgMeta(srcMeta, isDev)

  await writeDistPkgMeta(pkgDir, distMeta)
}

export function generateDistPkgMeta(srcMeta: any, isDev: boolean): any {
  const buildConfig: BuildConfig = srcMeta.buildConfig || {}
  const exportConfigs = buildConfig.exports || {}
  const defaultExportConfig = exportConfigs['.']

  if (!defaultExportConfig) {
    throw new Error('Must have default export')
  }

  const distMeta = { ...srcMeta }
  delete distMeta.scripts
  delete distMeta.devDependencies
  delete distMeta.buildConfig
  delete distMeta.publishConfig

  distMeta.main = 'index' + (
    (!isDev && (defaultExportConfig.cjs ?? buildConfig.cjs ?? true)) ? '.cjs' :
    (defaultExportConfig.esm ?? buildConfig.esm ?? true) ? '.mjs' :
    (defaultExportConfig.iife) ? '.js' : '' // TODO: otherwise throw error
  )

  if (defaultExportConfig.esm ?? buildConfig.esm ?? true) {
    distMeta.module = 'index.mjs'
  }
  if (defaultExportConfig.types ?? buildConfig.types ?? true) {
    distMeta.types = (isDev ? '.tsc/' : '') + 'index.d.ts'
  }

  const exportEntries: any = {
    './package.json': './package.json'
  }

  for (const exportPath in exportConfigs) {
    const exportConfig = exportConfigs[exportPath]

    if (
      !isDev ||
      exportPath === '.' ||
      exportConfig.typesPath
    ) {
      const entryFilePath = exportPath === '.' ? './index' : exportPath
      const exportEntry: any = {}

      if (exportConfig.cjs ?? buildConfig.cjs ?? true) {
        exportEntry.require = entryFilePath + '.cjs'
      }
      if (exportConfig.esm ?? buildConfig.esm ?? true) {
        exportEntry.import = entryFilePath + '.mjs'
      }
      if (exportConfig.types ?? buildConfig.types ?? true) {
        let typesPath = (exportConfig.typesPath || entryFilePath) + '.d.ts'

        if (isDev) {
          typesPath = typesPath.replace(/^\.\//, './.tsc/')
        }

        exportEntry.types = typesPath
      }
      if (exportConfig.iife) {
        exportEntry.default = entryFilePath + '.js'
      }

      exportEntries[exportPath] = exportEntry
    }
  }

  if (isDev) {
    const genericEntry: any = {}

    if (buildConfig.cjs ?? true) {
      genericEntry.require = './*.cjs'
    }
    if (buildConfig.esm ?? true) {
      genericEntry.import = './*.mjs'
    }
    if (buildConfig.types ?? true) {
      genericEntry.types = './.tsc/*.d.ts'
    }

    exportEntries['./*'] = genericEntry
  }

  distMeta.exports = exportEntries

  return distMeta
}

export async function readSrcPkgMeta(pkgDir: string): Promise<any> {
  const jsonPath = joinPaths(pkgDir, 'package.json')
  const srcJson = await readFile(jsonPath, 'utf8')
  const srcMeta = JSON.parse(srcJson)
  return srcMeta
}

export async function writeDistPkgMeta(pkgDir: string, distMeta: any): Promise<void> {
  const jsonPath = joinPaths(pkgDir, 'dist', 'package.json')
  const distJson = JSON.stringify(distMeta, undefined, 2)
  await writeFile(jsonPath, distJson)
}
