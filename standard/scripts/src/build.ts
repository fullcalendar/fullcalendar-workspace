import { type ScriptContext } from './utils/script-runner.ts'
import { writeMonorepoArchives } from './archive.ts'
import { runTurboTasks } from './utils/turbo.ts'
import { refineFilterArgs } from './utils/monorepo-config.ts'

export default async function(this: ScriptContext, ...args: string[]) {
  const monorepoDir = this.cwd
  const { monorepoStruct } = this

  await runTurboTasks(monorepoDir, ['build', ...refineFilterArgs(args, monorepoStruct)])

  console.log()
  console.log('NOTE: archive-generation has been temporarily disabled')
  console.log()
  // await writeMonorepoArchives(monorepoStruct)
}
