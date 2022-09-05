import makeDedicatedLockfile from '@pnpm/make-dedicated-lockfile'
import { SubrepoMetaConfig } from './generate'

export function generateSubdirLock(config: SubrepoMetaConfig): Promise<void> {
  return makeDedicatedLockfile(
    config.rootDir,
    config.subrepoDir,
  )
}

export function generateSubdirWorkspace(config: SubrepoMetaConfig): Promise<void> {
  console.log('TODO: generate workspace config in', config.subrepoDir)
  return Promise.resolve()
}
