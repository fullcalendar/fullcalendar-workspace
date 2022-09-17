import * as path from 'path'
import { readFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import makeDedicatedLockfile from '@pnpm/make-dedicated-lockfile'
import { getSubrepoDir, rootDir } from './subrepo.js'

// Lock file
// -------------------------------------------------------------------------------------------------

export const lockFilename = 'pnpm-lock.yaml'

export function generateSubdirLock(subrepo: string): Promise<void> {
  return makeDedicatedLockfile(rootDir, getSubrepoDir(subrepo))
}

// Workspace file
// -------------------------------------------------------------------------------------------------

export const workspaceFilename = 'pnpm-workspace.yaml'

export async function generateSubdirWorkspace(subrepo: string): Promise<string | void> {
  const srcPath = path.join(rootDir, workspaceFilename)

  const yamlStr = await readFile(srcPath, { encoding: 'utf8' })
  const yamlDoc = yaml.load(yamlStr) as { packages: string[] }
  const scopedPackages = scopePackages(yamlDoc.packages, subrepo)

  if (scopedPackages.length) {
    yamlDoc.packages = scopedPackages
    return yaml.dump(yamlDoc)
  }
}

function scopePackages(packageGlobs: string[], subrepo: string): string[] {
  const newPackageGlobs: string[] = []
  const prefix = `./${subrepo}/`

  for (const packageGlob of packageGlobs) {
    if (packageGlob.indexOf(prefix) === 0) {
      newPackageGlobs.push('./' + packageGlob.substring(prefix.length))
    }
  }

  return newPackageGlobs
}
