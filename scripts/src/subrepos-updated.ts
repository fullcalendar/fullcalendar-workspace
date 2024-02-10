import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'
import { getSubrepos } from './meta/utils.js'

export default async function() {
  const monorepoDir = process.cwd()
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  await execLive([gitSubrepoBin, 'fetch', '--all'])

  const subrepos = await getSubrepos(monorepoDir)

  for (const subdir in subrepos) {
    const subrepo = subrepos[subdir]
    const pulledCommit = subrepo['pulled-commit']
    const upstreamRef = subrepo['upstream-ref']

    if (!pulledCommit || !upstreamRef || pulledCommit !== upstreamRef) {
      throw new Error(
        `Subrepo '${subdir}' is not up-to-date with remote (${pulledCommit} <- ${upstreamRef})`
      )
    }
  }
}
