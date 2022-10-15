import * as childProcess from 'child_process'

export declare function execCapture(
  command: string | string[],
  options?: childProcess.SpawnOptions,
): Promise<string>

export declare function execLive(
  command: string | string[],
  options?: childProcess.SpawnOptions,
): Promise<void>

export declare function execSilent(
  command: string | string[],
  options?: childProcess.SpawnOptions,
): Promise<void>

export class ExecError extends Error {
  exitCode: number | null
}
