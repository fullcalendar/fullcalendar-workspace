import { outputStuff } from '@fullcalendar/standard-scripts/src/whatever'
import { ScriptCliConfig, ScriptConfig } from './utils/script'

export const cliConfig: ScriptCliConfig = {
  parameters: [
    '<hero>'
  ],
  flags: {
    'force': Boolean,
  }
}

export default async function(config: ScriptConfig<{}, {}>) {
  outputStuff(config)
}
