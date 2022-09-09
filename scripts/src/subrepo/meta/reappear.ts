import { parseSubrepoArgs, getAllMetaFiles, rootDir } from '../../utils/subrepo'
import { reappear } from '../../utils/git'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos } = await parseSubrepoArgs(rawArgs)

  await reappear(rootDir, getAllMetaFiles(subrepos))
}