import * as path from 'path'
import { copyFile, writeFile } from 'fs/promises'
import { createForEach, createCliConfig, SubrepoScriptConfig } from '../foreach'

export const cliConfig = createCliConfig()

export default createForEach(generateSubrepoMeta)

function generateSubrepoMeta(config: SubrepoScriptConfig<{}>): Promise<unknown> {
  const metaFiles = config.subrepoConfig.metaFiles || []

  const promises = metaFiles.map((fileInfo) => {
    if (fileInfo.generator) {
      const res = fileInfo.generator(config)
      const promise = Promise.resolve<string | void>(res)

      return promise.then((contents: string | void) => {
        if (typeof contents === 'string') {
          return writeFile(
            path.join(config.subrepoDir, fileInfo.path),
            contents,
          )
        }
      })
    } else {
      return copyFile(
        path.join(config.rootDir, fileInfo.path),
        path.join(config.subrepoDir, fileInfo.path),
      )
    }
  })

  return Promise.all(promises)
}
