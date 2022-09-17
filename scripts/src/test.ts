import { join as joinPaths, resolve as resolvePath } from 'path'
import { fileURLToPath } from 'url'
import karma from 'karma'

const thisDir = joinPaths(fileURLToPath(import.meta.url), '..')
const isCi = false

export default function() {
  const configPath = joinPaths(thisDir, '../karma.config.cjs')
  const builtPath = resolvePath('./dist/index.js')

  // see https://karma-runner.github.io/6.4/dev/public-api.html
  return karma.config.parseConfig(
    configPath,
    {
      // basePath: '.',
      singleRun: isCi,
      autoWatch: !isCi,
      browsers: isCi ? [ 'ChromeHeadless_custom' ] : [],
      files: [builtPath],
      preprocessors: {
        [builtPath]: 'sourcemap'
      }
    },
    { promiseConfig: true, throwErrors: true }
  ).then((karmaConfig) => {
    return new Promise<karma.Server>((resolve, reject) => {
      const server = new karma.Server(karmaConfig, function(exitCode) {
        if (exitCode === 0) {
          resolve(server)
        } else {
          reject()
        }
      })
      // TODO: link with above Promise
      server.start()
    })
  })
}
