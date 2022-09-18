import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import karma from 'karma'

const thisPkgRoot = joinPaths(fileURLToPath(import.meta.url), '../..')

export default function(...args: string[]) {
  const dev = args.indexOf('--dev') !== -1
  const configPath = joinPaths(thisPkgRoot, './karma.config.cjs')

  // see https://karma-runner.github.io/6.4/dev/public-api.html
  return karma.config.parseConfig(
    configPath,
    {
      singleRun: !dev,
      autoWatch: dev,
      browsers: !dev ? [ 'ChromeHeadless_custom' ] : [],
    },
    {
      promiseConfig: true,
      throwErrors: true
    }
  ).then((karmaConfig) => {
    return new Promise<karma.Server>((resolve, reject) => {
      const server = new karma.Server(karmaConfig, function(exitCode) {
        if (exitCode === 0) {
          resolve(server)
        } else {
          reject()
        }
      })
      server.start()
      // TODO: handle SIGINT? seems to keep running after Ctrl+C
    })
  })
}
