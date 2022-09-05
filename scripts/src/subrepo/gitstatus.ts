import { live } from '../utils/exec'
import { SubrepoScriptConfig } from '../utils/subrepo'
import { createForEach, createCliConfig } from './foreach'

export const cliConfig = createCliConfig({})

export default createForEach((config: SubrepoScriptConfig<{}>) => {
  return live(['git', 'status'], { cwd: config.cwd })
})
