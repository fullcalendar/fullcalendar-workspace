import { outputStuff } from '@fullcalendar/standard-scripts/src/whatever'
import { CommandCliConfig, CommandConfig } from './utils/command'

export const cliConfig: CommandCliConfig = {
  parameters: [
    '<hero>'
  ],
  flags: {
    'force': Boolean,
  }
}

export default async function(config: CommandConfig<{}, {}>) {
  outputStuff(config)
}
