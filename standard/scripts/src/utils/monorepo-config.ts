import { join as joinPaths } from 'path'
import { MonorepoStruct } from './monorepo-struct.js'

export function getArchiveRootDirs(monorepoStruct: MonorepoStruct): string[] {
  const { monorepoDir, monorepoPkgJson } = monorepoStruct
  const archiveSubtrees: string[] | undefined = monorepoPkgJson.monorepoConfig?.archiveSubtrees

  if (archiveSubtrees) {
    return archiveSubtrees.map((subdir) => joinPaths(monorepoDir, subdir))
  } else {
    return [monorepoDir]
  }
}

export function refineFilterArgs(args: string[], monorepoStruct: MonorepoStruct): string[] {
  const isAllIndex = args.indexOf('--all')
  const isAll = isAllIndex !== -1

  if (isAll) {
    args = args.slice()
    args.splice(isAllIndex, 1)
  } else {
    const monorepoConfig = monorepoStruct.monorepoPkgJson.monorepoConfig || {}
    const filterSubtrees: string[] = monorepoConfig.filterSubtrees || ['.']

    args = args.concat(filterSubtrees.map((subdir) => `--filter=${subdir}/**`))
  }

  return args
}
