import { resolve as resolvePath } from 'path'
import { readdir } from 'fs/promises'
import {
  rollup,
  watch as rollupWatch,
  RollupWatcher,
} from 'rollup'
import { watch as watchPaths } from 'chokidar'
import { live } from '../utils/exec'
import {
  iifeMinExt,
  iifeProp,
  processSrcMeta,
  scriptsDirAbs,
  srcJsonPath,
  writeDistMeta,
  writeNpmIgnore
} from '../utils/pkg-meta'
import {
  buildCjsOutputOptions,
  buildDtsOutputOptions,
  buildEsmOutputOptions,
  buildIifeOutputOptions,
  buildRollupDtsInput,
  buildRollupDtsPlugins,
  buildRollupInput,
  buildRollupPlugins
} from '../utils/pkg-rollup'
import { buildFakeSrcPath, isFilenameHidden, removeExt } from '../utils/path'

/*
Must be run from package root.
The `pnpm run` system does this automatically.
*/
export default async function(...args: string[]) {
  if (args.indexOf('--iife-only') !== -1) {
    return runIifeOnly()
  }
  return args.indexOf('--dev') !== -1
    ? runDev()
    : runProd()
}

async function runDev() {
  let rollupWatcher: RollupWatcher | undefined

  const pkgJsonWatcher = watchPaths(srcJsonPath).on('all', async () => {
    if (rollupWatcher) {
      rollupWatcher.close()
    }

    const { srcPaths, srcStrs, distMeta } = await processSrcMetaForBuild(true)

    rollupWatcher = rollupWatch({
      input: buildRollupInput(srcPaths),
      plugins: buildRollupPlugins(srcStrs, true), // externalize=true
      output: buildEsmOutputOptions(true), // dev=true
    })

    await writeDistMeta(distMeta)
  })

  const watcherPromise = new Promise<void>((resolve) => {
    process.once('SIGINT', () => {
      pkgJsonWatcher.close()
      Promise.resolve(rollupWatcher && rollupWatcher.close())
        .then(() => resolve())
    })
  })

  return Promise.all([
    watcherPromise,
    writeNpmIgnore(),
  ])
}

async function runProd() {
  const { srcPaths, srcStrs, srcMeta, distMeta } = await processSrcMetaForBuild(false) // dev=false

  const bundlePromise = rollup({
    input: buildRollupInput(srcPaths),
    plugins: buildRollupPlugins(srcStrs, true), // externalize=true
  }).then((bundle) => {
    return Promise.all([
      bundle.write(buildEsmOutputOptions(false)), // dev=false
      bundle.write(buildCjsOutputOptions())
    ]).then(() => {
      bundle.close()
    })
  })

  const iifeGlobals = srcMeta[iifeProp] || {}
  const iifeBundlePromises = Object.keys(iifeGlobals).map((entryName) => {
    const iifeGlobal = iifeGlobals[entryName]
    const srcPath = srcPaths[entryName]

    return rollup({
      input: srcPath,
      plugins: buildRollupPlugins(srcStrs, false),  // externalize=false
    }).then((bundle) => {
      const options = buildIifeOutputOptions(srcPath, iifeGlobal)

      return bundle.write(options).then(() => Promise.all([
        bundle.close(),
        minifyFile(options.file!),
      ]))
    })
  })

  const dtsBundlePromise = rollup({
    input: buildRollupDtsInput(srcPaths),
    plugins: buildRollupDtsPlugins(),
  }).then((bundle) => {
    return bundle.write(buildDtsOutputOptions()).then(() => {
      return bundle.close()
    })
  })

  return Promise.all([
    bundlePromise,
    ...iifeBundlePromises,
    dtsBundlePromise,
    writeNpmIgnore(),
  ]).then(() => writeDistMeta(distMeta)) // write only after bundled dts files can be pointed to
}

async function runIifeOnly() {
  const { srcPaths, srcStrs, srcMeta, distMeta } = await processSrcMetaForBuild(true) // dev=true

  return Object.keys(srcPaths).map((entryName) => {
    const srcPath = srcPaths[entryName]

    return rollup({
      input: srcPath,
      plugins: buildRollupPlugins(srcStrs, false),  // externalize=false
    }).then((bundle) => {
      const options = buildIifeOutputOptions(srcPath, '')

      return bundle.write(options).then(() => bundle.close())
    })
  })
}

