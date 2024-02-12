import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  // // Try...
  // await execLive([gitSubrepoBin, 'fetch', '--all'])

  // Push to subrepos. Will fail if our copies are not up-to-date
  await execLive([gitSubrepoBin, 'push', '--all', '--debug'])

  // Push the git-subrepo meta-file updates back to our remote
  await execLive(['git', 'push'])
}
