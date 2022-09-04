import * as path from 'path'
import { cli, command } from 'cleye'
import { CommandCliConfig, CommandConfig } from './command'

export interface RunConfig {
  commandDir: string
  bin: string
  binName: string
}

export async function run(config: RunConfig) {
  const commandName = process.argv[2]

  if (typeof commandName !== 'string') {
    throw new Error('Must specify a script name.')
  }
  if (!commandName.match(/[a-zA-Z-:]/)) {
    throw new Error(`Script ${commandName} has invalid name.`)
  }

  const commandPath = path.join(config.commandDir, commandName.replaceAll(':', '/'))
  const commandExports = await import(commandPath)
  const commandCliConfig: CommandCliConfig = commandExports.cliConfig || {}

  const argv = cli({
    name: config.binName,
    commands: [
      command({
        name: commandName,
        ...commandCliConfig,
      })
    ]
  })

  const commandConfig: CommandConfig<unknown, unknown> = {
    parameters: argv._,
    flags: argv.flags,
    commandName: argv.command!,
    cwd: process.cwd(),
    bin: config.bin,
  }

  commandExports.default(commandConfig)
}
