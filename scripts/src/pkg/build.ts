import { join as joinPaths } from 'path'
import { copyFile, rm } from 'fs/promises'
import { globby } from 'globby'
import { writeDistPkgJson } from './json.js'
import { analyzePkg, PkgAnalysis } from '../utils/pkg-analysis.js'
import { ScriptContext } from '../utils/script-runner.js'
import { writeBundles } from './bundle.js'
import { compileTs, writeTsconfigs } from '../utils/monorepo-ts.js'
import { MonorepoStruct } from '../utils/monorepo-struct.js'

const distPathsToDelete = [
  '*',
  '!tsconfig.tsbuildinfo',
  '!.tsout',
]

export default async function(this: ScriptContext, ...args: string[]) {
  const { monorepoStruct } = this
  const pkgDir = this.cwd
  const isDev = args.includes('--dev')

  await buildPkg(pkgDir, monorepoStruct, isDev)
}

export async function buildPkg(pkgDir: string, monorepoStruct: MonorepoStruct, isDev = false) {
  const pkgJson = monorepoStruct.pkgDirToJson[pkgDir]
  const pkgAnalysis = analyzePkg(pkgDir)

  await deleteDistFiles(pkgDir)
  await writeTsconfigs(monorepoStruct, pkgDir)
  await writeDistPkgJson(pkgDir, pkgJson, isDev)

  // tsc needs tsconfig.json and package.json from above
  await compileTs(pkgDir)

  await Promise.all([
    writeBundles({ pkgJson, ...pkgAnalysis, isDev }),
    writeDistReadme(pkgDir),
    writeDistLicense(pkgAnalysis),
  ])
}

export async function writeDistReadme(pkgDir: string): Promise<void> {
  await copyFile(
    joinPaths(pkgDir, 'README.md'),
    joinPaths(pkgDir, 'dist', 'README.md'),
  )
}

export async function writeDistLicense(pkgAnalysis: PkgAnalysis): Promise<void> {
  await copyFile(
    joinPaths(pkgAnalysis.metaRootDir, 'LICENSE.md'),
    joinPaths(pkgAnalysis.pkgDir, 'dist', 'LICENSE.md'),
  )
}

async function deleteDistFiles(pkgDir: string): Promise<void> {
  const distDir = joinPaths(pkgDir, 'dist')
  const relPaths = await globby(distPathsToDelete, { cwd: distDir })

  await Promise.all(
    relPaths.map(async (relPath) => {
      await rm(
        joinPaths(distDir, relPath),
        { recursive: true },
      )
    }),
  )
}
