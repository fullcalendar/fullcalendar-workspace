import { ScriptContext } from './utils/script-runner.js'
import { writeMonorepoArchives } from './archive.js'
import { runTurboTasks } from './utils/turbo.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const monorepoDir = this.cwd

  await runTurboTasks(monorepoDir, ['lint', 'build', 'test', ...args])
  await writeMonorepoArchives(this.monorepoStruct)
}
