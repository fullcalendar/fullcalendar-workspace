import { live } from '../utils/exec'
import { SubrepoScriptConfig, createForEach, createCliConfig } from './foreach'

export const cliConfig = createCliConfig({
  sup: Boolean
})

export default createForEach((config: SubrepoScriptConfig<{ sup: true }>) => {
  if (config.flags.sup) {
    console.log('sup dude')
  } else {
    return live(['git', 'status'], { cwd: config.cwd })
  }
})
