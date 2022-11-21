import { join as joinPaths } from 'path'
import { rm, readFile, writeFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import { makeDedicatedLockfile } from '@pnpm/make-dedicated-lockfile'
import { execCapture, execSilent } from '@fullcalendar/standard-scripts/utils/exec'
import {
  addFile,
  assumeUnchanged,
  checkoutFile,
  isStaged,
} from '@fullcalendar/standard-scripts/utils/git'
import { fileExists } from '@fullcalendar/standard-scripts/utils/fs'
import { boolPromise } from '@fullcalendar/standard-scripts/utils/lang'

const workspaceFilename = 'pnpm-workspace.yaml'
const lockFilename = 'pnpm-lock.yaml'
const miscFiles = [
  '.npmrc',
  '.editorconfig',
]

export default async function() {
  const monorepoDir = process.cwd()
  const subdirs = await getGitSubmodulePaths(monorepoDir)
  const subdirsWithPkgJson = await asyncFilter(subdirs, (subdir) => {
    return fileExists(joinPaths(subdir, 'package.json'))
  })

  const workspaceConfigPath = joinPaths(monorepoDir, workspaceFilename)
  const workspaceConfigStr = await readFile(workspaceConfigPath, 'utf8')
  const workspaceConfig = yaml.load(workspaceConfigStr) as any

  for (const subdir of subdirsWithPkgJson) {
    const subdirFull = joinPaths(monorepoDir, subdir)
    const subpkgs = scopePkgGlobs(workspaceConfig.packages, subdir)
    const isSubworkspace = Boolean(subpkgs.length)

    if (isSubworkspace) {
      const subconfig = { packages: subpkgs }
      const subpath = joinPaths(subdirFull, workspaceFilename)
      await writeFile(subpath, yaml.dump(subconfig))
    }

    console.log('[PROCESSING]', subdirFull)

    // this util has been patched to NOT rewrite the package.json and NOT call pnpm-install
    // because it was too fragile and throwing errors
    await makeDedicatedLockfile(monorepoDir, subdirFull)

    // however, calling pnpm-install is important b/c it fixes up the half-baked generated lockfile
    if (isSubworkspace) {
      // sub-workspaces have their own workspace config file which prevent pnpm-install from
      // attempting to install the root workspace. doing an install this way is much more accurate.
      await execSilent([
        'pnpm',
        'install',
        '--ignore-scripts',
      ], {
        cwd: subdirFull,
      })
    } else {
      // standalone packages do NOT have their own workspace config and thus will install the root
      // workspace if pnpm-install is called. provide options to scope just this package.
      // options are inspired by make-dedicated-lockfile source code.
      await execSilent([
        'pnpm',
        'install',
        '--ignore-scripts',
        '--lockfile-dir=.',
        '--filter=.',
        '--no-link-workspace-packages',
      ], {
        cwd: subdirFull,
      })
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

// pnpm-workspace.yaml
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

// Git utils
// -------------------------------------------------------------------------------------------------

async function getGitSubmodulePaths(rootDir: string): Promise<string[]> {
  const s = await execCapture(['git', 'submodule', 'status'], { cwd: rootDir })
  const lines = s.trim().split('\n')

  return lines.map((line) => {
    return line.trim().split(' ')[1]
  })
}

async function revealFiles(paths: string[]): Promise<void> {
  for (let path of paths) {
    const inIndex = await boolPromise(assumeUnchanged(path, false))
    if (inIndex) {
      await checkoutFile(path)
    }
  }
}

async function addFiles(paths: string[]): Promise<boolean> {
  let anyAdded = false

  for (let path of paths) {
    // TODO: refactor this file to only add generated paths that return string/true
    if (await fileExists(path)) {
      await addFile(path)

      if (await isStaged(path)) {
        anyAdded = true
      }
    }
  }

  return anyAdded
}

async function hideFiles(paths: string[]): Promise<void> {
  for (let path of paths) {
    const inIndex = await boolPromise(assumeUnchanged(path, true))
    if (inIndex) {
      await rm(path, { force: true })
    }
  }
}

// Git utils
// -------------------------------------------------------------------------------------------------

async function asyncFilter<T = unknown>(
  arr: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}
