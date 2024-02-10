
export function readLockfile(lockfileDir: string, ignoreIncompatible?: boolean)
export function writeLockfile(lockfileDir: string, lockfile: any)

export function makeDedicatedLockfile(
  lockfileDir: string,
  projectDir: string,
  verbose?: boolean,
)

// UNRELATED
export function relinkLockfile(lockfileDir: string, lockfile: any, readManifest: any)
