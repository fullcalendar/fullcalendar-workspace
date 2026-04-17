#!/usr/bin/env node

import archiver from 'archiver'
import { createWriteStream } from 'node:fs'
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import { createRequire } from 'node:module'
import {
  basename,
  dirname,
  join,
  parse,
} from 'node:path'
import { finished } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

type ThemeSpec = {
  palettes: string[]
}

const require = createRequire(import.meta.url)
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(packageDir, 'dist')
const sfdxRootDir = join(distDir, 'src-sfdx')
const defaultMetadataDir = join(sfdxRootDir, 'force-app', 'main', 'default')
const outputLwcDir = join(defaultMetadataDir, 'lwc', 'fullCalendar')
const outputStaticResourcesDir = join(defaultMetadataDir, 'staticresources')
const outputResourceDir = join(outputStaticResourcesDir, 'fullCalendarLib')

const sourceLwcDir = join(packageDir, 'src')
const resourceMetaXmlText = `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
  <cacheControl>Private</cacheControl>
  <contentType>application/zip</contentType>
</StaticResource>
`

async function buildLwcPackage() {
  const packageJsonPath = join(packageDir, 'package.json')
  const { version } = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { version: string }
  const fcPkgPath = require.resolve('fullcalendar/package.json')
  const fcDistDir = resolveDistDirFromPackageJson(fcPkgPath)

  await rm(distDir, { recursive: true, force: true })

  const themes = await readThemes(join(fcDistDir, 'themes'))
  const locales = await readLocales(join(fcDistDir, 'locales'))

  await copyLwcSource(themes, locales)
  await copyStaticResources(fcDistDir, themes, locales)
  await writeFile(
    join(outputStaticResourcesDir, 'fullCalendarLib.resource-meta.xml'),
    resourceMetaXmlText,
  )

  await createReleaseZip(version)
}

function resolveDistDirFromPackageJson(packageJsonPath: string) {
  const packageDirPath = dirname(packageJsonPath)

  return parse(packageDirPath).base === 'dist'
    ? packageDirPath
    : join(packageDirPath, 'dist')
}

async function copyLwcSource(themes: Map<string, ThemeSpec>, locales: string[]) {
  await mkdir(outputLwcDir, { recursive: true })

  await copyFile(join(sourceLwcDir, 'fullCalendar.html'), join(outputLwcDir, 'fullCalendar.html'))
  await copyFile(join(sourceLwcDir, 'fullCalendar.js'), join(outputLwcDir, 'fullCalendar.js'))

  const themePaletteDatasource = Array.from(themes.entries())
    .flatMap(([themeName, themeSpec]) => themeSpec.palettes.map((paletteName) => `${themeName}/${paletteName}`))
    .join(',')
  const localeDatasource = locales.join(',')
  const metaTemplate = await readFile(join(sourceLwcDir, 'fullCalendar.js-meta.xml.template'), 'utf8')

  await writeFile(
    join(outputLwcDir, 'fullCalendar.js-meta.xml'),
    metaTemplate
      .replace('{{THEME_PALETTE_DATASOURCE}}', themePaletteDatasource)
      .replace('{{LOCALE_DATASOURCE}}', localeDatasource),
  )
}

async function copyStaticResources(fcDistDir: string, themes: Map<string, ThemeSpec>, locales: string[]) {
  await mkdir(outputResourceDir, { recursive: true })

  await copyFile(join(fcDistDir, 'all.global.js'), join(outputResourceDir, 'all.global.js'))
  await copyFile(join(fcDistDir, 'skeleton.css'), join(outputResourceDir, 'skeleton.css'))

  const outputThemesDir = join(outputResourceDir, 'themes')

  await mkdir(outputThemesDir, { recursive: true })

  for (const [themeName, themeSpec] of themes.entries()) {
    const inputThemeDir = join(fcDistDir, 'themes', themeName)
    const outputThemeDir = join(outputThemesDir, themeName)
    const outputPaletteDir = join(outputThemeDir, 'palettes')

    await mkdir(outputThemeDir, { recursive: true })
    await mkdir(outputPaletteDir, { recursive: true })

    await copyFile(join(inputThemeDir, 'global.js'), join(outputThemeDir, 'global.js'))
    await copyFile(join(inputThemeDir, 'theme.css'), join(outputThemeDir, 'theme.css'))

    for (const paletteName of themeSpec.palettes) {
      const inputPalettePath = themeName === 'classic'
        ? join(inputThemeDir, 'palette.css')
        : join(inputThemeDir, 'palettes', `${paletteName}.css`)

      await copyFile(inputPalettePath, join(outputPaletteDir, `${paletteName}.css`))
    }
  }

  const outputLocalesDir = join(outputResourceDir, 'locales')

  await mkdir(outputLocalesDir, { recursive: true })

  for (const localeName of locales) {
    await copyFile(
      join(fcDistDir, 'locales', `${localeName}.global.js`),
      join(outputLocalesDir, `${localeName}.global.js`),
    )
  }
}

async function readThemes(themesDir: string) {
  const themeEntries = await readdir(themesDir, { withFileTypes: true })
  const themes = new Map<string, ThemeSpec>()

  for (const themeEntry of themeEntries) {
    if (!themeEntry.isDirectory()) {
      continue
    }

    const themeName = themeEntry.name
    const themeDir = join(themesDir, themeName)

    await assertExists(join(themeDir, 'global.js'))
    await assertExists(join(themeDir, 'theme.css'))

    let palettes: string[] = []
    const palettesDir = join(themeDir, 'palettes')

    try {
      const paletteEntries = await readdir(palettesDir, { withFileTypes: true })
      palettes = paletteEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
        .map((entry) => basename(entry.name, '.css'))
        .sort((left, right) => left.localeCompare(right))
    } catch {
      await assertExists(join(themeDir, 'palette.css'))
      palettes = ['default']
    }

    if (!palettes.length) {
      throw new Error(`Theme ${themeName} did not expose any palette CSS files`)
    }

    themes.set(themeName, { palettes })
  }

  return new Map(Array.from(themes.entries()).sort(([left], [right]) => left.localeCompare(right)))
}

async function readLocales(localesDir: string) {
  const localeEntries = await readdir(localesDir, { withFileTypes: true })

  return localeEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.global.js'))
    .map((entry) => basename(entry.name, '.global.js'))
    .sort((left, right) => left.localeCompare(right))
}

async function assertExists(filePath: string) {
  await access(filePath)
}

async function createReleaseZip(version: string) {
  const archivePath = join(distDir, `fullcalendar-lwc-${version}.zip`)

  await rm(archivePath, { force: true })
  await mkdir(dirname(archivePath), { recursive: true })

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
  archive.directory(defaultMetadataDir, 'force-app/main/default')

  await archive.finalize()
  await finished(output)
}

buildLwcPackage().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
