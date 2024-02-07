import { join as joinPaths } from 'path'
import { execCapture } from '@fullcalendar/standard-scripts/utils/exec'
import { fileExists } from '@fullcalendar/standard-scripts/utils/fs'

// Git utils
// -------------------------------------------------------------------------------------------------

// TEMPORARY. RENAME.
export async function queryGitSubmodulePkgs(monorepoDir: string): Promise<string[]> {
  let submoduleSubdirs = await queryGitSubmoduleDirs(monorepoDir)

  return await asyncFilter(submoduleSubdirs, (subdir) => {
    return fileExists(joinPaths(subdir, 'package.json'))
  })
}

// TEMPORARY. RENAME
async function queryGitSubmoduleDirs(monorepoDir: string): Promise<string[]> {
  return [
    'standard',
    'examples',
    'contrib/angular',
    'contrib/react',
    'contrib/vue2',
    'contrib/vue3',
  ]
}

// Lang utils
// -------------------------------------------------------------------------------------------------

async function asyncFilter<T = unknown>(
  arr: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}
