import {
  join as joinPaths,
  resolve as resolvePath,
  dirname,
  sep as pathSep,
  isAbsolute,
} from 'path'
import { readFile, writeFile } from 'fs/promises'
import { type Plugin } from 'rollup'
import handlebars from 'handlebars'
import cssnano from 'cssnano'
import { execLive } from '../../utils/exec.ts'
import { standardScriptsDir } from '../../utils/script-runner.ts'
import { type CopyOperation } from './bundle-struct.ts'

// Generated Content
// -------------------------------------------------------------------------------------------------

export function generatedContentPlugin(contentMap: { [path: string]: string }): Plugin {
  return {
    name: 'generated-content',
    resolveId(importId, importerPath) {
      const importPath = computeImportPath(importId, importerPath)

      // whitelist the import path
      if (importPath && contentMap[importPath]) {
        return { id: importPath }
      }
    },
    load(importPath) {
      return contentMap[importPath] // if undefined, fallback to normal file load
    },
  }
}

// Externalize certain packages
// -------------------------------------------------------------------------------------------------

export interface ExternalizePkgsOptions {
  pkgNames: string[],
  moduleSideEffects?: boolean
  debug?: true
}

export function externalizePkgsPlugin(
  { pkgNames, moduleSideEffects, debug }: ExternalizePkgsOptions,
): Plugin {
  return {
    name: 'externalize-pkgs',
    resolveId(importId) {
      if (!isImportRelative(importId)) {
        for (const pkgName of pkgNames) {
          if (importId === pkgName || importId.startsWith(pkgName + '/')) {
            if (debug && !importId.startsWith('/')) {
              console.log('DID externalize', importId)
            }
            return { id: importId, external: true, moduleSideEffects }
          }
        }

        if (debug && !importId.startsWith('/')) {
          console.log('did NOT externalize', importId)
        }
      }
    },
  }
}

// Externalize certain extensions
// -------------------------------------------------------------------------------------------------

export function externalizeExtensionsPlugin(extensionsInput: ExtensionInput): Plugin {
  let extensionMap = normalizeExtensionMap(extensionsInput)

  return {
    name: 'externalize-extensions',
    resolveId(importId) {
      const newImportId = findAndReplaceExtensions(importId, extensionMap)

      if (newImportId) {
        return { id: newImportId, external: true }
      }
    },
  }
}

// Reroot Paths
// -------------------------------------------------------------------------------------------------

export interface RerootOptions {
  oldRoot: string
  newRoot: string
  extensions?: ExtensionInput
}

export function rerootPlugin(options: RerootOptions): Plugin {
  const oldRootAndSep = options.oldRoot + pathSep
  const newRootAndSep = options.newRoot + pathSep
  const extensionMap = options.extensions && normalizeExtensionMap(options.extensions)

  return {
    name: 'reroot',
    resolveId(importId, importerPath) {
      const importPath = computeImportPath(importId, importerPath)

      if (
        (!extensionMap || findAndReplaceExtensions(importId, extensionMap)) &&
        (importPath && importPath.startsWith(oldRootAndSep))
      ) {
        return newRootAndSep + importPath.substring(oldRootAndSep.length)
      }
    },
  }
}

// Copy Files
// -------------------------------------------------------------------------------------------------

export interface CopyFilesOptions {
  srcToDest: CopyOperation[]
  minification?: boolean
}

export function copyFilesPlugin(options: CopyFilesOptions): Plugin {
  return {
    name: 'copy-files',
    buildStart() {
      for (const { src } of options.srcToDest) {
        this.addWatchFile(src)
      }
    },
    async generateBundle() {
      for (const { src, dest } of options.srcToDest) {
        const source = await readFile(src)
        this.emitFile({
          type: 'asset',
          fileName: dest,
          source,
        })
      }
    },
    async writeBundle(outputOptions) {
      if (options.minification) {
        const { dir } = outputOptions
        if (!dir) {
          return this.error('For minification, must specify dir output option')
        }
        await Promise.all(
          options.srcToDest
            .filter(({ minificationDisabled }) => !minificationDisabled)
            .map(({ dest }) => minifyBundleFile(resolvePath(joinPaths(dir, dest))))
        )
      }
    },
  }
}

