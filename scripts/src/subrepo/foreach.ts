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
  parameters: ['<subrepo>'],
  flags: {
    all: Boolean,
  }
}

export default async function(config: ScriptConfig<{ scriptName: string }, {}>) {
  return runForEach({
    scriptName: config.scriptArgs[0], // guaranteed via cliConfig
    scriptArgs: config.scriptArgs.slice(1),
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
          subrepo: parameters[0],
        })
      } else {
        throw new Error(`${subrepo} is an invalid subrepo`)
      }
    } else if (parameters.length > 1) {
      return runForEach(config, parameters)
    } else if (config.flags.all) {
      return runForEach(config)
    } else {
      throw new Error('Must specify individual subrepos or use --all flag')
    }
  }
}

// internals
// -------------------------------------------------------------------------------------------------

function runForEach(
  config: { scriptName: string, scriptArgs: string[], bin: string, cwd: string },
  subrepoNames: string[] = Object.keys(rootConfig.subrepos)
): Promise<CloseEvent[]> {
  const commands: ConcurrentlyCommandInput[] = []

  for (const subrepoName of subrepoNames) {
    const newScriptArgs = [subrepoName].concat(
      config.scriptArgs.filter((arg) => arg !== '--all')
    )

    commands.push({
      name: subrepoName,
      prefixColor: 'green',
      command: [
        config.bin,
        config.scriptName,
        ...newScriptArgs,
      ].join(' '), // TODO: fix faulty escaping
      cwd: config.cwd,
    })
  }

  return concurrently(commands).result
}
