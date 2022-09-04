import * as path from 'path'
import { cli, command } from 'cleye'
import { ScriptCliConfig, ScriptConfig } from './script'

export interface RunConfig {
  scriptDir: string
  bin: string
  binName: string
}

export async function run(config: RunConfig): Promise<any> {
  const scriptName = process.argv[2]

  if (typeof scriptName !== 'string') {
    throw new Error('Must specify a script name.')
  }
  if (!scriptName.match(/[a-zA-Z-:]/)) {
    throw new Error(`Script ${scriptName} has invalid name.`)
  }

  const scriptPath = path.join(config.scriptDir, scriptName.replaceAll(':', '/'))
  const scriptExports = await import(scriptPath)
  const scriptCliConfig: ScriptCliConfig = scriptExports.cliConfig || {}

  const argv = cli({
    name: config.binName,
    commands: [
      command({
        name: scriptName,
        ...scriptCliConfig,
      })
    ]
  })

  const commandConfig: ScriptConfig<unknown, unknown> = {
    parameters: argv._,
    flags: argv.flags,
    scriptName,
    cwd: process.cwd(),
    bin: config.bin,
  }

  return scriptExports.default(commandConfig)
}
