import { join as joinPaths } from 'path'
import { rm, readFile, writeFile, copyFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { execSilent } from '@fullcalendar/standard-scripts/utils/exec'
import { addFile, assumeUnchanged } from '@fullcalendar/standard-scripts/utils/git'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'
import { queryGitSubmodulePkgs } from './utils.js'
import { lockFilename, workspaceFilename, turboFilename, miscSubpaths } from './config.js'

export default async function() {
  const monorepoDir = process.cwd()
  const submoduleSubdirs = await queryGitSubmodulePkgs(monorepoDir)

  const workspaceConfigPath = joinPaths(monorepoDir, workspaceFilename)
  const workspaceConfigStr = await readFile(workspaceConfigPath, 'utf8')
  const workspaceConfig = yaml.load(workspaceConfigStr) as any

  for (const submoduleSubdir of submoduleSubdirs) {
    const submoduleDir = joinPaths(monorepoDir, submoduleSubdir)
    const subpkgs = scopePkgGlobs(workspaceConfig.packages, submoduleSubdir)
    const isSubworkspace = Boolean(subpkgs.length)

    console.log('[PROCESSING]', submoduleDir)

    // Write scoped pnpm-workspace config
    if (isSubworkspace) {
      const subconfig = { packages: subpkgs }
      const subpath = joinPaths(submoduleDir, workspaceFilename)
      await writeFile(subpath, yaml.dump(subconfig))
    }

    // TODO: update pnpm-lock

    const copyableSubpaths: string[] = [
      ...(isSubworkspace ? [turboFilename] : []),
      ...miscSubpaths,
    ]

    await Promise.all(
      copyableSubpaths.map((subpath) => copyFile(
        joinPaths(monorepoDir, subpath),
        joinPaths(submoduleDir, subpath),
      )),
    )

    const addableSubpaths: string[] = [
      lockFilename,
      ...(isSubworkspace ? [workspaceFilename, turboFilename] : []),
      ...miscSubpaths,
    ]

    for (const subpath of addableSubpaths) {
      const filePath = joinPaths(submoduleDir, subpath)

      await boolPromise(assumeUnchanged(filePath, false)) // won't fail if path doesn't exist
      await addFile(filePath)
      await assumeUnchanged(filePath, true)
      await rm(filePath)
    }
  }

  console.log('[RESTORING]', monorepoDir)

  // restore all node_modules files as if they were part of root monorepo. very fast.
  await execSilent([
    'pnpm',
    'install',
    '--ignore-scripts',
  ], {
    cwd: monorepoDir,
  })

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
