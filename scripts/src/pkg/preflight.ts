import { join as joinPaths } from 'path'
import { access as accessFile, mkdir, writeFile } from 'fs/promises'
import { generateDistPkgMeta, readSrcPkgMeta, writeDistPkgMeta } from './meta.js'

export default async function() {
  const pkgDir = process.cwd()

  await runPkgPreflight(pkgDir)
}

export async function runPkgPreflight(pkgDir: string): Promise<void> {
  await ensureDistDir(pkgDir)

  return Promise.all([
    ensureDistMeta(pkgDir),
    ensureNpmIgnore(pkgDir),
  ]).then()
}

async function ensureDistDir(pkgDir: string): Promise<void> {
  const distDir = joinPaths(pkgDir, 'dist')

  if (!(await fileExists(distDir))) {
    await mkdir(distDir)
  }
}

async function ensureDistMeta(pkgDir: string): Promise<void> {
  const distJsonPath = joinPaths(pkgDir, 'dist', 'package.json')

  if (!(await fileExists(distJsonPath))) {
    const srcMeta = await readSrcPkgMeta(pkgDir)
    const distMeta = generateDistPkgMeta(srcMeta, true) // isDev=true
    await writeDistPkgMeta(pkgDir, distMeta)
  }
}

async function ensureNpmIgnore(pkgDir: string): Promise<void> {
  const npmIgnorePath = joinPaths(pkgDir, 'dist', '.npmignore')

  if (!(await fileExists(npmIgnorePath))) {
    await writeFile(npmIgnorePath, [
      '.tsc',
      'tsconfig.tsbuildinfo',
    ].join("\n"))
  }
}

// utils

function fileExists(path: string): Promise<boolean> {
  return accessFile(path).then(
    () => true,
    () => false,
  )
}
