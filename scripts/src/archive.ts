import { join as joinPaths, dirname, sep as pathSeparator } from 'path'
import { createWriteStream } from 'fs'
import { mkdir, readFile, rm } from 'fs/promises'
import { globby } from 'globby'
import archiver from 'archiver'
import { MonorepoStruct } from './utils/monorepo-struct.js'
import { ScriptContext } from './utils/script-runner.js'

export default function(this: ScriptContext) {
  return writeMonorepoArchives(this.monorepoStruct)
}

export async function writeMonorepoArchives(monorepoStruct: MonorepoStruct): Promise<void> {
  await Promise.all(
    getRootDirs(monorepoStruct).map((rootDir) => createArchive(rootDir)),
  )
}

export async function deleteMonorepoArchives(monorepoStruct: MonorepoStruct): Promise<void> {
  await Promise.all(
    getRootDirs(monorepoStruct).map((rootDir) => deleteArchives(rootDir)),
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

async function deleteArchives(rootDir: string): Promise<void> {
  const distDir = joinPaths(rootDir, 'dist')

  await rm(distDir, { recursive: true, force: true })
}

function getRootDirs(monorepoStruct: MonorepoStruct): string[] {
  const { monorepoDir, monorepoPkgJson } = monorepoStruct
  const defaultSubtrees: string[] | undefined = monorepoPkgJson.monorepoConfig.defaultSubtrees

  return defaultSubtrees || [monorepoDir]
}
