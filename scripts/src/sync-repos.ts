import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'

/*
Should be renamed to "push-to-subrepos"
*/
export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  // Push standard and examples to their configured branches. Fails if our copies are not up-to-date
  for (const subdir of ['standard', 'examples']) {
    await execLive([gitSubrepoBin, 'push', subdir])
  }

  // Push the git-subrepo meta-file updates back to our remote
  await execLive(['git', 'push'])
}
