import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  // Try...
  await execLive([gitSubrepoBin, 'fetch', '--all'])

  console.log('TEST!!!0...')
  await execLive('git status')

  console.log('TEST!!!1...')
  await execLive('git show HEAD')

  console.log('TEST!!!2...')
  await execLive('git show 290b11a7f965b5211ce9caf9df451fdf6fe1791e')

  console.log('TEST!!!3...')
  await execLive('git rev-list --reverse --ancestry-path --topo-order 290b11a7f965b5211ce9caf9df451fdf6fe1791e..HEAD')

  // Push to subrepos. Will fail if our copies are not up-to-date
  await execLive([gitSubrepoBin, 'push', '--all', '--DEBUG'])

  // Push the git-subrepo meta-file updates back to our remote
  await execLive(['git', 'push'])
}
