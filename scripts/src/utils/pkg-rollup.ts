import { join as joinPaths, resolve as resolvePath, isAbsolute, dirname } from 'path'
import {
  Plugin as RollupPlugin,
  OutputOptions as RollupOutputOptions,
} from 'rollup'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'
import dtsPlugin from 'rollup-plugin-dts'
import jsonPlugin from '@rollup/plugin-json'
import postcssPlugin from 'rollup-plugin-postcss'
import sourcemapsPlugin from 'rollup-plugin-sourcemaps'
import {
  buildDistShortPath,
  forceExt,
  getExt,
  isRelative,
  isRelativeDot,
  isWithinDir
} from './path'
import { cjsExt, dtsExt, esmExt, iifeExt, scriptsDirAbs, srcDirAbs, tscDirAbs } from './pkg-meta'

// Rollup input
// -------------------------------------------------------------------------------------------------

export function buildRollupInput(
  srcPaths: { [entryName: string]: string },
): { [distShortPath: string]: string } {
  const rollupInput: { [distShortPath: string]: string } = {}

  for (const entryName in srcPaths) {
    const srcPath = srcPaths[entryName]
    const distShortPath = buildDistShortPath(srcPath)

    rollupInput[distShortPath] = srcPath
  }

  return rollupInput
}

export function buildRollupDtsInput(
  srcPaths: { [entryName: string]: string },
): { [entryName: string]: string } {
  const rollupInput: { [distShortPath: string]: string } = {}

  for (const entryName in srcPaths) {
    const srcPath = srcPaths[entryName]
    const distShortPath = buildDistShortPath(srcPath)

    rollupInput[distShortPath] = `./dist/.tsc/${distShortPath}.d.ts`
  }

  return rollupInput
}

// Rollup outputs
// -------------------------------------------------------------------------------------------------

export function buildEsmOutputOptions(dev: boolean): RollupOutputOptions {
  return {
    format: 'esm',
    dir: './dist',
    entryFileNames: '[name]' + esmExt,
    sourcemap: dev,
  }
}

export function buildCjsOutputOptions(): RollupOutputOptions {
  return {
    format: 'cjs',
    exports: 'auto',
    dir: './dist',
    entryFileNames: '[name]' + cjsExt,
  }
}

// for single output file, because code-splitting is disallowed
export function buildIifeOutputOptions(srcPath: string, iifeGlobal: string): RollupOutputOptions {
  const options: RollupOutputOptions = {
    format: 'iife',
    file: './dist/' + buildDistShortPath(srcPath) + iifeExt,
  }

  if (iifeGlobal) {
    options.name = iifeGlobal
  } else {
    options.exports = 'none'
  }

  return options
}

export function buildDtsOutputOptions(): RollupOutputOptions {
  return {
    format: 'esm',
    dir: './dist',
    entryFileNames: '[name]' + dtsExt,
  }
}

// Rollup plugins
// -------------------------------------------------------------------------------------------------

export function buildRollupPlugins(
  srcStrs: { [fakeSrcPath: string]: string },
  externalize: boolean,
): (RollupPlugin | false)[] {
  return [
    srcStrsPlugin(srcStrs),
    externalize && externalizeOtherPkgsPlugin(),
    externalize && externalizeDotImportsPlugin(),
    tscRerootPlugin(),
    nodeResolvePlugin({ // determines index.js and .js/cjs/mjs
      browser: true, // for xhr-mock (use non-node shims that it wants to)
      preferBuiltins: false // for xhr-mock (use 'url' npm package)
    }),
    commonjsPlugin(), // for moment and moment-timezone
    jsonPlugin(), // for moment-timezone
    sourcemapsPlugin(), // load preexisting sourcemaps
    postcssPlugin({
      config: {
        path: joinPaths(scriptsDirAbs, 'postcss.config.cjs'),
        ctx: {}, // arguments given to config file
      }
    }),
    // TODO: resolve tsconfig.json paths
  ]
}

export function buildRollupDtsPlugins(): RollupPlugin[] {
  return [
    externalizeOtherPkgsPlugin(),
    externalizeDotImportsPlugin(),
    externalizeAssetsPlugin(),
    dtsPlugin(),
    nodeResolvePlugin(), // determines index.js and .js/cjs/mjs
  ]
}

function srcStrsPlugin(srcStrs: { [fakeSrcPath: string]: string }): RollupPlugin {
  return {
    name: 'source-strings',
    async resolveId(id, importer, options) {
      if (options.isEntry && srcStrs[id]) {
        return id // no further resolving
      } else if (importer && srcStrs[importer] && isRelative(id) && !getExt(id).match(/\.css$/)) {
        // handle relative imports from a generated source file
        // HACK until tscRerootPlugin is more robust
        return await this.resolve(
          resolvePath(dirname(importer), id) + '.ts',
          undefined,
          { isEntry: true }
        )
      }
    },
    load(id: string) {
      return srcStrs[id] // if undefined, fallback to normal file load
    },
  }
}

function externalizeOtherPkgsPlugin(): RollupPlugin {
  return {
    name: 'externalize-other-pkgs',
    resolveId(id, importer, options) {
      if (!options.isEntry && !isRelative(id) && !isAbsolute(id)) {
        return { id, external: true }
      }
    },
  }
}

function externalizeDotImportsPlugin(): RollupPlugin {[]
  return {
    name: 'externalize-dot-imports',
    resolveId(id) {
      if (isRelativeDot(id)) {
        // when accessing the package root via '.' or '..', always externalize
        return { id, external: true }
      }
    }
  }
}

function externalizeAssetsPlugin(): RollupPlugin {
  return {
    name: 'externalize-assets',
    resolveId(id, importer) {
      if (importer && isRelative(id) && getExt(id)) {
        return { id, external: true }
      }
    },
  }
}

function tscRerootPlugin(): RollupPlugin {
  return {
    name: 'tsc-reroot',
    resolveId(id, importer, options) {
      if (options.isEntry) {
        // move entrypoints within tsc dirs
        const absPath = resolvePath(id)

        if (isWithinDir(absPath, srcDirAbs)) {
          return tscDirAbs + forceExt(absPath.substring(srcDirAbs.length), '.js')
        }
      } else if (importer && isRelative(id)) {
        // move asset (paths with extensions) back to src
        const ext = getExt(id)

        if (ext) {
          const absPath = joinPaths(dirname(importer), id)

          if (isWithinDir(absPath, tscDirAbs)) {
            return srcDirAbs + absPath.substring(tscDirAbs.length)
          }
        }
      }
    }
  }
}
