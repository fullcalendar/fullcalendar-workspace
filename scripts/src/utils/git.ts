import { live } from './exec'
import { getSubrepoConfig, getSubrepoDir } from './subrepo'

/*
IMPORTANT: changes to a git repo must happen serially
*/

export function forgetSubrepoMeta(subrepo: string): Promise<void> {
  return toggleSubrepoMeta(subrepo, false)
}

export function rememberSubrepoMeta(subrepo: string): Promise<void> {
  return toggleSubrepoMeta(subrepo, true)
}

async function toggleSubrepoMeta(subrepo: string, bool: boolean): Promise<void> {
  const subrepoDir = getSubrepoDir(subrepo)
  const subrepoConfig = getSubrepoConfig(subrepo)
  const metaFiles = subrepoConfig.metaFiles || []

  for (const fileInfo of metaFiles) {
    await live([
      'git',
      'update-index',
      bool ? '--no-assume-unchanged' : '--assume-unchanged',
      fileInfo.path,
    ], {
      cwd: subrepoDir,
    })
  }
}

export async function stageSubrepoMeta(subrepo: string): Promise<boolean> {
  const subrepoDir = getSubrepoDir(subrepo)
  const subrepoConfig = getSubrepoConfig(subrepo)
  const metaFiles = subrepoConfig.metaFiles || []
  let wasStaged = false

  for (const fileInfo of metaFiles) {
    await live([
      'git', 'add', fileInfo.path,
    ], {
      cwd: subrepoDir,
    })

    const fileWasStaged = await live([
      'git', 'diff', '--staged', '--quiet', fileInfo.path
    ], {
      cwd: subrepoDir,
    }).then(
      () => false, // success means NO changes
      () => true, // failure means there ARE changes
    )

    if (fileWasStaged) {
      wasStaged = true
    }
  }

  return wasStaged
}

/*
only call if certain there are staged changes
*/
export async function commitSubrepoMeta(rootDir: string): Promise<void> {
  return live([
    'git', 'commit', '-m', 'subrepo meta changes',
  ], {
    cwd: rootDir,
  })
}
