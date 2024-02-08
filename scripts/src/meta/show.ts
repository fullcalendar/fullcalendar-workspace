import { join as joinPaths } from 'path'
import { assumeUnchanged, checkoutFile } from '@fullcalendar-scripts/standard/utils/git'
import { boolPromise } from '@fullcalendar-scripts/standard/utils/lang'
import { querySubrepoPkgs } from './utils.js'
import { allSubpaths } from './config.js'

export default async function() {
  const monorepoDir = process.cwd()
  const subrepoSubdirs = await querySubrepoPkgs(monorepoDir)

  for (const subrepoSubdir of subrepoSubdirs) {
    const subrepoDir = joinPaths(monorepoDir, subrepoSubdir)

    console.log('[SHOWING]', subrepoDir)

    for (const fileSubpath of allSubpaths) {
      const filePath = joinPaths(subrepoDir, fileSubpath)
      const inIndex =  await boolPromise(assumeUnchanged(filePath, false))

      if (inIndex) {
        await checkoutFile(filePath)
      }
    }
  }

  console.log('[SUCCESS]')
}
