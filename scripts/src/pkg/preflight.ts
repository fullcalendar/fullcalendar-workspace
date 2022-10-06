import { join as joinPaths } from 'path'
import { access as accessFile, mkdir, writeFile } from 'fs/promises'
import { generateDistPkgMeta, getSubrepoInfo, readSrcPkgMeta, SrcPkgMeta, writeDistPkgMeta } from './meta.js'

export default async function() {
  const pkgDir = process.cwd()

  await runPkgPreflight(pkgDir)
}

export async function runPkgPreflight(pkgDir: string): Promise<void> {
  const srcMeta = await readSrcPkgMeta(pkgDir)

  // TODO: more DRY with meta's main
  if (
    srcMeta.buildConfig &&
    srcMeta.publishConfig?.linkDirectory
  ) {
    await ensureDistDir(pkgDir)
    await Promise.all([
      ensureDistMeta(pkgDir, srcMeta),
      ensureNpmIgnore(pkgDir),
    ])
  }
}

async function ensureDistDir(pkgDir: string): Promise<void> {
  const distDir = joinPaths(pkgDir, 'dist')

  if (!(await fileExists(distDir))) {
    await mkdir(distDir)
  }
}

/*
TODO: read baseMeta only once in preflight
*/
async function ensureDistMeta(pkgDir: string, srcMeta: SrcPkgMeta): Promise<void> {
  const distJsonPath = joinPaths(pkgDir, 'dist', 'package.json')

  if (!(await fileExists(distJsonPath))) {
    const subrepoInfo = await getSubrepoInfo(pkgDir)
    const distMeta = generateDistPkgMeta(subrepoInfo, srcMeta, true) // isDev=true
    await writeDistPkgMeta(pkgDir, distMeta)
  }
}

async function ensureNpmIgnore(pkgDir: string): Promise<void> {
  const npmIgnorePath = joinPaths(pkgDir, 'dist', '.npmignore')

  if (!(await fileExists(npmIgnorePath))) {
    await writeFile(npmIgnorePath, [
      '.tsc',
      'tsconfig.tsbuildinfo',
    ].join('\n'))
  }
}

// utils

function fileExists(path: string): Promise<boolean> {
  return accessFile(path).then(
    () => true,
    () => false,
  )
}
