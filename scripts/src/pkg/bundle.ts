import { basename } from 'path'
import { watch } from 'chokidar'
import { default as chalk } from 'chalk'
import { rollup, watch as rollupWatch, RollupOptions, OutputOptions } from 'rollup'
import { MonorepoStruct } from '../utils/monorepo-struct.js'
import { buildPkgBundleStruct, PkgBundleStruct } from './utils/bundle-struct.js'
import { analyzePkg } from '../utils/pkg-analysis.js'
import { buildDtsOptions, buildIifeOptions, buildModuleOptions } from './utils/rollup-presets.js'
import { arrayify, continuousAsync } from '../utils/lang.js'
import { ScriptContext } from '../utils/script-runner.js'
import { untilSigInt } from '../utils/process.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const { monorepoStruct } = this
  const pkgDir = this.cwd
  const pkgJson = monorepoStruct.pkgDirToJson[pkgDir]

  const isWatch = args.includes('--watch')
  const isDev = args.includes('--dev')

  if (!isWatch) {
    await writeBundles(pkgDir, pkgJson, monorepoStruct, isDev)
  } else {
    const stopWatch = await watchBundles(pkgDir, pkgJson, monorepoStruct, isDev)

    await untilSigInt()
    stopWatch()
  }
}

export async function writeBundles(
  pkgDir: string,
  pkgJson: any,
  monorepoStruct: MonorepoStruct,
  isDev: boolean,
): Promise<void> {
  const pkgBundleStruct = await buildPkgBundleStruct(pkgDir, pkgJson)
  const optionsObjs = await buildRollupOptionObjs(pkgBundleStruct, monorepoStruct, isDev)

  await Promise.all(
    optionsObjs.map(async (options) => {
      const bundle = await rollup(options)
      const outputOptionObjs: OutputOptions[] = arrayify(options.output)

      await Promise.all(
        outputOptionObjs.map((outputOptions) => bundle.write(outputOptions)),
      )
    }),
  )
}

export async function watchBundles(
  pkgDir: string,
  pkgJson: any,
  monorepoStruct: MonorepoStruct,
  isDev: boolean,
): Promise<() => void> {
  return continuousAsync(async (rerun: any) => {
    const pkgBundleStruct = await buildPkgBundleStruct(pkgDir, pkgJson)
    const optionsObjs = await buildRollupOptionObjs(pkgBundleStruct, monorepoStruct, isDev)

    const rollupWatcher = rollupWatch(optionsObjs)
    await new Promise<void>((resolve) => {
      rollupWatcher.on('event', (ev) => {
        switch (ev.code) {
          case 'BUNDLE_END':
            console.log(formatWriteMessage(pkgJson.name, ev.input)) // FIX: doesn't always write all
            break
          case 'END':
            resolve()
            break
        }
      })
    })

    const fileWatcher = watch(pkgBundleStruct.miscWatchPaths, { ignoreInitial: true })
    fileWatcher.on('all', (ev, path) => {
      console.log('Rerun???', ev, path)
      rerun()
    })

    return () => {
      rollupWatcher.close()
      fileWatcher.close()
    }
  })
}

async function buildRollupOptionObjs(
  pkgBundleStruct: PkgBundleStruct,
  monorepoStruct: MonorepoStruct,
  isDev: boolean,
): Promise<RollupOptions[]> {
  const { isBundle, isTests } = analyzePkg(pkgBundleStruct.pkgDir)

  const esm = !isTests
  const cjs = !isDev && !isTests
  const moduleSourcemap = isDev || isTests
  const iife = !isDev || isBundle || isTests
  const iifeMinify = !isDev && !isTests
  const iifeSourcemap = isTests
  const dts = !isDev && !isTests

  return [
    ...buildModuleOptions(pkgBundleStruct, esm, cjs, moduleSourcemap),
    ...(iife ? await buildIifeOptions(pkgBundleStruct, monorepoStruct, iifeMinify, iifeSourcemap) : []),
    ...(dts ? [buildDtsOptions(pkgBundleStruct)] : []),
  ]
}

const timeFormat = new Intl.DateTimeFormat('en', {
  timeStyle: 'medium',
})

function formatWriteMessage(pkgName: string, input: any): string {
  const inputStrs = typeof input === 'object' ?
    Object.keys(input) :
    [basename(input)]

  const otherFileCnt = inputStrs.length - 1

  return `[${chalk.grey(timeFormat.format(new Date()))}] ` +
    chalk.green(pkgName + ': ') +
    `Wrote ${inputStrs[0]}` +
    (otherFileCnt ? ` and ${otherFileCnt} other ${otherFileCnt === 1 ? 'file' : 'files'}` : '')
}
