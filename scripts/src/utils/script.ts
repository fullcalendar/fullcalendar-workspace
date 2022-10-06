import * as path from 'path'
import { concurrently } from 'concurrently'
import chalk from 'chalk'
import { cli } from 'cleye'

const [
  currentBin,
  currentMain,
  currentScriptName,
  ...currentScriptArgs
] = process.argv

const prefixColors = [
  'green',
]

export async function runMain() {
  try {
    const func = await getScriptFunc(currentScriptName)
    await func(...currentScriptArgs)
  } catch (error: any) {
    console.error(chalk.red(error.message || 'Error'))
    // console.error(error)
    process.exit(1)
  }
}

/*
Will prefix output with `scriptName`
*/
export async function run(
  scriptName: string,
  args: string[] = [],
): Promise<void> {
  return concurrently(
    [{
      name: scriptName,
      command: buildCommand(
        absolutizeScriptName(scriptName),
        args,
      ),
    }],
    {
      prefixColors,
    },
  ).result.then()
}

/*
Will prefix output with each `scriptName`
*/
export async function runParallel(
  scriptNamesAndArgs: string[] | { [scriptName: string]: string[] },
  extraArgs: string[] = [],
  group: boolean = false,
): Promise<void> {
  return concurrently(
    normalizeArgSet(scriptNamesAndArgs).map((scriptNameAndArgs) => ({
      name: scriptNameAndArgs[0],
      command: buildCommand(
        absolutizeScriptName(scriptNameAndArgs[0]),
        scriptNameAndArgs.slice(1).concat(extraArgs),
      ),
    })),
    {
      prefixColors,
      group,
    },
  ).result.then()
}

/*
Will prefix output by each `firstArg`
*/
export async function spawnParallel(
  scriptName: string,
  argSet: string[] | { [firstArg: string]: string[] },
  extraArgs: string[] = [],
  group: boolean = false,
): Promise<void> {
  return concurrently(
    normalizeArgSet(argSet).map((argArray) => ({
      name: argArray[0],
      command: buildCommand(
        absolutizeScriptName(scriptName),
        argArray.concat(extraArgs),
      ),
    })),
    {
      prefixColors,
      group,
    },
  ).result.then()
}

async function getScriptFunc(scriptName: string): Promise<(...args: string[]) => Promise<any> | any> {
  const scriptRootDir = path.join(currentMain, '../')
  const scriptNameParts = scriptName.split(':')
  let scriptExports: any
  let scriptFunc: (() => Promise<any> | any) | undefined

  try {
    scriptExports = await import(path.join(scriptRootDir, ...scriptNameParts))
  } catch (error: any) {
    // continue regardless of error
  }

  if (scriptExports) {
    scriptFunc = scriptExports.default

    if (typeof scriptFunc !== 'function') {
      throw new Error(
        `Default export of script '${path.join(...scriptNameParts)}' must be a function`,
      )
    }
  } else if (scriptNameParts.length > 1) {
    const exportName = scriptNameParts.pop()!

    try {
      scriptExports = await import(path.join(scriptRootDir, ...scriptNameParts))
    } catch (error: any) {
      // continue regardless of error
    }

    if (scriptExports) {
      scriptFunc = scriptExports[exportName]

      if (typeof scriptFunc !== 'function') {
        throw new Error(
          `Export '${exportName}' of script '${path.join(...scriptNameParts)}' must be a function`,
        )
      }
    }
  }

  if (!scriptFunc) {
    throw new Error(`Could not find script '${scriptName}'`)
  }

  return scriptFunc
}

function buildCommand(scriptName: string, args: string[]): string {
  return [
    currentBin,
    currentMain,
    scriptName,
    ...args,
  ].join(' ') // TODO: better escaping
}

function absolutizeScriptName(scriptName: string): string {
  // TODO: more robust
  return scriptName.replace(/^\.:/, `${currentScriptName}:`)
}

function normalizeArgSet(
  argSet: string[] | { [item0: string]: string[] },
): string[][] {
  const res: string[][] = []

  if (Array.isArray(argSet)) {
    for (let item0 of argSet) {
      res.push([item0])
    }
  } else {
    for (let item0 in argSet) {
      res.push([item0].concat(argSet[item0]))
    }
  }

  return res
}

export function parseArgs<
  Flags extends { [flag: string]: any } | undefined,
  Params extends string[] | undefined
>(
  args: string[],
  flagConfig: Flags,
  paramConfig?: Params,
): any {
  const res = cli({
    name: currentScriptName.replaceAll(':', '-'), // TODO: have cleye accept colons
    parameters: paramConfig,
    flags: flagConfig,
  }, undefined, args)

  return { params: res._, flags: res.flags, unknownFlags: res.unknownFlags }
}
