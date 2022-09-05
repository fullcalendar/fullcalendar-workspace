import * as path from 'path'
import { cli } from 'cleye'
import chalk from 'chalk'

import { ScriptCliConfig, ScriptConfig } from './script'

export interface RunConfig {
  scriptDir: string
  bin: string
  binName: string
}

export async function run(config: RunConfig): Promise<any> {
  try {
    const scriptName = process.argv[2]
    const scriptArgs = process.argv.slice(3)

    if (typeof scriptName !== 'string') {
      throw new Error('Specify a script name.')
    }
    if (!scriptName.match(/^[a-zA-Z][a-zA-Z-:]*$/)) {
      throw new Error(`Script '${scriptName}' has invalid name.`)
    }

    const scriptPath = path.join(config.scriptDir, scriptName.replaceAll(':', '/'))
    let scriptExports: any

    try {
      scriptExports = await import(scriptPath)
    } catch(error: any) {
      throw new Error(`Script '${scriptName}' does not exist.`)
    }

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

    await scriptExports.default(commandConfig)
  } catch (error: any) {
    console.error(chalk.red(error.message))
    console.error()
    console.error(error)
  }
}
