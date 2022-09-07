import { live } from '../utils/exec'
import { parseSubrepoArgs, rootDir } from '../utils/subrepo'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos } = await parseSubrepoArgs(rawArgs)

  // git write-operations must happen synchronously
  for (const subrepo of subrepos) {
    await live([
      'git', 'subrepo', 'pull', subrepo,
    ], {
      cwd: rootDir,
    })
  }
}
