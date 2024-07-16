import { join as joinPaths } from 'path'
import { querySubrepoPkgs, readManifest, writeManifest } from './meta/utils.js'
import { addFile } from '@fullcalendar-scripts/standard/utils/git'

const versionAuthorityPkg = 'standard/packages/core'

export default async function() {
  const monorepoDir = process.cwd()
  const subrepoSubdirs = await querySubrepoPkgs(monorepoDir)

  await syncManifestVersions(monorepoDir, subrepoSubdirs)
  await syncAngularLibManifest(monorepoDir)
}

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

async function syncAngularLibManifest(monorepoDir: string) {
  const angularRootManifest = await readManifest(joinPaths(monorepoDir, 'contrib/angular'))
  const angularLibManifest = await readManifest(joinPaths(monorepoDir, 'contrib/angular/lib'))

  angularLibManifest.version = angularRootManifest.version
  angularLibManifest.dependencies = angularRootManifest.dependencies
  angularLibManifest.peerDependencies = angularRootManifest.peerDependencies

  const libManifestPath = await writeManifest(joinPaths(monorepoDir, 'contrib/angular/lib'), angularLibManifest)
  await addFile(libManifestPath)
}
