import * as path from 'path'
import { rm } from 'fs/promises'
import { live } from './exec.js'

/*
IMPORTANT: writes to a git repo must happen serially,
Accepting a files array in each function encourages this.
*/

export async function disappear(rootDir: string, files: string[]) {
  for (const file of files) {
    const wasInIndex = await live([
      'git', 'update-index', '--assume-unchanged', file,
    ], {
      cwd: rootDir,
      stdio: 'ignore', // silence error
    }).then(
      () => true, // success
      () => false, // will fail if not in index
    )

    if (wasInIndex) {
      await rm(
        path.join(rootDir, file),
        { force: true },
      )
    }
  }
}

export async function reappear(rootDir: string, files: string[]) {
  for (const file of files) {
    const wasInIndex = await live([
      'git', 'update-index', '--no-assume-unchanged', file,
    ], {
      cwd: rootDir,
      stdio: 'ignore', // silence error
    }).then(
      () => true, // success
      () => false, // will fail if not in index
    )

    if (wasInIndex) {
      // restore the file
      await live([
        'git', 'checkout', '--', file,
      ], {
        cwd: rootDir,
      })
    }
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
        'git', 'diff', '--quiet', '--staged', file,
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
      'git', 'commit', '-m', message,
    ], {
      cwd: rootDir,
    })
  }

  return isAnyStaged
}
