// derived from https://github.com/pnpm/pnpm/blob/main/packages/make-dedicated-lockfile/src/index.ts

import { join as joinPaths, sep as pathSep, isAbsolute, relative as getRelative } from 'path'
import { getLockfileImporterId, readWantedLockfile, writeWantedLockfile } from '@pnpm/lockfile-file'
import { pruneSharedLockfile } from '@pnpm/prune-lockfile'
import { DEPENDENCIES_FIELDS } from '@pnpm/types'
import { readFile, lstat } from 'fs/promises'

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

  // transfer over workspace-root dependencies,
  // using scopedDir's manifest as a whitelist
  if (
    !lockfile.importers[getRelative(rootDir, scopedDir)] && // NOT already a workspace
    await hasManifest(scopedDir)
  ) {
    const scopedManifest = await readManifest(scopedDir)
    const scopedRootSnapshot = { specifiers: {} }
    const rootImporter = lockfile.importers['.']

    for (const depField of DEPENDENCIES_FIELDS) {
      const depSpecifiers = scopedManifest[depField]

      if (depSpecifiers) {
        for (const depName in depSpecifiers) {
          const depSpecifier = depSpecifiers[depName]
          let depLocator = rootImporter[depField]?.[depName]

          if (!depLocator) {
            throw new Error(
              `Scope '${scopedDir}' cannot depend on ${depName} without root also depending on it`
            )
          }

          const depLocatorLink =
            depLocator.startsWith(linkPrefix) &&
            depLocator.slice(linkPrefix.length)

          if (depLocatorLink) {
            const scopedDepLocatorLink =
              depLocatorLink.startsWith(`${baseImporterId}/`) &&
              depLocatorLink.slice(baseImporterId.length + 1)

            if (!scopedDepLocatorLink) {
              throw new Error(
                `Scope '${scopedDir}' cannot depend on ${depLocatorLink} if it is outside`
              )
            }

            depLocator = linkPrefix + scopedDepLocatorLink
          } else {
            /*
            TODO: for registry deps, throw error if specified version conflicts.
            if rootImporter.specifiers[depName] !== depSpecifier
            */
          }

          ;(
            scopedRootSnapshot[depField] ||
            (scopedRootSnapshot[depField] = {})
          )[depName] = depLocator

          scopedRootSnapshot.specifiers[depName] = depSpecifier
        }
      }
    }

    transformedImporters['.'] = scopedRootSnapshot
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

  /*
  snapshotVal is the hash of dependends/devDependencies/etc
  */
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
Used by the root-repo manifest to quickly update linked version numbers after a version bump.
Looks for locators with link: and updated their specifiers to the latest (ex: '^3.3.12' -> '^3.3.13')
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

// UTILS... TODO: make DRY
// -------------------------------------------------------------------------------------------------

function hasManifest(dir) {
  return fileExists(joinPaths(dir, 'package.json'))
}

async function readManifest(dir) {
  const manifestPath = joinPaths(dir, 'package.json')
  return await readJson(manifestPath)
}

function fileExists(path) {
  return lstat(path).then(
    () => true,
    () => false,
  )
}

async function readJson(path) {
  const srcJson = await readFile(path, 'utf8')
  const srcMeta = JSON.parse(srcJson)
  return srcMeta
}
