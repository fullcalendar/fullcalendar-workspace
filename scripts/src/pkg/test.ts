import { join as joinPaths } from 'path'
import karma from 'karma'
import { monorepoScriptsDir } from '../utils/script-runner.js'

export default function(...args: string[]) {
  const isDev = args.includes('--dev')
  const configPath = joinPaths(monorepoScriptsDir, './config/karma.cjs')

  // use CWD
  // howto: https://karma-runner.github.io/6.4/dev/public-api.html
  return karma.config.parseConfig(
    configPath,
    {
      singleRun: !isDev,
      autoWatch: isDev,
      browsers: !isDev ? ['ChromeHeadless_custom'] : [],
      client: { args }, // access via `window.__karma__.config.args`
    },
    {
      promiseConfig: true,
      throwErrors: true,
    },
  ).then((karmaConfig) => {
    return new Promise<void>((resolve, reject) => {
      const server = new karma.Server(karmaConfig, function(exitCode) {
        if (exitCode === 0) {
          resolve()
        } else {
          reject()
        }
      })
      server.start()
    })
  })
}
