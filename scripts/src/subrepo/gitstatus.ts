import { ScriptConfig } from '../utils/script'
import { live } from '../utils/exec'

export default function(config: ScriptConfig<{}, {}>) {
  live(['git', 'status'], { cwd: config.cwd })
}
