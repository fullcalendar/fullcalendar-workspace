// derived from https://github.com/pnpm/pnpm/blob/main/packages/make-dedicated-lockfile/src/index.ts

import { spawn } from 'child_process'
import { join as joinPaths } from 'path'
import { writeFile, unlink as unlinkFile, lstat } from 'fs/promises'
import { createExportableManifest } from '@pnpm/exportable-manifest'
import { getLockfileImporterId, readWantedLockfile, writeWantedLockfile } from '@pnpm/lockfile-file'
import { pruneSharedLockfile } from '@pnpm/prune-lockfile'
import pickBy from '@pnpm/ramda/src/pickBy' // a fork of ramda by PNPM
import { readProjectManifest } from '@pnpm/read-project-manifest'
import { DEPENDENCIES_FIELDS } from '@pnpm/types'

const subWorkspaceTempContents = `
# temporary config for scoped PNPM lockfile generation
packages: []
`

export async function makeDedicatedLockfile(lockfileDir, projectDir, verbose) {
  const lockfile = await readWantedLockfile(lockfileDir, { ignoreIncompatible: false })
  if (lockfile == null) {
    throw new Error('no lockfile found')
  }

  // Create a tentative scoped pnpm-lock.yaml
  const allImporters = lockfile.importers
  lockfile.importers = {}
  const baseImporterId = getLockfileImporterId(lockfileDir, projectDir)
  for (const [importerId, importer] of Object.entries(allImporters)) {
    if (importerId.startsWith(`${baseImporterId}/`)) {
      const newImporterId = importerId.slice(baseImporterId.length + 1)
      lockfile.importers[newImporterId] = projectSnapshotWithoutLinkedDeps(importer)
      continue
    }
    if (importerId === baseImporterId) {
      lockfile.importers['.'] = projectSnapshotWithoutLinkedDeps(importer)
    }
  }
  const dedicatedLockfile = pruneSharedLockfile(lockfile)
  await writeWantedLockfile(projectDir, dedicatedLockfile)

  // Possibly update package.json, for some reason
  const { manifest, writeProjectManifest } = await readProjectManifest(projectDir)
  const publishManifest = await createExportableManifest(projectDir, manifest)
  await writeProjectManifest(publishManifest)

  // Possible create a temporary pnpm-workspace.yaml, to simulate a monorepo root
  const subWorkspaceConfigPath = joinPaths(projectDir, 'pnpm-workspace.yaml')
  const subWorkspaceConfigIsTemp = !(await fileExists(subWorkspaceConfigPath))
  if (subWorkspaceConfigIsTemp) {
    await writeFile(subWorkspaceConfigPath, subWorkspaceTempContents)
  }

  // Run a real install to clean up pnpm-lock.yaml
  let installError
  try {
    await exec(['pnpm', 'install', '--ignore-scripts'], {
      cwd: projectDir,
      stdio: verbose ? 'inherit' : 'ignore',
    })
  } catch (error) {
    installError = error
  }

  // Undo temporary pnpm-workspace.yaml
  if (subWorkspaceConfigIsTemp) {
    await unlinkFile(subWorkspaceConfigPath)
  }

  if (installError) {
    throw installError
  }
}

function projectSnapshotWithoutLinkedDeps(projectSnapshot) {
  const newProjectSnapshot = {
    specifiers: projectSnapshot.specifiers,
  }
  for (const depField of DEPENDENCIES_FIELDS) {
    if (projectSnapshot[depField] == null) continue
    newProjectSnapshot[depField] = pickBy(
      (depVersion) => !depVersion.startsWith('link:'),
      projectSnapshot[depField],
    )
  }
  return newProjectSnapshot
}

// Utils (TODO: make DRY)
// -------------------------------------------------------------------------------------------------

function fileExists(path) {
  return lstat(path).then(
    () => true,
    () => false,
  )
}

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
