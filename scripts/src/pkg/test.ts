import { join as joinPaths } from 'path'
import karma from 'karma'
import buildKarmaConfig from '../../config/karma.js'

export default function(...args: string[]) {
  const pkgDir = process.cwd()
  const isDev = args.includes('--dev')
  const distFile = joinPaths(pkgDir, 'dist/index.js')

  // karma JS API: https://karma-runner.github.io/6.4/dev/public-api.html
  return karma.config.parseConfig(
    undefined,
    buildKarmaConfig(
      [distFile],
      isDev,
      args,
    ),
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
