import { RunConfig } from './run'

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

export interface SubrepoRunConfig extends RunConfig {
  rootDir: string
  subrepo: string
}