// Minify
// -------------------------------------------------------------------------------------------------

export function minifyBundleSeparatelyPlugin(): Plugin {
  return {
    name: 'minify-bundle-separately',
    async writeBundle(options, bundles) {
      const { file, dir } = options

      if (file) {
        await minifyBundleFile(resolvePath(file))
      } else if (dir) {
        await Promise.all(
          Object.keys(bundles).map((bundlePath) => {
            return minifyBundleFile(resolvePath(joinPaths(dir, bundlePath)))
          }),
        )
      } else {
        this.error('For minification, must specify dir or file output option')
      }
    },
  }
}

async function minifyBundleFile(path: string): Promise<void> {
  if (path.match(/\.[cm]?js$/)) {
    return minifyJsSeparately(path)
  } else if (path.endsWith('.css')) {
    return minifyCssSeparately(path)
  }
}

async function minifyJsSeparately(path: string): Promise<void> {
  const pathMatch = path.match(/^(.*)(\.[cm]?js)$/)

  if (!pathMatch) {
    throw new Error(`Invalid extension for minification ${path}`)
  }

  return execLive([
    joinPaths(standardScriptsDir, 'node_modules/.bin/terser'),
    '--config-file', 'config/terser.json',
    '--output', pathMatch[1] + '.min' + pathMatch[2],
    '--', path,
  ], {
    cwd: standardScriptsDir,
  })
}

async function minifyCssSeparately(path: string): Promise<void> {
  const cssText = await readFile(path, 'utf8')
  const result = await cssnano({
    preset: ['default', {
      calc: false,
    }],
  }).process(cssText)
  const minPath = path.replace(/\.css$/, '.min.css')
  await writeFile(minPath, result.css)
}

/*
Dormant functionality for making a .style.js file from a CSS file:

  const templatePath = joinPaths(standardScriptsDir, 'config/inject-css.tpl')
  const templateText = await readFile(templatePath, 'utf8')
  const template = handlebars.compile(templateText)

  this.emitFile({
    type: 'asset',
    fileName: fileName.replace(/\.css$/, '.styles.js'),
    source: template({ cssTextAsJson: JSON.stringify(cssText) })
  })
*/

// .d.ts
// -------------------------------------------------------------------------------------------------

/*
Workarounds rollup-plugin-dts
*/
export function massageDtsPlugin(): Plugin {
  return {
    name: 'massage-dts',
    renderChunk(code) {
      // force all import statements (especially auto-generated chunks) to have a .js extension
      // TODO: file a bug. code splitting w/ es2016 modules
      code = code.replace(/(} from ['"])([^'"]*)(['"])/g, (whole, start, importId, end) => {
        if (
          importId.startsWith('./') && // relative ID
          !importId.endsWith('.js')
        ) {
          return start + importId + '.js' + end
        }
        return whole
      })

      return code
    },
  }
}

// Extensions Find & Replace Utils
// -------------------------------------------------------------------------------------------------

type ExtensionMap = { [findExtension: string]: string }
type ExtensionInput = string[] | ExtensionMap

function normalizeExtensionMap(input: ExtensionInput): ExtensionMap {
  let map: ExtensionMap = {}

  if (Array.isArray(input)) {
    for (const extension of input) {
      map[extension] = extension
    }
  } else {
    map = input
  }

  return map
}

function findAndReplaceExtensions(path: string, extensionMap: ExtensionMap): string | undefined {
  for (let extension in extensionMap) {
    if (path.endsWith(extension)) {
      const newExtension = extensionMap[extension]

      return path.substring(0, path.length - extension.length) + newExtension
    }
  }
}

// Import ID Utils
// -------------------------------------------------------------------------------------------------

function computeImportPath(importId: string, importerPath: string | undefined): string | undefined {
  if (isAbsolute(importId)) {
    return importId
  }

  if (isImportRelative(importId)) {
    return importerPath ?
      joinPaths(dirname(importerPath), importId) :
      resolvePath(importId) // from CWD
  }

  // otherwise, probably an external dependency
}

function isImportRelative(importId: string): boolean {
  return importId.startsWith('./') || importId.startsWith('../')
}
