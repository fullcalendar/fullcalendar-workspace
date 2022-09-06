import chalk from 'chalk'
import { live } from '../utils/exec'
import { getBranch } from '../utils/git'
import { run } from '../utils/script'
import { getSubrepoConfig, parseSubrepoArgs, rootConfig, rootDir } from '../utils/subrepo'

export default async function(...rawArgs: string[]) {
  const { subrepos, flags } = parseSubrepoArgs(rawArgs, {
    'no-meta': Boolean,
  })

  const currentBranch = await getBranch(rootDir)
  if (currentBranch !== rootConfig.branch) {
    throw new Error(`Must be on branch '${rootConfig.branch}' to push`)
  }

  if (flags['no-meta']) {
    console.log()
    console.log(chalk.blueBright('Will not update meta files'))
    console.log()
  } else {
    await run('subrepo:meta:update', subrepos)
  }

  for (const subrepo of subrepos) {
    const subrepoConfig = getSubrepoConfig(subrepo)
    const remoteBranch = subrepoConfig.branchOverride || rootConfig.branch

    await live([
      'git', 'subtree', 'push', '--prefix', subrepo, subrepoConfig.remote, remoteBranch,
    ], {
      cwd: rootDir,
    })
  }
}
