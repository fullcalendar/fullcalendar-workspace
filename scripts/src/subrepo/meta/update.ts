import chalk from 'chalk'
import { run } from '../../utils/script.js'
import { addAndCommit } from '../../utils/git.js'
import { getAllMetaFiles, parseSubrepoArgs, rootDir } from '../../utils/subrepo.js'

export default async function(...rawArgs: string[]): Promise<void> {
  const { subrepos, flags } = await parseSubrepoArgs(rawArgs, {
    'no-commit': Boolean,
  })

  await run('subrepo:meta:reappear', subrepos)
  await run('subrepo:meta:clean', subrepos)
  await run('subrepo:meta:generate', subrepos)

  if (flags['no-commit']) {
    console.log()
    console.log(chalk.blueBright('Files are staged but not committed.'))
    console.log(chalk.blueBright('You will eventually need to run "subrepo:meta:disappear"'))
    console.log()
  } else {
    const filePaths = getAllMetaFiles(subrepos)
    await addAndCommit(rootDir, filePaths, 'subrepo meta changes')
    await run('subrepo:meta:disappear', subrepos)
  }
}
