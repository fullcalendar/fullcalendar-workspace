import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { MonorepoConfig } from '../pkg/meta.js'
import { capture } from '../utils/exec.js'

export const workspaceScriptsDir = joinPaths(fileURLToPath(import.meta.url), '../../..')

export function buildFilterArgs(monorepoConfig: MonorepoConfig): string[] {
  const relDirs: string[] = ['.'].concat(monorepoConfig.defaultSubtrees || [])
  const filterArgs: string[] = []

  for (let relDir of relDirs) {
    filterArgs.push(
      `--filter='${relDir}/**'`,
    )
  }

  return filterArgs
}

export async function getOurPkgDirs(
  monorepoDir: string,
  monorepoConfig: MonorepoConfig,
): Promise<string[]> {
  const json = (await capture([
    'pnpm', 'list', '-r', '--depth', '-1', '--json', ...buildFilterArgs(monorepoConfig),
  ], {
    cwd: monorepoDir,
  })).stdout

  const pkgObjs = JSON.parse(json)
  return pkgObjs.map((pkgObj: any) => pkgObj.path)
}
