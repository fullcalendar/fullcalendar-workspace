import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'
import { execCapture } from './exec.js'

export const queryPkgDirMap = cacheableByDir(readPkgDirMap)
export const queryPkgJson = cacheableByDir(readPkgJson)

async function readPkgDirMap(monorepoDir) {
  const monorepoPkgJsonObj = await queryPkgJson(monorepoDir)
  const monorepoConfig = monorepoPkgJsonObj.monorepoConfig || {}
  const pkgDirMap = {}

  const pkgObjs = JSON.parse(
    await execCapture([
      'pnpm', 'list', '-r', '--depth', '-1', '--json',
      ...buildFilterArgs(monorepoConfig),
    ], {
      cwd: monorepoDir,
    }),
  )

  for (let pkgObj of pkgObjs) {
    pkgDirMap[pkgObj.name] = pkgObj.path
  }

  return pkgDirMap
}

export function buildFilterArgs(monorepoConfig) {
  const relDirs = ['./scripts'].concat(monorepoConfig.defaultSubtrees || [])
  const filterArgs = []

  for (let relDir of relDirs) {
    filterArgs.push('--filter', `${relDir}/**`)
  }

  return filterArgs
}

async function readPkgJson(pkgDir) {
  const jsonPath = joinPaths(pkgDir, 'package.json')
  const json = await readFile(jsonPath, 'utf8')
  return JSON.parse(json)
}

function cacheableByDir(func) {
  const cacheByDir = {}

  return function(dir) {
    return cacheByDir[dir] || (cacheByDir[dir] = func.apply(this, arguments))
  }
}
