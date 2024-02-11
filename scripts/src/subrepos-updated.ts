import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'
import { getSubrepos } from './meta/utils.js'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  await execLive([gitSubrepoBin, 'fetch', '--all'])
  console.log()

  const subrepos = await getSubrepos(monorepoDir)
  let errorCnt = 0

  for (const subdir in subrepos) {
    const subrepo = subrepos[subdir]
    const pulledCommit = subrepo['pulled-commit']
    const upstreamRef = subrepo['upstream-ref']

    if (!pulledCommit || !upstreamRef || pulledCommit !== upstreamRef) {
      errorCnt++
      console.error(
        `Subrepo '${subdir}' is not up-to-date with remote (${pulledCommit} <- ${upstreamRef})`,
      )
    }
  }

  if (errorCnt) {
    process.exit(1)
  }

  console.log('All subrepos up-to-date')
  console.log()
}