// Dynamic code generation
// -------------------------------------------------------------------------------------------------

async function buildSrcStrs(
  srcGenerators: { [entryName: string]: string },
): Promise<{
  fakeSrcPaths: { [entryName: string]: string }
  srcStrs: { [fakeSrcPath: string]: string }
}> {
  const fakeSrcPaths: { [entryName: string]: string } = {}
  const srcStrs: { [fakeSrcPath: string]: string } = {}

  for (const entryName in srcGenerators) {
    const generatorFile = srcGenerators[entryName]
    const generatorExports = await import(resolvePath(generatorFile))
    const generatorFunc = generatorExports.default

    if (typeof generatorFunc !== 'function') {
      throw new Error('Generator must have a default function export')
    }

    const generatorRes = await generatorFunc(entryName)

    if (typeof generatorRes === 'string') {
      if (entryName.indexOf('*') !== -1) {
        throw new Error('Generator string output can\'t have blob entrypoint name')
      }

      const fakeSrcPath = buildFakeSrcPath(entryName)

      fakeSrcPaths[entryName] = fakeSrcPath
      srcStrs[fakeSrcPath] = generatorRes
    } else if (typeof generatorRes === 'object') {
      if (entryName.indexOf('*') === -1) {
        throw new Error('Generator object output must have blob entrypoint name')
      }

      for (const key in generatorRes) {
        const expandedEntryName = entryName.replace('*', key)
        const fakeSrcPath = buildFakeSrcPath(expandedEntryName)

        fakeSrcPaths[expandedEntryName] = fakeSrcPath
        srcStrs[fakeSrcPath] = generatorRes[key]
      }
    } else {
      throw new Error('Invalid type of generator output')
    }
  }

  return { fakeSrcPaths, srcStrs }
}

// package.json
// -------------------------------------------------------------------------------------------------

async function processSrcMetaForBuild(dev: boolean) {
  const { srcGlobs, srcGenerators, srcMeta, distMeta } = await processSrcMeta(dev)
  const { fakeSrcPaths, srcStrs } = await buildSrcStrs(srcGenerators)
  const srcPaths = { ...(await expandSrcGlobs(srcGlobs)), ...fakeSrcPaths }

  return { srcPaths, srcStrs, srcMeta, distMeta }
}

// Glob
// -------------------------------------------------------------------------------------------------

async function expandSrcGlobs(
  srcGlobs: { [entryName: string]: string },
): Promise<{ [entryName: string]: string }> { //  srcPaths
  const promises: Promise<{ [expandedEntryName: string]: string }>[] = []

  for (let entryName in srcGlobs) {
    promises.push(
      expandSrcGlob(entryName, srcGlobs[entryName])
    )
  }

  const maps = await Promise.all(promises)
  return Object.assign({}, ...maps) // merge all maps
}

async function expandSrcGlob(
  entryName: string,
  srcGlob: string,
): Promise<{ [expandedEntryName: string]: string }> {
  const starIndex = srcGlob.indexOf('*')

  // not a glob
  if (starIndex === -1) {
    return { [entryName]: srcGlob }
  }

  const dirPath = srcGlob.substring(0, starIndex)
  const ext = srcGlob.substring(starIndex + 1)
  const filenames = (await readdir(dirPath)).filter((filename) => !isFilenameHidden(filename))
  const srcPaths: { [entryName: string]: string } = {}

  for (let filename of filenames) {
    if (filename.endsWith(ext)) {
      const filenameNoExt = filename.substring(0, filename.length - ext.length)
      srcPaths[entryName.replace('*', filenameNoExt)] = dirPath + filename
    }
  }

  return srcPaths
}

// JS minification
// -------------------------------------------------------------------------------------------------

async function minifyFile(unminifiedPath: string): Promise<void> {
  return live([
    'pnpm', 'exec', 'terser',
    '--config-file', 'terser.json',
    '--output', resolvePath(removeExt(unminifiedPath) + iifeMinExt),
    '--', resolvePath(unminifiedPath),
  ], {
    cwd: scriptsDirAbs,
  })
}
