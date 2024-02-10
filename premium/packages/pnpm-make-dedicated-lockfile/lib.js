// derived from https://github.com/pnpm/pnpm/blob/main/packages/make-dedicated-lockfile/src/index.ts

import { join as joinPaths, sep as pathSep, isAbsolute } from 'path'
import { getLockfileImporterId, readWantedLockfile, writeWantedLockfile } from '@pnpm/lockfile-file'
import { pruneSharedLockfile } from '@pnpm/prune-lockfile'
import { DEPENDENCIES_FIELDS } from '@pnpm/types'

export function readLockfile(rootDir, ignoreIncompatible = true) {
  return readWantedLockfile(rootDir, { ignoreIncompatible }) // needs options or fails!
}

export const writeLockfile = writeWantedLockfile

export async function makeDedicatedLockfile(rootDir, scopedDir, verbose) {
  const lockfile = await readLockfile(rootDir)
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

  const dedicatedLockfile = pruneSharedLockfile(lockfile)
  await writeWantedLockfile(scopedDir, dedicatedLockfile)
  verbose && console.log('Lockfile written.\n')

  if (pkgsOutOfScope.length) {
    if (verbose) {
      console.log(
        'WARNING: Discarded linked package references outside of\n' + scopedDir + ':\n' +
        '- ' + pkgsOutOfScope.join('\n- ') + '\n'
      )
    }
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

// RE-LINK LOCKFILE (UNRELATED)
// -------------------------------------------------------------------------------------------------

/*
HACK: pass-in readManifest because code reuse is hard. Refactor as a util within this package.
*/
export async function relinkLockfile(rootDir, lockfile, readManifest) {
  const transformedImporters = {}

  for (const [importerId, snapshot] of Object.entries(lockfile.importers)) {
    transformedImporters[importerId] = await relinkDeps(
      rootDir,
      importerId,
      snapshot,
      readManifest,
    )
  }

  return { ...lockfile, importers: transformedImporters }
}

async function relinkDeps(rootDir, importerId, snapshot, readManifest) {
  const manifest = await readManifest(joinPaths(rootDir, importerId))
  const transformedSpecifiers = {}

  for (const [depName, specifier] of Object.entries(snapshot.specifiers)) {
    let updatedLinkSpecifier

    for (const depField of DEPENDENCIES_FIELDS) {
      const depLocator = snapshot[depField]?.[depName]
      if (depLocator && depLocator.startsWith(linkPrefix)) {
        updatedLinkSpecifier = manifest[depField]?.[depName]
        break
      }
    }

    transformedSpecifiers[depName] = updatedLinkSpecifier || specifier
  }

  return {
    ...snapshot,
    specifiers: transformedSpecifiers,
  }
}
