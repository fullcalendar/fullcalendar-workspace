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

type ThemeSpec = {
  palettes: string[]
}

export type AdditionalStaticResourceContext = {
  outputStaticResourcesDir: string
}

export type LwcBuildConfig = {
  packageDir: string
  sourceLwcDir?: string
  componentName?: string
  componentLabel?: string
  componentDescription?: string
  transformComponentJs?: (source: string) => string
  copyAdditionalStaticResources?: (context: AdditionalStaticResourceContext) => Promise<void>
}

export type DerivedLwcMetadataConfig = {
  sourcePath: string
  outputPath: string
  componentLabel: string
  componentDescription: string
  targets: string[]
}

type BuildContext = {
  sourceLwcDir: string
  outputLwcDir: string
  componentName: string
  outputStaticResourcesDir: string
  outputResourceDir: string
  componentLabel: string
  componentDescription: string
  transformComponentJs?: (source: string) => string
}

export const resourceMetaXmlText = `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
  <cacheControl>Private</cacheControl>
  <contentType>application/zip</contentType>
</StaticResource>
`

export async function buildLwcPackage(config: LwcBuildConfig) {
  const {
    packageDir,
    sourceLwcDir = join(packageDir, 'src'),
    componentName = 'fullCalendar',
    componentLabel = 'FullCalendar',
    componentDescription = 'FullCalendar component',
    transformComponentJs,
    copyAdditionalStaticResources,
  } = config
  const distDir = join(packageDir, 'dist')
  const defaultMetadataDir = join(distDir, 'src-sfdx', 'force-app', 'main', 'default')
  const outputLwcDir = join(defaultMetadataDir, 'lwc', componentName)
  const outputStaticResourcesDir = join(defaultMetadataDir, 'staticresources')
  const outputResourceDir = join(outputStaticResourcesDir, 'fullCalendarLib')
  const context: BuildContext = {
    sourceLwcDir,
    outputLwcDir,
    componentName,
    outputStaticResourcesDir,
    outputResourceDir,
    componentLabel,
    componentDescription,
    transformComponentJs,
  }
  const packageJsonPath = join(packageDir, 'package.json')
  const require = createRequire(packageJsonPath)
  const fcPkgPath = require.resolve('fullcalendar/package.json')
  const fcDistDir = resolveDistDirFromPackageJson(fcPkgPath)

  await rm(distDir, { recursive: true, force: true })

  const themes = await readThemes(join(fcDistDir, 'themes'))
  const locales = await readLocales(join(fcDistDir, 'locales'))

  await copyLwcSource(context, themes, locales)
  await copyStaticResources(context, fcDistDir, themes, locales)
  await writeFile(
    join(outputStaticResourcesDir, 'fullCalendarLib.resource-meta.xml'),
    resourceMetaXmlText,
  )

  if (copyAdditionalStaticResources) {
    await copyAdditionalStaticResources({ outputStaticResourcesDir })
  }
}

export async function writeDerivedLwcMetadata(config: DerivedLwcMetadataConfig) {
  const {
    sourcePath,
    outputPath,
    componentLabel,
    componentDescription,
    targets,
  } = config

  if (!targets.length) {
    throw new Error('Derived LWC metadata requires at least one target')
  }

  const targetNames = targets.join(',')
  const targetElements = targets
    .map((target) => `        <target>${escapeXml(target)}</target>`)
    .join('\n')
  let metadata = await readFile(sourcePath, 'utf8')

  metadata = replaceRequired(
    metadata,
    /<masterLabel>[^<]*<\/masterLabel>/,
    `<masterLabel>${escapeXml(componentLabel)}</masterLabel>`,
    'masterLabel',
  )
  metadata = replaceRequired(
    metadata,
    /<description>[^<]*<\/description>/,
    `<description>${escapeXml(componentDescription)}</description>`,
    'description',
  )
  metadata = replaceRequired(
    metadata,
    /    <targets>[\s\S]*?    <\/targets>/,
    `    <targets>\n${targetElements}\n    </targets>`,
    'targets',
  )
  metadata = replaceRequired(
    metadata,
    /<targetConfig targets="[^"]+">/,
    `<targetConfig targets="${escapeXml(targetNames)}">`,
    'targetConfig targets',
  )

  await writeFile(outputPath, metadata)
}

