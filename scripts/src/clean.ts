import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { ScriptContext } from './utils/script-runner.js'
import { deleteMonorepoArchives } from './archive.js'
import { runTurboTasks } from './utils/turbo.js'
import { MonorepoStruct, traverseMonorepoGreedy } from './utils/monorepo-struct.js'
import { cleanPkg } from './pkg/clean.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const isFast = args.includes('-f') // "fast" aka "force"

  await cleanMonorepo(this.monorepoStruct, isFast, args)
}

export async function cleanMonorepo(
  monorepoStruct: MonorepoStruct,
  isFast = false,
  turboArgs: string[] = [],
): Promise<void> {
  const { monorepoDir } = monorepoStruct

  await Promise.all([
    deleteGlobalTurboCache(monorepoDir),
    deleteMonorepoArchives(monorepoStruct),
    isFast ?
      cleanPkgsDirectly(monorepoStruct) :
      runTurboTasks(monorepoDir, ['clean', ...turboArgs]),
  ])
}

function deleteGlobalTurboCache(monorepoDir: string): Promise<void> {
  return rm(
    joinPaths(monorepoDir, 'node_modules/.cache/turbo'),
    { force: true, recursive: true },
  )
}

function cleanPkgsDirectly(monorepoStruct: MonorepoStruct): Promise<void> {
  return traverseMonorepoGreedy(monorepoStruct, (pkgStruct) => {
    if (pkgStruct.pkgJson.buildConfig) {
      return cleanPkg(pkgStruct.pkgDir)
    }
  })
}
