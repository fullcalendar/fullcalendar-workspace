import * as path from 'path'
import { rm } from 'fs/promises'
import { spawnParallel } from '../../utils/script'
import { getSubrepoConfig, getSubrepoDir, parseSubrepoArgs } from '../../utils/subrepo'

export default function(...rawArgs: string[]): Promise<void> {
  const { subrepos, flagArgs } = parseSubrepoArgs(rawArgs)
  return spawnParallel('.:each', subrepos, flagArgs)
}

export function each(subrepo: string): Promise<void> {
  const subrepoDir = getSubrepoDir(subrepo)
  const subrepoConfig = getSubrepoConfig(subrepo)
  const metaFiles = subrepoConfig.metaFiles || []

  return Promise.all(
    metaFiles.map((fileInfo) => {
      return rm(
        path.join(subrepoDir, fileInfo.path),
        { force: true },
      )
    })
  ).then()
}
