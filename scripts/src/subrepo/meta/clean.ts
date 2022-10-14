import * as path from 'path'
import { rm } from 'fs/promises'
import { spawnParallel } from '../../utils/script.js'
import { getSubrepoDir, metaFileInfo, parseSubrepoArgs } from '../../utils/subrepo.js'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos, flagArgs } = await parseSubrepoArgs(rawArgs)

  return spawnParallel('.:each', subrepos, flagArgs)
}

export async function each(subrepo: string): Promise<void> {
  const subrepoDir = getSubrepoDir(subrepo)

  await Promise.all(
    metaFileInfo.map((fileInfo) => {
      return rm(
        path.join(subrepoDir, fileInfo.path),
        { force: true },
      )
    }),
  )
}
