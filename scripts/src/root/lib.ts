import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { capture } from '../utils/exec.js'

export const workspaceScriptsDir = joinPaths(fileURLToPath(import.meta.url), '../../..')
export const monorepoRootDir = joinPaths(workspaceScriptsDir, '..')

const pnpmPkgFilterArgs = ['--filter', './standard/**', '--filter', './premium/**']

export async function getNormalPkgDirs(): Promise<string[]> {
  const json = (await capture([
    'pnpm', 'list', '-r', '--depth', '-1', '--json', ...pnpmPkgFilterArgs
  ], {
    cwd: monorepoRootDir
  })).stdout

  const pkgObjs = JSON.parse(json)
  return pkgObjs.map((pkgObj: any) => pkgObj.path)
}
