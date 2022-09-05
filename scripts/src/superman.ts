import * as path from 'path'
import { ScriptCliConfig } from './utils/script'
import { createForEach, createCliConfig } from './subrepo/foreach'
import { SubrepoScriptConfig } from './utils/subrepo'

export const cliConfig: ScriptCliConfig = createCliConfig({
  whatever: Boolean,
})

export default createForEach((config: SubrepoScriptConfig<{ whatever: boolean }>) => {
  console.log('SUBREPO:::', path.join(config.rootDir, config.subrepo), config.flags.whatever)
})
