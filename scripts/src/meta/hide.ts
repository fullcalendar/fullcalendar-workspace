import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { assumeUnchanged } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { queryGitSubmodulePkgs } from './utils.js'
import { allPaths } from './config.js'

export default async function() {
  await hideMetaFiles(process.cwd())
}

export async function hideMetaFiles(monorepoDir: string, silent?: boolean) {
  const submoduleSubdirs = await queryGitSubmodulePkgs(monorepoDir)

  for (const submoduleSubdir of submoduleSubdirs) {
    const submoduleDir = joinPaths(monorepoDir, submoduleSubdir)

    if (!silent) {
      console.log('[HIDING]', submoduleDir)
    }

    for (const fileSubpath of allPaths) {
      const filePath = joinPaths(submoduleDir, fileSubpath)
      const inIndex =  await boolPromise(assumeUnchanged(filePath, true))

      if (inIndex) {
        await rm(filePath, { force: true })
      }
    }
  }

  if (!silent) {
    console.log('[SUCCESS]')
  }
}
