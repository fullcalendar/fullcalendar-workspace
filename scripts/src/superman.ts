import * as path from 'path'
import { ScriptCliConfig } from './utils/script'
import { SubrepoScriptConfig, createForEach, createCliConfig } from './subrepo/foreach'

export const cliConfig: ScriptCliConfig = createCliConfig({
  whatever: Boolean,
})

export default createForEach((config: SubrepoScriptConfig<{ whatever: boolean }>) => {
  console.log('SUBREPO:::', path.join(config.rootDir, config.subrepo), config.flags.whatever)
})
