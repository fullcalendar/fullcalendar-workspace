import { ScriptContext } from '@fullcalendar-scripts/standard/utils/script-runner'
import origPostinstall from '@fullcalendar-scripts/standard/postinstall'
import { hideMetaFiles } from './meta/hide.js'

export default async function(this: ScriptContext) {
  await Promise.all([
    origPostinstall.call(this), // TODO: weird. use non-cli utility
    hideMetaFiles(process.cwd(), true), // silent=true
  ])
}
