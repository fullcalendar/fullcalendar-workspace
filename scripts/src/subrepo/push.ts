import chalk from 'chalk'
import { live } from '../utils/exec.js'
import { run } from '../utils/script.js'
import { parseSubrepoArgs, rootDir } from '../utils/subrepo.js'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos, flags } = await parseSubrepoArgs(rawArgs, {
    'no-meta': Boolean,
  })

  if (flags['no-meta']) {
    console.log()
    console.log(chalk.blueBright('Will not update meta files'))
    console.log()
  } else {
    await run('subrepo:meta:update', subrepos)
  }

  // `git subrepo push` causes write operations
  // git write-operations must happen synchronously
  for (const subrepo of subrepos) {
    await live([
      'git', 'subrepo', 'push', subrepo,
    ], {
      cwd: rootDir,
    })

    // clean temporary "worktrees" that prevent other operations from happening
    await live([
      'git', 'subrepo', 'clean', subrepo,
    ], {
      cwd: rootDir,
    })
  }
}
