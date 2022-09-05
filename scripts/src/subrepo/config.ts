import { SubrepoMetaConfig } from './meta/generate'

export interface SubrepoRootConfig {
  branch: string
  subrepos: { [subdir: string]: SubrepoConfig }
}

export type GeneratorFunc = (config: SubrepoMetaConfig) => void | Promise<void> | Promise<string>

export interface SubrepoConfig {
  remote: string,
  copyFiles?: string[],
  generateFiles?: { [filename: string]: GeneratorFunc }
  branchOverride?: string
}
