import { join as joinPaths, dirname, sep as pathSeparator } from 'path'
import { createWriteStream } from 'fs'
import { mkdir, readFile, rm } from 'fs/promises'
import { globby } from 'globby'
import archiver from 'archiver'
import { MonorepoConfig, readSrcPkgMeta } from '../pkg/meta.js'

export default async function() {
  const monorepoDir = process.cwd()
  const monorepoPkgMeta = await readSrcPkgMeta(monorepoDir)
  const monorepoConfig = monorepoPkgMeta.monorepoConfig || {}

  return createMonorepoArchives(monorepoDir, monorepoConfig)
}

export async function createMonorepoArchives(
  monorepoDir: string,
  monorepoConfig: MonorepoConfig,
): Promise<void> {
  const { defaultSubtrees } = monorepoConfig
  const rootDirs = defaultSubtrees || [monorepoDir]

  await Promise.all(
    rootDirs.map((rootDir) => createArchive(rootDir)),
  )
}

export async function cleanMonorepoArchives(
  monorepoDir: string,
  monorepoConfig: MonorepoConfig,
): Promise<void> {
  const { defaultSubtrees } = monorepoConfig
  const rootDirs = defaultSubtrees || [monorepoDir]

  await Promise.all(
    rootDirs.map(async (rootDir) => {
      const distDir = joinPaths(rootDir, 'dist')

      await rm(distDir, { recursive: true, force: true })
    }),
  )
}

async function createArchive(rootDir: string): Promise<void> {
  const bundleDir = joinPaths(rootDir, 'bundle')
  const bundleJson = await readFile(joinPaths(bundleDir, 'package.json'), 'utf8')
  const bundleMeta = JSON.parse(bundleJson)
  const archiveId = `${bundleMeta.name}-${bundleMeta.version}`

  const archivePath = joinPaths(rootDir, `dist/${archiveId}.zip`)
  await mkdir(dirname(archivePath), { recursive: true })

  const archiveStream = createWriteStream(archivePath)
  archiveStream.on('close', () => {
    console.log(`${archive.pointer()} bytes written to ${archivePath}`)
  })

  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.pipe(archiveStream)

  // TODO: no longer use blobs. other places are assuming file extensions
  ;['README.*', 'LICENSE.*'].forEach((pattern) => {
    archive.glob(pattern, { cwd: rootDir }, { prefix: archiveId })
  })

  archive.directory(joinPaths(bundleDir, 'examples'), `${archiveId}/examples`)
  archive.glob('dist/*.js', { cwd: bundleDir }, { prefix: archiveId })

  const pkgFileRelPaths = await globby('packages/*/dist/**/*.js', { cwd: rootDir })

  for (const pkgFileRelPath of pkgFileRelPaths) {
    const pathParts = pkgFileRelPath.split(pathSeparator)
    pathParts.splice(2, 1) // remove 'dist'

    archive.file(
      pkgFileRelPath,
      { name: [archiveId].concat(pathParts).join('/') },
    )
  }

  return archive.finalize()
}
