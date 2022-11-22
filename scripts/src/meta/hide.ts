import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { assumeUnchanged } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { queryGitSubmodulePkgs } from './utils.js'
import { workspaceFilename, lockFilename, miscSubpaths } from './config.js'

export default async function() {
  const monorepoDir = process.cwd()
  const submoduleSubdirs = await queryGitSubmodulePkgs(monorepoDir)

  for (const submoduleSubdir of submoduleSubdirs) {
    const submoduleDir = joinPaths(monorepoDir, submoduleSubdir)
    const fileSubpathsToAdd: string[] = [
      lockFilename,
      workspaceFilename,
      ...miscSubpaths,
    ]

    console.log('[HIDING]', submoduleDir)

    for (const fileSubpath of fileSubpathsToAdd) {
      const filePath = joinPaths(submoduleDir, fileSubpath)
      const inIndex =  await boolPromise(assumeUnchanged(filePath, true))

      if (inIndex) {
        await rm(filePath, { force: true })
      }
    }
  }

  console.log('[SUCCESS]')
}
