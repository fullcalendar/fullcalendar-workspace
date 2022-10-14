import * as childProcess from 'child_process'

export declare function execCapture(
  command: string | string[],
  options: childProcess.SpawnOptions = {},
): Promise<string>

export declare function execLive(
  command: string | string[],
  options: childProcess.SpawnOptions = {},
): Promise<void>
