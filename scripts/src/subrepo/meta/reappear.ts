import { parseSubrepoArgs, getAllMetaFiles, rootDir } from '../../utils/subrepo.js'
import { reappear } from '../../utils/git.js'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos } = await parseSubrepoArgs(rawArgs)

  await reappear(rootDir, getAllMetaFiles(subrepos))
}
