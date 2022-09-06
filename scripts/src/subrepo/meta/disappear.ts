import { parseSubrepoArgs, getAllMetaFiles, rootDir } from '../../utils/subrepo'
import { disappear } from '../../utils/git'

export default async function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)
  await disappear(rootDir, getAllMetaFiles(subrepos))
}
