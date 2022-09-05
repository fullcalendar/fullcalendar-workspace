import makeDedicatedLockfile from '@pnpm/make-dedicated-lockfile'
import { SubrepoMetaConfig } from './generate'

export function generateSubdirLock(config: SubrepoMetaConfig): Promise<void> {
  return cjsInterop(makeDedicatedLockfile)(
    config.rootDir,
    config.subrepoDir,
  )
}

export function generateSubdirWorkspace(config: SubrepoMetaConfig): Promise<void> {
  console.log('TODO: generate workspace config in', config.subrepoDir)
  return Promise.resolve()
}

// TODO: tsx handles __esModule strangely (esModuleInterop). bug maintainer
// https://github.com/esbuild-kit/tsx/issues/67
function cjsInterop<Type>(input: Type): Type {
  return (input as any).default
}
