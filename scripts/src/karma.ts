import chalk from 'chalk'
import { ScriptContext } from './utils/script-runner.js'
import { createKarmaServer, untilKarmaSuccess } from './pkg/karma.js'
import { wait } from './utils/lang.js'

export default async function(this: ScriptContext, ...cliArgs: string[]) {
  const isDev = cliArgs.includes('--dev')
  const { monorepoStruct } = this
  const { pkgDirToJson } = monorepoStruct

  for (const pkgDir in pkgDirToJson) {
    const pkgJson = pkgDirToJson[pkgDir]

    if (pkgJson.karmaConfig) {
      const server = await createKarmaServer({ pkgDir, pkgJson, isDev, cliArgs })

      console.log()
      console.log(chalk.green(pkgJson.name))
      console.log()

      if (!isDev) {
        server.start()
        await untilKarmaSuccess(server)
      } else {
        await server.start()
        await wait(100) // let logging flush
      }
    }
  }
}
