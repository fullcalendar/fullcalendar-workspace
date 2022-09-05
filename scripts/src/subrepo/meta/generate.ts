import * as path from 'path'
import { copyFile, writeFile } from 'fs/promises'
import { SubrepoConfig } from '../config'
import { createForEach, createCliConfig } from '../foreach'

export const cliConfig = createCliConfig()

export default createForEach(generateSubrepoMeta)

export interface SubrepoMetaConfig {
  rootDir: string
  subrepo: string
  subrepoDir: string
  subrepoConfig: SubrepoConfig
}

function generateSubrepoMeta(config: SubrepoMetaConfig): Promise<unknown> {
  const { subrepoConfig } = config
  const copyFiles = subrepoConfig.copyFiles || []
  const generateFiles = subrepoConfig.generateFiles || {}

  const promises = copyFiles.map((filePath) => {
    return copyFile(
      path.join(config.rootDir, filePath),
      path.join(config.subrepoDir, filePath),
    )
  })

  for (const filePath in generateFiles) {
    const generator = generateFiles[filePath]
    const res = generator(config)
    const promise = Promise.resolve<string | void>(res)

    promises.push(
      promise.then((contents: string | void) => {
        if (typeof contents === 'string') {
          return writeFile(
            path.join(config.subrepoDir, filePath),
            contents,
          )
        }
      })
    )
  }

  return Promise.all(promises)
}
