import { join as joinPaths } from 'path'
import { queryPkgJson, buildFilterArgs } from '../lib/monorepo-struct.js'
import { execLive } from '../lib/exec.js'
import { workspaceScriptsDir } from './monorepo/lib.js'
import { compileTs, compileTsOnly } from '../lib/typescript.js'

const turboPath = joinPaths(workspaceScriptsDir, 'node_modules/turbo/bin/turbo')

export interface RunOptions {
  all: boolean
  dev: boolean
  watch: boolean
}

export default async function(...args: string[]) {
  const monorepoDir = process.cwd()
  const options: RunOptions = {
    dev: pluckFlag(args, 'dev'),
    watch: pluckFlag(args, 'watch'),
    all: pluckFlag(args, 'all'),
  }

  await runTasks(monorepoDir, args, options)
}

export async function runTasks(
  monorepoDir: string,
  runArgs: string[],
  options: RunOptions,
): Promise<void> {
  const monorepoPkgJsonObj = await queryPkgJson(monorepoDir)
  const monorepoConfig = monorepoPkgJsonObj.monorepoConfig || {}
  const isLoneClean = runArgs.length == 1 && runArgs[0] === 'clean'
  const massagedRunArgs = [
    ...runArgs,
    ...(options.all ? [] : buildFilterArgs(monorepoConfig)),
  ]

  if (!isLoneClean) {
    console.log('Compiling ts...')
    await compileTs(monorepoDir)
  }

  const currentEnv = process.env
  const BUILD_ENV = options.dev ? 'dev' : 'prod'

  await execLive([turboPath, 'run', ...massagedRunArgs], {
    cwd: monorepoDir,
    env: {
      ...currentEnv,
      BUILD_ENV,
      BUILD_WATCH_LAZY: '0',
    },
  })

  if (options.watch && !isLoneClean) {
    await Promise.all([
      compileTsOnly(monorepoDir, '', ['--watch', '--pretty']),
      execLive([turboPath, 'run', ...massagedRunArgs, '--parallel'], {
        cwd: monorepoDir,
        env: {
          ...currentEnv,
          BUILD_ENV,
          BUILD_WATCH_LAZY: '1',
        },
      }),
    ])
  }
}

function pluckFlag(args: string[], flagName: string): boolean {
  const fullFlag = `--${flagName}`
  let index: number
  let found = false

  while ((index = args.indexOf(fullFlag)) !== -1) {
    args.splice(index, 1)
    found = true
  }

  return found
}
