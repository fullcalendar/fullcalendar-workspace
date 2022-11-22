import { join as joinPaths } from 'path'
import { execCapture } from '@fullcalendar/standard-scripts/utils/exec'
import { fileExists } from '@fullcalendar/standard-scripts/utils/fs'

// Git utils
// -------------------------------------------------------------------------------------------------

export async function queryGitSubmodulePkgs(monorepoDir: string): Promise<string[]> {
  let submoduleSubdirs = await queryGitSubmoduleDirs(monorepoDir)

  return await asyncFilter(submoduleSubdirs, (subdir) => {
    return fileExists(joinPaths(subdir, 'package.json'))
  })
}

async function queryGitSubmoduleDirs(monorepoDir: string): Promise<string[]> {
  const s = await execCapture(['git', 'submodule', 'status'], { cwd: monorepoDir })
  const lines = s.trim().split('\n')

  return lines.map((line) => {
    return line.trim().split(' ')[1]
  })
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
