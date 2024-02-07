import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { assumeUnchanged } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { querySubrepoPkgs } from './utils.js'
import { allSubpaths } from './config.js'

export default async function() {
  await hideMetaFiles(process.cwd())
}

export async function hideMetaFiles(monorepoDir: string, silent?: boolean) {
  const subrepoSubdirs = await querySubrepoPkgs(monorepoDir)

  for (const subrepoSubdir of subrepoSubdirs) {
    const subrepoDir = joinPaths(monorepoDir, subrepoSubdir)

    if (!silent) {
      console.log('[HIDING]', subrepoDir)
    }

    for (const fileSubpath of allSubpaths) {
      const filePath = joinPaths(subrepoDir, fileSubpath)
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
