import { join as joinPaths } from 'path'
import { assumeUnchanged, checkoutFile } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { queryGitSubmodulePkgs } from './utils.js'
import { allSubpaths } from './config.js'

export default async function() {
  const monorepoDir = process.cwd()
  const submoduleSubdirs = await queryGitSubmodulePkgs(monorepoDir)

  for (const submoduleSubdir of submoduleSubdirs) {
    const submoduleDir = joinPaths(monorepoDir, submoduleSubdir)

    console.log('[SHOWING]', submoduleDir)

    for (const fileSubpath of allSubpaths) {
      const filePath = joinPaths(submoduleDir, fileSubpath)
      const inIndex =  await boolPromise(assumeUnchanged(filePath, false))

      if (inIndex) {
        await checkoutFile(filePath)
      }
    }
  }

  console.log('[SUCCESS]')
}
