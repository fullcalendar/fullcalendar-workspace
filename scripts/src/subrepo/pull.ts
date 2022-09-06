import { getSubrepoConfig, parseSubrepoArgs, rootConfig, rootDir } from '../utils/subrepo'
import { getBranch } from '../utils/git'
import { live } from '../utils/exec'

export default async function(...rawArgs: string[]) {
  const { subrepos } = parseSubrepoArgs(rawArgs)
  const currentBranch = await getBranch(rootDir)

  if (currentBranch !== rootConfig.branch) {
    throw new Error(`Must be on branch '${rootConfig.branch}' to pull`)
  }

  for (const subrepo of subrepos) {
    const subrepoConfig = getSubrepoConfig(subrepo)
    const branch = subrepoConfig.branchOverride || rootConfig.branch

    await console.log([
      'git', 'subtree', 'pull', '--prefix', subrepo, subrepoConfig.remote, branch, '--squash'
    ].join(' '), {
      cwd: rootDir,
    })
  }
}
