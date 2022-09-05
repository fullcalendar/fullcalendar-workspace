import * as path from 'path'
import { rm } from 'fs/promises'
import { createForEach, createCliConfig, SubrepoScriptConfig } from '../foreach'

export const cliConfig = createCliConfig()

export default createForEach(cleanSubrepoMeta)

function cleanSubrepoMeta(config: SubrepoScriptConfig<{}>): Promise<unknown> {
  const metaFiles = config.subrepoConfig.metaFiles || []

  const promises = metaFiles.map((fileInfo) => {
    return rm(
      path.join(config.subrepoDir, fileInfo.path),
      { force: true },
    )
  })

  return Promise.all(promises)
}
