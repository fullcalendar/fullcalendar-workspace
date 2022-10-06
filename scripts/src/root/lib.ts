import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { capture, live } from '../utils/exec.js'

export const workspaceScriptsDir = joinPaths(fileURLToPath(import.meta.url), '../../..')
export const monorepoRootDir = joinPaths(workspaceScriptsDir, '..')
export const filterArgs = [
  '--filter', './scripts',
  '--filter', './standard/**',
  '--filter', './premium/**',
]

export async function getOurPkgDirs(): Promise<string[]> {
  const json = (await capture([
    'pnpm', 'list', '-r', '--depth', '-1', '--json', ...filterArgs
  ], {
    cwd: monorepoRootDir
  })).stdout

  const pkgObjs = JSON.parse(json)
  return pkgObjs.map((pkgObj: any) => pkgObj.path)
}

export async function runTurboTask(taskName: string, args: string[] = []) {
  await live([
    joinPaths(workspaceScriptsDir, 'node_modules/turbo/bin/turbo'),
    'run', taskName, ...args, ...filterArgs,
  ], {
    cwd: monorepoRootDir, // will use turbo.json config
  })
}
