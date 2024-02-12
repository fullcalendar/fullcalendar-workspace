import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  // Try...
  await execLive([gitSubrepoBin, 'fetch', '--all'])

  console.log('TEST!!!0...')
  await execLive('git -v')

  console.log('TEST!!!1...')
  await execLive('git status')

  console.log('TEST!!!2...')
  await execLive('git show --stat 9dcb198e6428b5b1b8a98afee319e95e09c328b1')

  console.log('TEST!!!3...')
  await execLive('git show --stat HEAD')

  console.log('TEST!!!4...')
  await execLive('git diff 9dcb198e6428b5b1b8a98afee319e95e09c328b1..HEAD')

  console.log('TEST!!!5...')
  await execLive('git rev-list --reverse --ancestry-path --topo-order 9dcb198e6428b5b1b8a98afee319e95e09c328b1..HEAD')

  // Push to subrepos. Will fail if our copies are not up-to-date
  await execLive([gitSubrepoBin, 'push', '--all'])

  // Push the git-subrepo meta-file updates back to our remote
  await execLive(['git', 'push'])
}
