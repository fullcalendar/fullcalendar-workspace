import { join as joinPaths } from 'path'
import { rm, readFile, writeFile, copyFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { makeDedicatedLockfile } from 'pnpm-make-dedicated-lockfile'
import { addFile, assumeUnchanged } from '@fullcalendar-scripts/standard/utils/git'
import { boolPromise } from '@fullcalendar-scripts/standard/utils/lang'
import { querySubrepoPkgs, readManifest, writeManifest } from './utils.js'
import { lockFilename, workspaceFilename, turboFilename, miscSubpaths } from './config.js'

const verbose = true

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
    verbose && console.log()

    // Write scoped pnpm-workspace config
    if (isSubworkspace) {
      const subconfig = { packages: subPkgs }
      const subpath = joinPaths(subrepoDir, workspaceFilename)
      await writeFile(subpath, yaml.dump(subconfig))
    }

    await makeDedicatedLockfile(monorepoDir, subrepoDir, verbose)

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

  await syncManifestVersions(monorepoDir, subrepoSubdirs)

  console.log('[SUCCESS] Changes added to Git index')
  console.log()
}

// Manifest Version Syncing
// -------------------------------------------------------------------------------------------------

const versionAuthorityPkg = 'standard/packages/core'

async function syncManifestVersions(monorepoDir: string, subrepoSubdirs: string[]) {
  const authorityManifest = await readManifest(joinPaths(monorepoDir, versionAuthorityPkg))
  const authorityVersion = authorityManifest.version
  const dirs = [monorepoDir].concat(
    subrepoSubdirs.map((subrepoSubdir) => joinPaths(monorepoDir, subrepoSubdir)),
  )

  for (const dir of dirs) {
    const manifest = await readManifest(dir)
    if (manifest.version !== authorityVersion) {
      manifest.version = authorityVersion
      const manifestPath = await writeManifest(dir, manifest)
      await addFile(manifestPath)
    }
  }
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
