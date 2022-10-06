import * as util from 'util'
import * as childProcess from 'child_process'
import spawn from 'cross-spawn'

export function live(
  command: string | string[],
  options: childProcess.SpawnOptions = {},
): Promise<void> {
  let commandPath: string
  let commandArgs: string[]
  let shell: boolean

  if (typeof command === 'string') {
    commandPath = command
    commandArgs = []
    shell = true
  } else if (Array.isArray(command)) {
    commandPath = command[0]
    commandArgs = command.slice(1)
    shell = false
  } else {
    throw new Error('Invalid command type for live()')
  }

  const childProcess = spawn(commandPath, commandArgs, {
    stdio: 'inherit', // allow options to override
    ...options,
    shell,
  })

  return new Promise((resolve, reject) => {
    childProcess.on('close', (status: number | null) => {
      if (status === 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

const exec = util.promisify(childProcess.exec)
const execFile = util.promisify(childProcess.execFile)

export function capture(
  command: string | string[],
  options: childProcess.ExecOptions = {},
): Promise<{ stdout: string, stderr: string }> {
  if (typeof command === 'string') {
    return exec(command, options)
  } else {
    return execFile(command[0], command.slice(1), options)
  }
}
