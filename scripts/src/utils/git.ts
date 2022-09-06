import { live } from './exec'

/*
IMPORTANT: changes to a git repo must happen serially
*/

export async function assumeUnchanged(
  rootDir: string,
  files: string[],
  bool: boolean,
): Promise<void> {
  for (const file of files) {
    await live([
      'git',
      'update-index',
      bool ? '--assume-unchanged' : '--no-assume-unchanged',
      file,
    ], {
      cwd: rootDir,
    })
  }
}

export async function addAndCommit(
  rootDir: string,
  files: string[],
  message: string,
): Promise<boolean> {
  let isAnyStaged = false

  for (const file of files) {
    await live([
      'git', 'add', file,
    ], {
      cwd: rootDir,
    })

    const isFileStaged = await live([
      'git', 'diff', '--staged', '--quiet', file
    ], {
      cwd: rootDir,
    }).then(
      () => false, // success means NO changes
      () => true, // failure means there ARE changes
    )

    if (isFileStaged) {
      isAnyStaged = true
    }
  }

  if (isAnyStaged) {
    await live([
      'git', 'commit', '-m', message
    ], {
      cwd: rootDir,
    })
  }

  return isAnyStaged
}
