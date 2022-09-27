import { join as joinPaths } from 'path'
import { access as accessFile, mkdir, writeFile } from 'fs/promises'
import { runPkgMeta } from './meta.js'

export default async function() {
  const pkgDir = process.cwd()

  await runPkgPreflight(pkgDir)
}

export async function runPkgPreflight(pkgDir: string): Promise<void> {
  const distDir = joinPaths(pkgDir, 'dist')
  const distJsonPath = joinPaths(distDir, 'package.json')
  const npmIgnorePath = joinPaths(distDir, '.npmignore')

  if (!(await fileExists(distDir))) {
    await mkdir(distDir)
  }

  if (!(await fileExists(distJsonPath))) {
    await runPkgMeta(pkgDir, true) // isDev=true
  }

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
