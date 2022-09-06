import { live } from '../utils/exec'
import { getBranch } from '../utils/git'
import { getSubrepoConfig, parseSubrepoArgs, rootConfig, rootDir } from '../utils/subrepo'

export default async function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)

  const currentBranch = await getBranch(rootDir)
  if (currentBranch !== rootConfig.branch) {
    throw new Error(`Must be on branch '${rootConfig.branch}' to pull`)
  }

  // git write-operations must happen synchronously
  for (const subrepo of subrepos) {
    const subrepoConfig = getSubrepoConfig(subrepo)
    const remoteBranch = subrepoConfig.branchOverride || rootConfig.branch

    await live([
      'git', 'subtree', 'pull', '--prefix', subrepo, subrepoConfig.remote, remoteBranch, '--squash'
    ], {
      cwd: rootDir,
    })
  }
}
