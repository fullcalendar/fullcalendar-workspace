import { join as joinPaths } from 'path'
import { rm, readFile, writeFile, copyFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { makeDedicatedLockfile } from 'pnpm-make-dedicated-lockfile'
import { addFile, assumeUnchanged } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { querySubrepoPkgs } from './utils.js'
import { lockFilename, workspaceFilename, turboFilename, miscSubpaths } from './config.js'

export default async function() {
  const monorepoDir = process.cwd()
  const subrepoSubdirs = await querySubrepoPkgs(monorepoDir)

  const workspaceConfigPath = joinPaths(monorepoDir, workspaceFilename)
  const workspaceConfigStr = await readFile(workspaceConfigPath, 'utf8')
  const workspaceConfig = yaml.load(workspaceConfigStr) as any

  for (const subrepoSubdir of subrepoSubdirs) {
    const subrepoDir = joinPaths(monorepoDir, subrepoSubdir)
    const subPkgs = scopePkgGlobs(workspaceConfig.packages, subrepoSubdir)
    const isSubworkspace = Boolean(subPkgs.length)

    console.log('[PROCESSING]', subrepoDir)

    // Write scoped pnpm-workspace config
    if (isSubworkspace) {
      const subconfig = { packages: subPkgs }
      const subpath = joinPaths(subrepoDir, workspaceFilename)
      await writeFile(subpath, yaml.dump(subconfig))
    }

    await makeDedicatedLockfile(monorepoDir, subrepoDir, false) // verbose=false

    const copyableSubpaths: string[] = [
      ...(isSubworkspace ? [turboFilename] : []),
      ...miscSubpaths,
    ]

    await Promise.all(
      copyableSubpaths.map((subpath) => copyFile(
        joinPaths(monorepoDir, subpath),
        joinPaths(subrepoDir, subpath),
      )),
    )

    const addableSubpaths: string[] = [
      lockFilename,
      ...(isSubworkspace ? [workspaceFilename, turboFilename] : []),
      ...miscSubpaths,
    ]

    for (const subpath of addableSubpaths) {
      const filePath = joinPaths(subrepoDir, subpath)

      await boolPromise(assumeUnchanged(filePath, false)) // won't fail if path doesn't exist
      await addFile(filePath)
      await assumeUnchanged(filePath, true)
      await rm(filePath)
    }
  }

  console.log('[SUCCESS]')
}

// Workspace utils
// -------------------------------------------------------------------------------------------------

function scopePkgGlobs(globs: string[], subdir: string): string[] {
  const scopedGlobs = []
  const prefix = `./${subdir}/`

  for (const glob of globs) {
    if (glob.indexOf(prefix) === 0) {
      scopedGlobs.push('./' + glob.substring(prefix.length))
    }
  }

  return scopedGlobs
}
