import * as path from 'path'
import { fileURLToPath } from 'url'
import { capture } from './exec.js'
import {
  lockFilename,
  workspaceFilename,
  generateSubdirLock,
  generateSubdirWorkspace,
} from './pnpm.js'
import { parseArgs } from './script.js'

// Directory paths
// -------------------------------------------------------------------------------------------------

export const rootDir = path.join(fileURLToPath(import.meta.url), '../../../..')

export function getSubrepoDir(subrepo: string): string {
  return path.join(rootDir, subrepo)
}

// List of subrepos
// -------------------------------------------------------------------------------------------------

let storedSubrepos: string[] | undefined

export async function getSubrepos(): Promise<string[]> {
  if (storedSubrepos === undefined) {
    storedSubrepos = await querySubrepos()
  }
  return storedSubrepos
}

async function querySubrepos(): Promise<string[]> {
  const { stdout } = await capture([
    'git', 'subrepo', 'status', '--quiet',
  ], {
    cwd: rootDir,
  })
  return stdout.trim().split('\n')
}

// Meta files
// -------------------------------------------------------------------------------------------------

export const metaFileInfo = [
  { path: '.npmrc' },
  { path: '.editorconfig' },
  { path: lockFilename, generator: generateSubdirLock },
  { path: workspaceFilename, generator: generateSubdirWorkspace },
]

export function getAllMetaFiles(subrepos: string[]): string[] {
  const filePaths: string[] = []

  for (let subrepo of subrepos) {
    for (let fileInfo of metaFileInfo) {
      filePaths.push(path.join(subrepo, fileInfo.path))
    }
  }

  return filePaths
}

// Arg parsing
// -------------------------------------------------------------------------------------------------

export async function parseSubrepoArgs<
  Flags extends { [flag: string]: any } | undefined
>(
  rawArgs: string[],
  flagConfig?: Flags,
) {
  const { params, flags, unknownFlags } = parseArgs(rawArgs, {
    ...flagConfig,
    all: Boolean,
  } as Flags & { all: BooleanConstructor }, [
    '[subrepos...]',
  ])

  const allSubrepos = await getSubrepos()
  let subrepos: string[]

  if (flags.all) {
    subrepos = allSubrepos
  } else if (params.length >= 1) {
    subrepos = Array.prototype.slice.call(params, 0)

    for (let chosenSubrepo of subrepos) {
      if (!allSubrepos.includes(chosenSubrepo)) {
        throw new Error(`Subrepo '${chosenSubrepo}' does not exist`)
      }
    }

  } else {
    throw new Error('Must specify individual subrepos or use the --all flag')
  }

  return {
    subrepos,
    flags,
    flagArgs: flagsToArgs(flags),
    unknownFlags,
  }
}

function flagsToArgs(flags: { [flag: string]: any }): string[] {
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
