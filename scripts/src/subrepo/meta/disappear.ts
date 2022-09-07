import { parseSubrepoArgs, getAllMetaFiles, rootDir } from '../../utils/subrepo'
import { disappear } from '../../utils/git'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos } = await parseSubrepoArgs(rawArgs)

  await disappear(rootDir, getAllMetaFiles(subrepos))
}
