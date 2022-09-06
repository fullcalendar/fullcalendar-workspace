import { live } from './exec'

/*
IMPORTANT: writes to a git repo must happen serially
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
    }).then(
      () => true, // success
      () => false, // will fail if not already committed. swallow error
    )
  }
}

export async function addAndCommit(
  rootDir: string,
  files: string[],
  message: string,
): Promise<boolean> {
  let isAnyStaged = false

  for (const file of files) {
    const isAdded = await live([
      'git', 'add', file,
    ], {
      cwd: rootDir,
      stdio: 'ignore', // silence error
    }).then(
      () => true, // success
      () => false, // will fail if dynamic generator didn't want to generate. swallow error
    )

    if (isAdded) {
      const isFileStaged = await live([
        'git', 'diff', '--quiet', '--staged', file
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
