import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import origPostinstall from '@fullcalendar/standard-scripts/postinstall'
import { hideMonorepoGhostFiles } from './subrepo/meta.js'

export default async function(this: ScriptContext) {
  await Promise.all([
    origPostinstall.call(this), // TODO: weird. use non-cli utility

    // while we sort out git-submodules...
    // hideMonorepoGhostFiles(this.monorepoStruct.monorepoDir),
  ])
}
