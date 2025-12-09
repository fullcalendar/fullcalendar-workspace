import { join as joinPaths, basename } from 'path'

export interface PkgAnalysis {
  metaRootDir: string // where LICENSE lives
  pkgDir: string
  isBundle: boolean
  isTests: boolean
  isPublicMui: boolean // HACK
  isPublicTheme: boolean // HACK
}

export function analyzePkg(pkgDir: string): PkgAnalysis {
  const pkgDirName = basename(pkgDir)
  const isTests = pkgDirName === 'tests'
  const isBundle = pkgDirName === 'bundle'
  const metaRootDir = joinPaths(pkgDir, (isTests || isBundle) ? '..' : '../..')

  const isPublicMui = pkgDirName === 'ui-mui'
  const isPublicTheme = /theme-([A-Za-z]+)/.test(pkgDirName)

  return {
    metaRootDir,
    pkgDir,
    isTests,
    isBundle,
    isPublicMui,
    isPublicTheme,
  }
}
