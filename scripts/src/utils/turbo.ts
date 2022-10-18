import { execLive } from './exec.js'

export function runTurboTasks(monorepoDir: string, turboRunArgs: string[]): Promise<void> {
  return execLive(['turbo', 'run', ...turboRunArgs], { cwd: monorepoDir })
}
