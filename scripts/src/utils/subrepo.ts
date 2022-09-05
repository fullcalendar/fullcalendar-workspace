import { ScriptConfig } from './script'

export interface SubrepoRootConfig {
  branch: string
  subrepos: { [subdir: string]: SubrepoConfig }
}

export interface SubrepoConfig {
  remote: string,
  copyFiles?: string[],
  generateFiles?: { [filename: string]: () => void | string }
  branchOverride?: string
}

export interface SubrepoScriptConfig<Flags> extends ScriptConfig<{}, Flags> {
  // can't accept ordered parameters. they are always subrepo names
  rootDir: string
  subrepo: string
}
