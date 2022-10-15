import { dirname } from 'path'
import { ExecError, execSilent } from '../../../lib/exec.js'

export function assumeUnchanged(path: string, toggle = true): Promise<void> {
  return execSilent([
    'git', 'update-index',
    toggle ? '--assume-unchanged' : '--no-assume-unchanged',
    path,
  ], {
    cwd: dirname(path),
  })
}

export function checkoutFile(path: string): Promise<void> {
  return execSilent([
    'git', 'checkout', '--', path,
  ], {
    cwd: dirname(path),
  })
}

export function addFile(path: string): Promise<void> {
  return execSilent([
    'git', 'add', path,
  ], {
    cwd: dirname(path),
  })
}

export function commitDir(dir: string, message: string): Promise<void> {
  return execSilent([
    'git', 'commit', '-m', message,
  ], {
    cwd: dir,
  })
}

export function isStaged(path: string): Promise<boolean> {
  return execSilent([
    'git', 'diff', '--quiet', '--staged', path, // implies --exit-code
  ], {
    cwd: dirname(path),
  }).then(
    () => false, // 0 exitCode means no difference
    (execError: ExecError) => execError.exitCode === 1, // 1 exitCode means difference
  )
}

// utils

export function boolSuccess(promise: Promise<any>): Promise<boolean> {
  return promise.then(
    () => true,
    () => false,
  )
}
