import * as path from 'path'
import * as url from 'url'
import concurrently, { ConcurrentlyCommandInput, CloseEvent } from 'concurrently'
import { ScriptCliConfig, ScriptConfig } from '../utils/script'
import { SubrepoScriptConfig } from '../utils/subrepo'
import rootConfig from '../../../subrepos.config'

const filePath = url.fileURLToPath(import.meta.url)
const rootDir = path.join(filePath, '../../../..')

// when run as `foreach <script name>`
// -------------------------------------------------------------------------------------------------

export const cliConfig: ScriptCliConfig = {
  parameters: ['<script name>'],
}

export default async function(
  config: ScriptConfig<{ scriptName: string }, {}>
) {
  return runForEach({
    scriptName: config.parameters.scriptName,
    flags: config.unknownFlags,
    bin: config.bin,
    cwd: config.cwd,
  })
}

// for giving other scripts for-each functionality
// -------------------------------------------------------------------------------------------------

export function createCliConfig(flags: { [flag: string]: any }): ScriptCliConfig {
  // can't accept ordered parameters. they are always subrepo names
  return {
    flags: {
      ...flags,
      all: Boolean,
    }
  }
}

export function createForEach(
  worker: (config: SubrepoScriptConfig<any>) => Promise<any> | any
) {
  return function(config: ScriptConfig<unknown, { all: boolean }>) {
    const { parameters } = config

    if (parameters.length === 1) {
      const subrepo = parameters[0]

      if (subrepo in rootConfig.subrepos) {
        return worker({
          ...config,
          rootDir,
          subrepo,
        })
      } else {
        throw new Error(`Subrepo '${subrepo}' does not exist`)
      }
    } else if (parameters.length > 1) {
      return runForEach(config, parameters)
    } else if (config.flags.all) {
      return runForEach(config)
    } else {
      throw new Error('Specify individual subrepos or use the --all flag')
    }
  }
}

// internals
// -------------------------------------------------------------------------------------------------

function runForEach(
  config: { scriptName: string, flags: { [name: string]: any }, bin: string, cwd: string },
  subrepoNames: string[] = Object.keys(rootConfig.subrepos)
): Promise<CloseEvent[]> {
  const commands: ConcurrentlyCommandInput[] = []

  for (const subrepoName of subrepoNames) {
    commands.push({
      name: subrepoName,
      prefixColor: 'green',
      command: [
        config.bin,
        config.scriptName,
        subrepoName,
        ...buildFlagArgs(config.flags),
      ].join(' '), // TODO: fix faulty escaping
      cwd: config.cwd,
    })
  }

  return concurrently(commands).result
}

function buildFlagArgs(flags: { [name: string]: any }): string[] {
  const args: string[] = []

  for (let flagName in flags) {
    const flagValue = flags[flagName]

    if (
      flagValue !== undefined &&
      flagName !== 'all'
    ) {
      args.push(`--${flagName}='${flagValue}'`) // TODO: fix faulty escaping
    }
  }

  return args
}
