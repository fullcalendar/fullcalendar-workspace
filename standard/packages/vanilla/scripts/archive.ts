#!/usr/bin/env node

import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import { finished } from 'stream/promises'
import {
  join as joinPaths,
  resolve as resolvePath,
  sep as pathSeparator,
} from 'path'
import { fileURLToPath } from 'url'
import { globby } from 'globby'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')
const archivePath = joinPaths(thisPkgDir, 'fullcalendar.zip')
const archiveRootDir = 'fullcalendar'
const licensePath = joinPaths(thisPkgDir, '..', '..', 'LICENSE.md')

const archivePatterns = [
  'dist/all.global.js',
  'dist/locales-all.global.js',
  'dist/skeleton.css',
  'dist/locales/*.global.js',
  'dist/themes/*/global.js',
  'dist/themes/*/theme.css',
  'dist/themes/*/palette.css',
  'dist/themes/*/palettes/**/*',
  'examples/**/*',
]

export default async function archiveVanillaZip() {
  await rm(archivePath, { force: true })

  const output = createWriteStream(archivePath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('warning', (error) => {
    if (error.code !== 'ENOENT') {
      output.destroy(error)
    }
  })
  archive.on('error', (error) => {
    output.destroy(error)
  })
  output.on('error', (error) => {
    archive.destroy(error)
  })

  archive.pipe(output)

  const relPaths = (await globby(archivePatterns, {
    cwd: thisPkgDir,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
  })).sort((left, right) => left.localeCompare(right))

  for (const relPath of relPaths) {
    archive.file(joinPaths(thisPkgDir, relPath), {
      name: [archiveRootDir, relPath.split(pathSeparator).join('/')].join('/'),
    })
  }

  archive.file(licensePath, {
    name: `${archiveRootDir}/LICENSE.md`,
  })

  await archive.finalize()
  await finished(output)
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  archiveVanillaZip().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
