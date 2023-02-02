import { join as joinPaths } from 'path'
import { rm, readFile, writeFile, copyFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { makeDedicatedLockfile } from '@pnpm/make-dedicated-lockfile'
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

    if (isSubworkspace) {
      const subconfig = { packages: subpkgs }
      const subpath = joinPaths(submoduleDir, workspaceFilename)
      await writeFile(subpath, yaml.dump(subconfig))
    }

    // this util has been patched to NOT rewrite the package.json and NOT call pnpm-install
    // because it was too fragile and throwing errors
    await makeDedicatedLockfile(monorepoDir, submoduleDir)

    // however, calling pnpm-install is important b/c it fixes up the half-baked generated lockfile
    if (isSubworkspace) {
      // sub-workspaces have their own workspace config file which prevent pnpm-install from
      // attempting to install the root workspace. doing an install this way is much more accurate.
      await execSilent([
        'pnpm',
        'install',
        '--ignore-scripts',
      ], {
        cwd: submoduleDir,
      })
    } else {
      // standalone packages do NOT have their own workspace config and thus will install the root
      // workspace if pnpm-install is called. provide options to scope just this package.
      // options are inspired by make-dedicated-lockfile source code.
      //
      // HACK NEEDED: even though this is scoped to submodule's directory, the lockfile still has an
      // "../.." entry that references the monorepo root. Luckily this is ignored when the
      // submodule is pnpm-installed, but it still means private monorepo packages must be public
      // due to --no-link-workspace-packages being specific. Thus, ensure private packages are
      // published as dummy packages (ex: https://www.npmjs.com/package/@fullcalendar/standard-scripts)
      await execSilent([
        'pnpm',
        'install',
        '--ignore-scripts',
        '--no-link-workspace-packages', // don't reference symlinks outside of submodule root
        '--lockfile-dir=.',
        '--filter=.',
      ], {
        cwd: submoduleDir,
      })
    }

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
