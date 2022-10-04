import { join as joinPaths, dirname, sep as pathSeparator } from 'path'
import { createWriteStream } from 'fs'
import { mkdir, readFile } from 'fs/promises'
import { globby } from 'globby'
import archiver from 'archiver'
import { monorepoRootDir } from './lib.js'

export default async function() {
  return Promise.all([
    createArchive(
      joinPaths(monorepoRootDir, 'dist'),
      joinPaths(monorepoRootDir, 'standard'),
    ),
    createArchive(
      joinPaths(monorepoRootDir, 'dist'),
      joinPaths(monorepoRootDir, 'premium'),
      [joinPaths(monorepoRootDir, 'standard/packages')]
    ),
  ])
}

async function createArchive(
  archiveDir: string,
  rootDir: string,
  extraPkgRootDirs: string[] = [],
): Promise<void> {
  const bundleDir = joinPaths(rootDir, 'bundle')
  const bundleJson = await readFile(joinPaths(bundleDir, 'package.json'), 'utf8')
  const bundleMeta = JSON.parse(bundleJson)
  const archiveId = `${bundleMeta.name}-${bundleMeta.version}`

  const archivePath = joinPaths(archiveDir, `${archiveId}.zip`)
  await mkdir(dirname(archivePath), { recursive: true })

  const archiveStream = createWriteStream(archivePath)
  archiveStream.on('close', () => {
    console.log(`${archive.pointer()} bytes written to ${archivePath}`)
  })

  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.pipe(archiveStream)

  archive.directory(
    joinPaths(bundleDir, 'examples'),
    `${archiveId}/examples`,
  )

  archive.glob(
    'dist/*.js',
    { cwd: bundleDir },
    { prefix: archiveId },
  )

  const pkgRootDirs = [
    joinPaths(rootDir, 'packages'),
    ...extraPkgRootDirs,
  ]

  for (const pkgRootDir of pkgRootDirs) {
    const pkgFileRelPaths = await globby('*/dist/**/*.js', { cwd: pkgRootDir })

    for (const pkgFileRelPath of pkgFileRelPaths) {
      const pathParts = pkgFileRelPath.split(pathSeparator)
      pathParts.splice(1, 1) // remove 'dist'

      archive.file(
        joinPaths(pkgRootDir, pkgFileRelPath),
        { name: [archiveId, 'packages'].concat(pathParts).join('/') }
      )
    }
  }

  // TODO: REAME, LICENSE

  return archive.finalize()
}
