import * as path from 'path'
import { cli } from 'cleye'
import concurrently from 'concurrently'
import chalk from 'chalk'
import { getLoaderArgs } from './tsx'

const [
  currentBin,
  currentMain,
  currentScript,
  ...currentScriptArgs
] = process.argv

let currentRunScript: string

export function runMain() {
  run(currentScript, currentScriptArgs).catch((error: any) => {
    if (error.message) {
      console.error(chalk.red(error.message))
      console.error()
      console.error(error)
    } else {
      console.error(chalk.red('Error'))
    }
    process.exit(1)
  })
}

export async function run(scriptName: string, rawArgs: string[]): Promise<unknown> {
  currentRunScript = scriptName
  const scriptFunc = await getScriptFunc(scriptName)
  return scriptFunc(...rawArgs)
}

export async function runMap(scriptMap: { [scriptName: string]: string[] }): Promise<unknown> {
  const scriptNames = Object.keys(scriptMap)

  if (scriptNames.length === 1) {
    const scriptName = scriptNames[0]
    return run(scriptName, scriptMap[scriptName])
  } else {
    return concurrently(
      scriptNames.map((scriptName) => {
        const rawArgs = scriptMap[scriptName]
        return {
          name: scriptName,
          prefixColor: 'green',
          command: [
            currentBin,
            ...getLoaderArgs(),
            currentMain,
            scriptName,
            ...rawArgs,
          ].join(' '), // TODO: fix faulty escaping
        }
      }),
      {
        // group: true
      },
    ).result
  }
}

/*
Might be best to *require* rawArgs, and filter away --all and positional args
*/
export async function runEach(
  scriptNameOrFunc: string | ((...rawArgs: string[]) => any),
  firstArgs: string[],
  rawArgsOrFlags: string[] | { [flag: string]: any } = [],
): Promise<unknown> {
  let scriptName: string
  let scriptFunc: (...rawArgs: string[]) => any

  if (typeof scriptNameOrFunc === 'function') {
    scriptName = currentRunScript || currentScript
    scriptFunc = scriptNameOrFunc
  } else {
    scriptName = scriptNameOrFunc
    scriptFunc = await getScriptFunc(scriptName)
  }

  let rawArgs: string[]

  if (Array.isArray(rawArgsOrFlags)) {
    rawArgs = rawArgsOrFlags
  } else {
    rawArgs = constructArgsFromFlags(rawArgsOrFlags)
  }

  if (firstArgs.length === 1) {
    return scriptFunc(...[firstArgs[0]].concat(rawArgs))
  } else {
    return concurrently(
      firstArgs.map((firstArg) => {
        return {
          name: firstArg,
          prefixColor: 'green',
          command: [
            currentBin,
            ...getLoaderArgs(),
            currentMain,
            scriptName,
            firstArg,
            ...rawArgs,
          ].join(' '), // TODO: fix faulty escaping
        }
      }),
      {
        prefix: typeof scriptNameOrFunc === 'function'
          ? '[{name}]' // self-loop doesn't need script name
          : `[${scriptName}][{name}]`,
        // group: true
      },
    ).result
  }
}

export function constructArgsFromFlags(flags: { [flag: string]: any }): string[] {
  const rawArgs: string[] = []

  for (const flag in flags) {
    if (flag !== 'all') {
      const flagValue = flags[flag]
      if (flagValue !== undefined) {
        rawArgs.push(`--${flag}='${flagValue}'`) // TODO: fix faulty escaping
      }
    }
  }

  return rawArgs
}

export function parseArgs<
  Flags extends { [flag: string]: any } | undefined,
  Params extends string[] | undefined
>(
  rawArgs: string[],
  flagConfig: Flags,
  paramConfig?: Params,
) {
  const res = cli({
    name: currentScript.replaceAll(':', '-'), // TODO: have cleye accept colons
    parameters: paramConfig,
    flags: flagConfig
  }, undefined, rawArgs)

  return { params: res._, flags: res.flags, unknownFlags: res.unknownFlags }
}

async function getScriptFunc(scriptName: string): Promise<(...rawArgs: string[]) => any> {
  const scriptRootDir = path.join(currentMain, '../')
  const scriptPath = path.join(scriptRootDir, scriptName.replaceAll(':', '/'))
  const scriptExports = await import(scriptPath)

  if (typeof scriptExports.default !== 'function') {
    throw new Error(`Script '${scriptName}' does not have a default function export`)
  }

  return scriptExports.default
}
