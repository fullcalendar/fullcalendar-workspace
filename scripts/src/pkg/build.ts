import { join as joinPaths, basename } from 'path'
import { copyFile, rm } from 'fs/promises'
import { globby } from 'globby'
import runBundler from './bundle.js' // TODO: better entrypoint
import runMeta from './meta.js' // TODO: better entrypoint

export default async function(...args: string[]) {
  const pkgDir = process.cwd()

  await cleanOldFiles(pkgDir)

  // TODO: best way to exclude?
  if (basename(pkgDir) !== 'tests') {
    await copyLicense(pkgDir)
    await copyReadme(pkgDir)
  }

  await runMeta(...args) // just for package.json (rename?)
  await runBundler(...args)
}

async function cleanOldFiles(pkgDir: string): Promise<void> {
  const distDir = joinPaths(pkgDir, 'dist')
  const topLevelFiles = await globby(
    ['*', '!.tsc'],
    { cwd: distDir },
  )
  return Promise.all(
    topLevelFiles.map((topLevelFile) => rm(topLevelFile)),
  ).then()
}

async function copyLicense(pkgDir: string): Promise<void> {
  await copyFile(
    joinPaths(getSubrepoDir(pkgDir), 'LICENSE.md'),
    joinPaths(pkgDir, 'dist', 'LICENSE.md'),
  )
}

async function copyReadme(pkgDir: string): Promise<void> {
  await copyFile(
    joinPaths(pkgDir, 'README.md'),
    joinPaths(pkgDir, 'dist', 'README.md'),
  )
}

/*
TODO: rename? 'premium' is not a subrepo
*/
function getSubrepoDir(pkgDir: string): string {
  return joinPaths(
    pkgDir,
    basename(pkgDir) === 'bundle'
      ? '..'
      : '../..',
  )
}
