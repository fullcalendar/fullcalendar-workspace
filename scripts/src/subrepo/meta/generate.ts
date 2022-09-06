import * as path from 'path'
import { copyFile, writeFile } from 'fs/promises'
import { runEach } from '../../utils/script'
import { getSubrepoConfig, getSubrepoDir, parseSubrepoArgs, rootDir } from '../../utils/subrepo'

export default function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)

  return runEach((subrepo: string) => {
    const subrepoDir = getSubrepoDir(subrepo)
    const subrepoConfig = getSubrepoConfig(subrepo)
    const metaFiles = subrepoConfig.metaFiles || []

    return Promise.all(
      metaFiles.map(async (fileInfo) => {
        if (fileInfo.generator) {
          const contents = await fileInfo.generator(subrepo)

          if (typeof contents === 'string') {
            await writeFile(
              path.join(subrepoDir, fileInfo.path),
              contents,
            )
          }
        } else {
          await copyFile(
            path.join(rootDir, fileInfo.path),
            path.join(subrepoDir, fileInfo.path),
          )
        }
      })
    )
  }, subrepos)
}
