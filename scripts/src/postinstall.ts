import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import origPostinstall from '@fullcalendar/standard-scripts/postinstall'
import { hideMetaFiles } from './meta/hide.js'

export default async function(this: ScriptContext) {
  await Promise.all([
    origPostinstall.call(this), // TODO: weird. use non-cli utility
    hideMetaFiles(process.cwd(), true), // silent=true
  ])
}
