import * as util from 'util'
import * as childProcess from 'child_process'
import spawn from 'cross-spawn'

const exec = util.promisify(childProcess.exec)
const execFile = util.promisify(childProcess.execFile)

export function execCapture(command, options = {}) {
  if (typeof command === 'string') {
    return exec(command, options)
      .then((res) => res.stdout)
  } else if (Array.isArray(command)) {
    return execFile(command[0], command.slice(1), options)
      .then((res) => res.stdout)
  } else {
    throw new Error('Invalid command type for execCapture()')
  }
}

export function execLive(command, options = {}) {
  let commandPath
  let commandArgs
  let shell

  if (typeof command === 'string') {
    commandPath = command
    commandArgs = []
    shell = true
  } else if (Array.isArray(command)) {
    commandPath = command[0]
    commandArgs = command.slice(1)
    shell = false
  } else {
    throw new Error('Invalid command type for execLive()')
  }

  const childProcess = spawn(commandPath, commandArgs, {
    stdio: 'inherit', // allow options to override
    ...options,
    shell,
  })

  return new Promise((resolve, reject) => {
    childProcess.on('close', (status) => {
      if (status === 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}
