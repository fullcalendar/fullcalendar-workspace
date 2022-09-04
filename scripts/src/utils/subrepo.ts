
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
