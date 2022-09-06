import * as path from 'path'
import { rm } from 'fs/promises'
import { runEach } from '../../utils/script'
import { getSubrepoConfig, getSubrepoDir, parseSubrepoArgs } from '../../utils/subrepo'

export default function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)

  return runEach((subrepo: string) => {
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
    )
  }, subrepos)
}
