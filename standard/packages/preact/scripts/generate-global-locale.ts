import { join as joinPaths, basename } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import { globby } from 'globby'
import handlebars from 'handlebars'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')
const templatePath = joinPaths(thisPkgDir, 'src/global/locales/locale.js.tpl')
const localesDir = joinPaths(thisPkgDir, 'src/locales')

export function getWatchPaths() {
  return [templatePath, localesDir]
}

export default async function(config) {
  const localeFilenames = await globby('*.ts', { cwd: localesDir })
  const localeCodes = localeFilenames.map((filename) => filename.replace(/\.ts$/, ''))
  const globSrcMap = {}

  for (const localeCode of localeCodes) {
    const templateText = await readFile(templatePath, 'utf8')
    const template = handlebars.compile(templateText)
    const jsCode = template({ localeCode })

    globSrcMap[localeCode] = jsCode
  }

  return globSrcMap
}
