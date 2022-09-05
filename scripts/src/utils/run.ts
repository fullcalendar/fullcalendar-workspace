import * as path from 'path'
import { cli } from 'cleye'
import { ScriptCliConfig, ScriptConfig } from './script'

export interface RunConfig {
  scriptDir: string
  bin: string
  binName: string
}

export async function run(config: RunConfig): Promise<any> {
  const scriptName = process.argv[2]
  const scriptArgs = process.argv.slice(3)

  if (typeof scriptName !== 'string') {
    throw new Error('Must specify a script name.')
  }
  if (!scriptName.match(/^[a-zA-Z][a-zA-Z-:]*$/)) {
    throw new Error(`Script ${scriptName} has invalid name.`)
  }

  const scriptPath = path.join(config.scriptDir, scriptName.replaceAll(':', '/'))
  const scriptExports = await import(scriptPath)
  const scriptCliConfig: ScriptCliConfig = scriptExports.cliConfig || {}

  const argv = cli({
    name: scriptName.replaceAll(':', '-'), // TODO: have cleye accept colons
    ...scriptCliConfig,
  }, undefined, scriptArgs)

  const commandConfig: ScriptConfig<unknown, unknown> = {
    scriptName,
    scriptArgs,
    parameters: argv._,
    flags: argv.flags,
    cwd: process.cwd(),
    bin: config.bin,
  }

  return scriptExports.default(commandConfig)
}
