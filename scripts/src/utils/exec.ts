import { SpawnOptions } from 'child_process'
import spawn from 'cross-spawn'

export function live(command: string | string[], options: SpawnOptions = {}): Promise<void> {
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
    ...options,
    shell,
    stdio: 'inherit',
  })

  return new Promise((resolve, reject) => {
    childProcess.on('close', (status: number | null) => {
      if (status === null || status !== 0) {
        reject()
      } else {
        resolve()
      }
    })
  })
}
