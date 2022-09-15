import { join as joinPaths, resolve as resolvePath } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile } from 'fs/promises'
import { buildDistShortPath, buildFakeSrcPath, removeRelativePrefix } from './path'

export const srcGlobsProp = 'fileExports'
export const srcGeneratorsProp = 'generatedExports'
export const iifeProp = 'iife'
export const cjsExt = '.cjs'
export const esmExt = '.mjs'
export const iifeExt = '.js'
export const iifeMinExt = '.min.js'
export const dtsExt = '.d.ts'
export const srcJsonPath = resolvePath('./package.json')
export const srcDirAbs = resolvePath('./src')
export const tscDirAbs = resolvePath('./dist/.tsc')
export const scriptsDirAbs = joinPaths(fileURLToPath(import.meta.url), '../../..')

// package.json
// -------------------------------------------------------------------------------------------------

export async function processSrcMeta(dev: boolean) {
  const srcJson = await readFile(srcJsonPath, 'utf8')
  const srcMeta = JSON.parse(srcJson)
  const srcGlobs = srcMeta[srcGlobsProp] || {}
  const srcGenerators = srcMeta[srcGeneratorsProp] || {}
  const exportPaths = buildExportPaths(srcGlobs, srcGenerators)
  const distMeta = buildPkgMeta(srcMeta, exportPaths, dev)

  return { srcGlobs, srcGenerators, srcMeta, distMeta }
}

export async function writeDistMeta(distMeta: any) {
  const pkgJson = JSON.stringify(distMeta, undefined, 2)

  await writeFile('./dist/package.json', pkgJson)
}

function buildExportPaths(
  srcGlobs: { [entryName: string]: string },
  srcGenerators: { [entryName: string]: string },
): { [entryName: string]: string } { // exportPaths
  const exportPaths: { [entryName: string]: string } = {}

  for (const entryName in srcGlobs) {
    exportPaths[entryName] = './' + buildDistShortPath(srcGlobs[entryName])
  }

  for (const entryName in srcGenerators) {
    exportPaths[entryName] = './' + buildDistShortPath(buildFakeSrcPath(entryName))
  }

  return exportPaths
}

function buildPkgMeta(
  srcMeta: any,
  exportPaths: { [entryName: string]: string },
  dev: boolean
): any {
  const distMeta = { ...srcMeta }
  delete distMeta[srcGlobsProp]
  delete distMeta[srcGeneratorsProp]
  delete distMeta[iifeProp]
  delete distMeta.scripts
  delete distMeta.devDependencies

  const mainExportPath = exportPaths['.']
  const mainIifeGlobal = (srcMeta[iifeProp] || {})['.']

  if (!mainExportPath) {
    throw new Error('There must be a root entry file')
  }

  distMeta.main = removeRelativePrefix(mainExportPath + cjsExt)
  distMeta.module = removeRelativePrefix(mainExportPath + esmExt)
  distMeta.types = removeRelativePrefix(mainExportPath + dtsExt)
  distMeta.jsdelivr = removeRelativePrefix(
    mainExportPath + (mainIifeGlobal === undefined ? esmExt : iifeMinExt)
  )

  const exportMap: any = {
    './package.json': './package.json'
  }

  for (let entryName in exportPaths) {
    const exportPath = exportPaths[entryName]

    exportMap[entryName] = {
      require: exportPath + cjsExt,
      import: exportPath + esmExt,
      types: (
        dev
          ? './.tsc/' + removeRelativePrefix(exportPath)
          : exportPath
        ) + dtsExt,
    }
  }

  distMeta.exports = exportMap

  return distMeta
}

// .npmignore
// -------------------------------------------------------------------------------------------------

export async function writeNpmIgnore() {
  await writeFile('./dist/.npmignore', [
    '.tsc',
    'tsconfig.tsbuildinfo',
  ].join("\n"))
}
