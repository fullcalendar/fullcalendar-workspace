import * as path from 'path'
import { runEach } from '../../utils/script'
import { getSubrepoConfig, parseSubrepoArgs, rootDir } from '../../utils/subrepo'
import { addAndCommit, assumeUnchanged } from '../../utils/git'

export default async function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)
  const filePaths = getFilePaths(subrepos)

  // await assumeUnchanged(rootDir, filePaths, false)
  await runEach('subrepo:meta:clean', subrepos)
  await runEach('subrepo:meta:generate', subrepos)
  await addAndCommit(rootDir, filePaths, 'subrepo meta changes')
  // await assumeUnchanged(rootDir, filePaths, true)
}

function getFilePaths(subrepos: string[]): string[] {
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
