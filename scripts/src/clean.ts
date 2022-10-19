import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { ScriptContext } from './utils/script-runner.js'
import { deleteMonorepoArchives } from './archive.js'
import { runTurboTasks } from './utils/turbo.js'
import { MonorepoStruct, traverseMonorepoNoOrder } from './utils/monorepo-struct.js'
import { cleanPkg } from './pkg/clean.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const isQuick = args.includes('--quick')

  await cleanMonorepo(this.monorepoStruct, isQuick, args)
}

export async function cleanMonorepo(
  monorepoStruct: MonorepoStruct,
  isQuick = false,
  turboArgs: string[] = [],
): Promise<void> {
  const { monorepoDir } = monorepoStruct

  await Promise.all([
    deleteGlobalTurboCache(monorepoDir),
    deleteMonorepoArchives(monorepoStruct),
    isQuick ?
      cleanOurPkgs(monorepoStruct) :
      runTurboTasks(monorepoDir, ['clean', ...turboArgs]),
  ])
}

function deleteGlobalTurboCache(monorepoDir: string): Promise<void> {
  return rm(
    joinPaths(monorepoDir, 'node_modules/.cache/turbo'),
    { force: true, recursive: true },
  )
}

function cleanOurPkgs(monorepoStruct: MonorepoStruct): Promise<void> {
  return traverseMonorepoNoOrder(monorepoStruct, (pkgStruct) => {
    // presence of buildConfig means we can clean
    if (pkgStruct.pkgJson.buildConfig) {
      return cleanPkg(pkgStruct.pkgDir)
    }
  })
}
