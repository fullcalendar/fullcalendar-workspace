import * as path from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from './script'
import rootConfig from '../../../subrepo.config'

export { rootConfig }
export const rootDir = path.join(fileURLToPath(import.meta.url), '../../../..')

export interface SubrepoRootConfig {
  branch: string
  subrepos: { [subdir: string]: SubrepoConfig }
}

export interface SubrepoConfig {
  remote: string,
  metaFiles: { path: string, generator?: SubrepoMetaGenerator }[]
  branchOverride?: string
}

export type SubrepoMetaGenerator = (subrepo: string) => Promise<string | void> | string | void

export function parseSubrepoArgs<
  Flags extends { [flag: string]: any } | undefined
>(
  rawArgs: string[],
  flagConfig?: Flags,
) {
  const { params, flags, unknownFlags } = parseArgs(rawArgs, {
    ...flagConfig,
    all: Boolean,
  } as Flags & { all: BooleanConstructor }, [
    '[subrepos...]'
  ])

  let subrepos: string[]

  if (flags.all) {
    subrepos = Object.keys(rootConfig.subrepos)
  } else if (params.length >= 1) {
    subrepos = Array.prototype.slice.call(params, 0)

    for (let subrepo of subrepos) {
      if (!(subrepo in rootConfig.subrepos)) {
        throw new Error(`Subrepo '${subrepo}' does not exist`)
      }
    }

  } else {
    throw new Error('Must specify individual subrepos or use the --all flag')
  }

  return { subrepos, flags, unknownFlags }
}

export function getSubrepoDir(subrepo: string): string {
  return path.join(rootDir, subrepo)
}

export function getSubrepoConfig(subrepo: string): SubrepoConfig {
  return rootConfig.subrepos[subrepo]
}

export function getAllMetaFiles(subrepos: string[]): string[] {
  const filePaths: string[] = []

  for (let subrepo of subrepos) {
    const subrepoConfig = getSubrepoConfig(subrepo)
    const fileInfos = subrepoConfig.metaFiles || []

    for (let fileInfo of fileInfos) {
      filePaths.push(path.join(subrepo, fileInfo.path))
    }
  }

  return filePaths
}
