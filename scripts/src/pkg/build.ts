import { join as joinPaths, basename } from 'path'
import { copyFile } from 'fs/promises'
import runBundler from './bundle.js' // TODO: better entrypoint
import runMeta from './meta.js' // TODO: better entrypoint

export default async function(...args: string[]) {
  const pkgDir = process.cwd()

  // TODO: best way to exclude?
  if (basename(pkgDir) !== 'tests') {
    await copyLicense(pkgDir)
    await copyReadme(pkgDir)
  }

  await runMeta(...args) // just for package.json (rename?)
  await runBundler(...args)
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
      : '../..'
  )
}
