import { join as joinPaths } from 'path'
import { rm } from 'fs/promises'
import { ScriptContext } from './utils/script-runner.js'
import { deleteMonorepoArchives } from './archive.js'
import { runTurboTasks } from './utils/turbo.js'
import { MonorepoStruct } from './utils/monorepo-struct.js'

export default async function(this: ScriptContext, ...args: string[]) {
  await cleanMonorepo(this.monorepoStruct)
}

export async function cleanMonorepo(
  monorepoStruct: MonorepoStruct,
  turboArgs: string[] = [],
): Promise<void> {
  const { monorepoDir } = monorepoStruct

  await Promise.all([
    deleteGlobalTurboCache(monorepoDir),
    deleteMonorepoArchives(monorepoStruct),
    runTurboTasks(monorepoDir, ['clean', ...turboArgs]),
  ])
}

function deleteGlobalTurboCache(monorepoDir: string): Promise<void> {
  return rm(
    joinPaths(monorepoDir, 'node_modules/.cache/turbo'),
    { force: true, recursive: true },
  )
}
