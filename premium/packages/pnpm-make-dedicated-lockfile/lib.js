// derived from https://github.com/pnpm/pnpm/blob/main/packages/make-dedicated-lockfile/src/index.ts

import { spawn } from 'child_process'
import { join as joinPaths, sep as pathSep, isAbsolute } from 'path'
import { getLockfileImporterId, readWantedLockfile, writeWantedLockfile } from '@pnpm/lockfile-file'
import { pruneSharedLockfile } from '@pnpm/prune-lockfile'
import { DEPENDENCIES_FIELDS } from '@pnpm/types'

export async function makeDedicatedLockfile(rootDir, scopedDir, verbose) {
  const lockfile = await readWantedLockfile(rootDir, { ignoreIncompatible: false })
  if (lockfile == null) {
    throw new Error('no lockfile found')
  }

  if (!isAbsolute(scopedDir)) {
    scopedDir = joinPaths(rootDir, scopedDir)
  }

  const baseImporterId = getLockfileImporterId(rootDir, scopedDir)
  const pkgsOutOfScope = []

  if (lockfile.patchedDependencies) {
    const transformedPatchedDeps = {}

    for (const [dependencyId, patchData] of Object.entries(lockfile.patchedDependencies)) {
      const patchPath = patchData.path
      const scopedPatchPath =
        patchPath.startsWith(`${baseImporterId}/`) &&
        patchPath.slice(baseImporterId.length + 1)

      if (scopedPatchPath) {
        transformedPatchedDeps[dependencyId] = { ...patchData, path: scopedPatchPath }
      }
    }

    lockfile.patchedDependencies = transformedPatchedDeps
  }

  if (lockfile.importers) {
    const transformedImporters = {}

    for (const [importerId, snapshot] of Object.entries(lockfile.importers)) {
      let scopedImporterId =
        importerId.startsWith(`${baseImporterId}/`)
          ? importerId.slice(baseImporterId.length + 1)
          : (importerId === baseImporterId ? '.' : undefined)

      if (scopedImporterId) {
        transformedImporters[scopedImporterId] = filterLinkedDepsOutOfScope(
          scopedImporterId,
          snapshot,
          scopedDir,
          pkgsOutOfScope, // appended to
        )
      }
    }

    lockfile.importers = transformedImporters
  }

  const dedicatedLockfile = pruneSharedLockfile(lockfile)
  await writeWantedLockfile(scopedDir, dedicatedLockfile)
  console.log('Lockfile written.')

  if (pkgsOutOfScope.length) {
    if (verbose) {
      console.log(
        'However, cannot fixup generated lockfile with a reinstall due to the following linked packages being\n' +
        'out of the scope of ' + scopedDir + ':\n' +
        '- ' + pkgsOutOfScope.join('\n- ') + '\n'
      )
    }
  } else {
    if (verbose) {
      console.log('Attempting fixup of generated lockfile with a reinstall:\n')
    }
    await exec([
      'pnpm',
      'install',
      '--ignore-scripts',
      '--resolution-only',
      '--lockfile-dir=.',
      '--filter=.',
    ], {
      cwd: scopedDir,
      stdio: verbose ? 'inherit' : 'ignore',
    })
  }
}

// Linked Deps
// -------------------------------------------------------------------------------------------------

const linkPrefix = 'link:'

function filterLinkedDepsOutOfScope(importerId, snapshot, scopedDir, pkgsOutOfScope) {
  const transformedSnapshot = {}

  for (const [snapshotKey, snapshotVal] of Object.entries(snapshot)) {
    if (!DEPENDENCIES_FIELDS.includes(snapshotKey)) {
      // not a dependency-related field. copy as-is
      transformedSnapshot[snapshotKey] = snapshotVal
    } else if (snapshotVal) {
      const filteredDeps = {}

      for (const [depId, depLocator] of Object.entries(snapshotVal)) {
        const depLink =
          depLocator.startsWith(linkPrefix) &&
          depLocator.slice(linkPrefix.length)

        if (
          depLink && (
            isAbsolute(depLink) ||
            // relative, but references path outside of scopedDir?
            !joinPaths(scopedDir, importerId, depLink).startsWith(scopedDir + pathSep)
          )
        ) {
          pkgsOutOfScope.push(depId)
        } else {
          filteredDeps[depId] = depLocator
        }
      }

      transformedSnapshot[snapshotKey] = filteredDeps
    }
  }

  return transformedSnapshot
}

// General Utils (TODO: make DRY)
// -------------------------------------------------------------------------------------------------

function exec(cmdParts, options = {}) {
  return new Promise((resolve, reject) => {
    spawn(cmdParts[0], cmdParts.slice(1), {
      shell: false,
      ...options,
    }).on('close', (status) => {
      if (status === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with status code ${status}`))
      }
    })
  })
}
