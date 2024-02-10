import { ScriptContext } from '@fullcalendar-scripts/standard/utils/script-runner'
import origPostinstall from '@fullcalendar-scripts/standard/postinstall'
import { hideMetaFiles } from './meta/hide.js'

export default async function(this: ScriptContext) {
  await Promise.all([
    origPostinstall.call(this), // TODO: weird. use non-cli utility

    // If in a GitHub Action running against a PR, it's not a real branch (just a commit)
    // and thus github-subrepo fails. We don't care about hiding these files in CI anyway.
    // They're just for ergonomic reasons while developing.
    !process.env.CI &&
      hideMetaFiles(process.cwd(), true), // silent=true
  ])
}
