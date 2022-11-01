import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import { pushSubrepo, querySubrepoSubdirs } from '../utils/git-subrepo.js'
import { updateGhostFiles } from './ghost-files.js'

export default async function(this: ScriptContext) {
  const monorepoDir = this.cwd
  const subdirs = await querySubrepoSubdirs(monorepoDir)

  await updateGhostFiles(monorepoDir, subdirs)

  for (const subdir of subdirs) {
    await pushSubrepo(monorepoDir, subdir)
  }
}
