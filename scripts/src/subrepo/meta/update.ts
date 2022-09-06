import { run } from '../../utils/script'
import { addAndCommit } from '../../utils/git'
import { getAllMetaFiles, parseSubrepoArgs, rootDir } from '../../utils/subrepo'

export default async function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)
  const filePaths = getAllMetaFiles(subrepos)

  await run('subrepo:meta:reappear', subrepos)
  await run('subrepo:meta:clean', subrepos)
  await run('subrepo:meta:generate', subrepos)
  await addAndCommit(rootDir, filePaths, 'subrepo meta changes')
  await run('subrepo:meta:disappear', subrepos)
}
