import { join as joinPaths, basename } from 'path'
import { copyFile, rm } from 'fs/promises'
import { globby } from 'globby'
import runBundler from './bundle.js' // TODO: better entrypoint
import runMeta from './meta.js' // TODO: better entrypoint

export default async function(...args: string[]) {
  const pkgDir = process.cwd()

  const isWatchLazy = process.env.BUILD_WATCH_LAZY === '1'
  const isWatch = args.indexOf('--watch') !== -1 || isWatchLazy
  const isDev = args.indexOf('--dev') !== -1 || process.env.BUILD_ENV === 'dev'

  console.log('flags', {
    isDev,
    isWatch,
    isWatchLazy,
  })

  if (isWatch) {
    throw new Error('Watch not implemented yet')
  }

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
  const relPaths = await globby(
    ['*', '!.tsout'],
    { cwd: distDir },
  )
  await Promise.all(
    relPaths.map(async (relPath) => {
      await rm(
        joinPaths(distDir, relPath),
        { recursive: true },
      )
    }),
  )
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
