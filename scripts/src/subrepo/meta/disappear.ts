import { parseSubrepoArgs, getAllMetaFiles, rootDir } from '../../utils/subrepo.js'
import { disappear } from '../../utils/git.js'

// somehow call this ASAP, on installation

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos } = await parseSubrepoArgs(rawArgs)

  await disappear(rootDir, getAllMetaFiles(subrepos))
}