function replaceRequired(source: string, pattern: RegExp, replacement: string, name: string) {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${name} in generated LWC metadata`)
  }

  return source.replace(pattern, replacement)
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function resolveDistDirFromPackageJson(packageJsonPath: string) {
  const packageDirPath = dirname(packageJsonPath)

  return parse(packageDirPath).base === 'dist'
    ? packageDirPath
    : join(packageDirPath, 'dist')
}

async function copyLwcSource(
  context: BuildContext,
  themes: Map<string, ThemeSpec>,
  locales: string[],
) {
  const {
    sourceLwcDir,
    outputLwcDir,
    componentName,
    componentLabel,
    componentDescription,
    transformComponentJs,
  } = context

  await mkdir(outputLwcDir, { recursive: true })
  await copyFile(
    join(sourceLwcDir, 'fullCalendar.html'),
    join(outputLwcDir, `${componentName}.html`),
  )

  const componentJs = await readFile(join(sourceLwcDir, 'fullCalendar.js'), 'utf8')

  await writeFile(
    join(outputLwcDir, `${componentName}.js`),
    transformComponentJs ? transformComponentJs(componentJs) : componentJs,
  )

  const themeAndPaletteDatasource = Array.from(themes.entries())
    .flatMap(([themeName, themeSpec]) => (
      themeSpec.palettes.map((paletteName) => (
        `${capitalize(themeName)} / ${capitalize(paletteName)}`
      ))
    ))
    .join(',')
  const localeDatasource = ['en', ...locales.filter((locale) => locale !== 'en')].join(',')
  const metaTemplate = await readFile(join(sourceLwcDir, 'fullCalendar.js-meta.xml.template'), 'utf8')

  await writeFile(
    join(outputLwcDir, `${componentName}.js-meta.xml`),
    metaTemplate
      .replace('{{COMPONENT_LABEL}}', componentLabel)
      .replace('{{COMPONENT_DESCRIPTION}}', componentDescription)
      .replace('{{THEME_AND_PALETTE_DATASOURCE}}', themeAndPaletteDatasource)
      .replace('{{LOCALE_DATASOURCE}}', localeDatasource),
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

async function copyStaticResources(
  context: BuildContext,
  fcDistDir: string,
  themes: Map<string, ThemeSpec>,
  locales: string[],
) {
  const { outputResourceDir } = context
  const outputAllDir = join(outputResourceDir, 'all')

  await mkdir(outputResourceDir, { recursive: true })
  await mkdir(outputAllDir, { recursive: true })

  await copyFile(join(fcDistDir, 'all', 'global.js'), join(outputAllDir, 'global.js'))
  await copyFile(join(fcDistDir, 'skeleton.css'), join(outputResourceDir, 'skeleton.css'))

  const outputThemesDir = join(outputResourceDir, 'themes')

  await mkdir(outputThemesDir, { recursive: true })

  for (const [themeName, themeSpec] of themes.entries()) {
    const inputThemeDir = join(fcDistDir, 'themes', themeName)
    const outputThemeDir = join(outputThemesDir, themeName)

    await mkdir(outputThemeDir, { recursive: true })

    await copyFile(join(inputThemeDir, 'global.js'), join(outputThemeDir, 'global.js'))
    await copyFile(join(inputThemeDir, 'theme.css'), join(outputThemeDir, 'theme.css'))

    if (themeName === 'classic') {
      await copyFile(join(inputThemeDir, 'palette.css'), join(outputThemeDir, 'palette.css'))
    } else {
      const outputPaletteDir = join(outputThemeDir, 'palettes')

      await mkdir(outputPaletteDir, { recursive: true })

      for (const paletteName of themeSpec.palettes) {
        await copyFile(
          join(inputThemeDir, 'palettes', `${paletteName}.css`),
          join(outputPaletteDir, `${paletteName}.css`),
        )
      }
    }
  }

  const outputLocalesDir = join(outputResourceDir, 'locales')

  await mkdir(outputLocalesDir, { recursive: true })

  for (const localeName of locales) {
    const outputLocaleDir = join(outputLocalesDir, localeName)

    await mkdir(outputLocaleDir, { recursive: true })
    await copyFile(
      join(fcDistDir, 'locales', localeName, 'global.js'),
      join(outputLocaleDir, 'global.js'),
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
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

async function assertExists(filePath: string) {
  await access(filePath)
}
