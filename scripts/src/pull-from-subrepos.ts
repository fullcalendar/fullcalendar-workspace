import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  // Push to subrepos. Will fail if our copies are not up-to-date
  await execLive([gitSubrepoBin, 'pull', '--all'])
}
