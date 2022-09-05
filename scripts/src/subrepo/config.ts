import { SubrepoScriptConfig } from "./foreach"

export interface SubrepoRootConfig {
  branch: string
  subrepos: { [subdir: string]: SubrepoConfig }
}

export type GeneratorFunc = (config: SubrepoScriptConfig<{}>) => void | Promise<void> | Promise<string>

export interface SubrepoConfig {
  remote: string,
  metaFiles: { path: string, generator?: GeneratorFunc }[]
  branchOverride?: string
}
