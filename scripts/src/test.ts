import { ScriptContext } from './utils/script-runner.js'
import { runTurboTasks } from './utils/turbo.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const monorepoDir = this.cwd

  runTurboTasks(
    monorepoDir,
    ['test', '--concurrency=1', '--output-logs=new-only', ...args],
  )
}
