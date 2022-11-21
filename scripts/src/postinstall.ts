import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import origPostinstall from '@fullcalendar/standard-scripts/postinstall'

export default async function(this: ScriptContext) {
  await Promise.all([
    origPostinstall.call(this), // TODO: weird. use non-cli utility
  ])
}
