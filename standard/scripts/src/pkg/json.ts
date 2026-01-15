import { join as joinPaths, relative as relativizePath } from 'path'
import { mkdir } from 'fs/promises'
import { analyzePkg } from '../utils/pkg-analysis.ts'
import { readPkgJson, writePkgJson } from '../utils/pkg-json.ts'
import { type ScriptContext } from '../utils/script-runner.ts'
import { esmExtension, iifeExtension } from './utils/config.ts'
import { type EntryConfigMap } from './utils/bundle-struct.ts'

const cdnFields = [
  'unpkg',
  'jsdelivr',
]

export default async function(this: ScriptContext, ...args: string[]) {
  const isDev = args.includes('--dev')
  const pkgDir = this.cwd
  const pkgJson = this.monorepoStruct.pkgDirToJson[pkgDir]

  await writeDistPkgJson(pkgDir, pkgJson, isDev)
}

/*
Ensures the dist directory is created
*/
export async function writeDistPkgJson(
  pkgDir: string,
  pkgJson: any,
  isDev: boolean,
): Promise<void> {
  const { buildConfig } = pkgJson

  if (!buildConfig) {
    throw new Error('Can only generate dist package.json for a buildConfig')
  }

  const pkgAnalysis = analyzePkg(pkgDir)
  const basePkgJson = await readPkgJson(pkgAnalysis.metaRootDir)
  const typesRoot = isDev ? './.tsout' : './esm' // TODO: make config var for .tsout?

  const entryConfigMap = buildConfig.exports as EntryConfigMap
  const exportsMap: any = {
    './package.json': './package.json',
  }

  const sideEffects: string[] = []
  let firstCdnPath: string | undefined

  for (const entryName in entryConfigMap) {
    const entryConfig = entryConfigMap[entryName]
    const entrySubpath = entryName === '.' ? './index' : entryName

    if (entryConfig.module) {
      const esmPath = entrySubpath.replace(/^\./, './esm') + esmExtension

      const typesPath =
        entryConfig.types
          ? typesRoot + '/' + entryConfig.types + '.d.ts'
          : entrySubpath.replace(/^\./, typesRoot) + '.d.ts'

      exportsMap[entryName] = {
        types: typesPath,
        default: esmPath,
      }

      if (entryConfig.iife) { // has side effects?
        sideEffects.push(esmPath)
      }
    }

    if (entryConfig.iife) {
      sideEffects.push(entrySubpath + iifeExtension)

      if (!isDev) {
        sideEffects.push(entrySubpath + '.min' + iifeExtension)

        if (!firstCdnPath) {
          firstCdnPath = entrySubpath + '.min' + iifeExtension
        }
      }
    }

    if (entryConfig.cssExtract) {
      const cssEntryName =
        typeof entryConfig.cssExtract === 'string'
          ? entryConfig.cssExtract
          : entryName

      exportsMap[cssEntryName + '.css'] = cssEntryName + '.css'

      if (entryConfig.cssAsJs) {
        exportsMap[cssEntryName + '.styles'] = cssEntryName + '.styles.js'
        sideEffects.push(cssEntryName + '.styles.js')
      }
    }
  }

  const finalPkgJson = {
    ...pkgJson, // hack to prefer key order of original file
    ...basePkgJson,
    ...pkgJson, // overrides base
    keywords:
      pkgJson.name.startsWith('@full-ui/') // HACK
        ? (pkgJson.keywords || basePkgJson.keywords || []) // don't merge
        : (basePkgJson.keywords || []).concat(pkgJson.keywords || []),
    types: `${typesRoot}/index.d.ts`,
    module: './esm/index' + esmExtension,
    main: './esm/index' + esmExtension,
    ...(
      firstCdnPath
        ? cdnFields.reduce(
            (props, cdnField) => Object.assign(props, {
              [cdnField]: firstCdnPath,
            }),
            {},
          )
        : {}
    ),
    exports: exportsMap,
  }

  // add typesVersions as a fallback for build systems that don't understand export maps
  if (isDev) {
    const typeVersionsEntryMap: any = {}

    // TODO: use mapProps
    for (const entryName in entryConfigMap) {
      const entryAlias = entryName.replace(/^\.\/?/, '') || 'index'

      typeVersionsEntryMap[entryAlias] = [`.tsout/${entryAlias}.d.ts`]
    }

    finalPkgJson.typesVersions = { '*': typeVersionsEntryMap }
  }

  if (pkgJson.sideEffects === undefined) {
    finalPkgJson.sideEffects = !sideEffects.length ? false : sideEffects
  }

  finalPkgJson.repository.directory =
    (basePkgJson.repository.directory ? `${basePkgJson.repository.directory}/` : '') +
    relativizePath(pkgAnalysis.metaRootDir, pkgDir)

  delete finalPkgJson.scripts
  delete finalPkgJson.devDependencies
  delete finalPkgJson.tsConfig
  delete finalPkgJson.buildConfig
  delete finalPkgJson.publishConfig
  delete finalPkgJson.private
  delete finalPkgJson.pnpm
  delete finalPkgJson.engines

  const distDir = joinPaths(pkgDir, 'dist')
  await mkdir(distDir, { recursive: true })
  await writePkgJson(distDir, finalPkgJson)
}
