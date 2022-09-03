import { cli } from 'cleye'
import { outputStuff } from '@fullcalendar/standard-scripts/src/whatever'

export default async function(rawArgs: string[]) {
  const argv = cli({
    name: 'superman',
    parameters: [
      '<hero>'
    ]
  }, undefined, rawArgs)

  outputStuff(argv)
}
