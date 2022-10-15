import { rm } from 'fs/promises'
import { join as joinPaths } from 'path'
import { MonorepoConfig, readSrcPkgMeta } from '../pkg/meta.js'
import { live } from '../utils/exec.js'
import { cleanMonorepoArchives, createMonorepoArchives } from './archive.js'
import { buildFilterArgs, workspaceScriptsDir } from './lib.js'

export default async function(...args: string[]) {
  const monorepoDir = process.cwd()
  const monorepoPkgMeta = await readSrcPkgMeta(monorepoDir)
  const monorepoConfig = monorepoPkgMeta.monorepoConfig || {}

  const taskNames = pluckOrderedArgs(args)
  const taskNameMap = strArrayToMap(taskNames)

  if (taskNameMap.clean) {
    await cleanMonorepoArchives(monorepoDir, monorepoConfig)
    await rm(joinPaths(monorepoDir, 'tsconfig.json'), { force: true })

    // TODO: always fail. figure out why. just rerun and will bypass.
    if (pluckFlag(args, 'turbo')) {
      await live([
        joinPaths(workspaceScriptsDir, 'bin/clean-turbo.sh'),
      ], {
        cwd: monorepoDir,
      })
    }
  }

  if (taskNameMap.build || taskNameMap.test || taskNameMap.lint) {
    const isDev = pluckFlag(args, 'dev')
    const isWatch = pluckFlag(args, 'watch')

    if (isDev) {
      console.log('TODO: handle dev')
    }
    if (isWatch) {
      console.log('TODO: handle watch')
    }

    await live([ 'tsc', '-b' ], { cwd: monorepoDir })
  }

  if (!pluckFlag(args, 'all')) {
    args.push(...buildFilterArgs(monorepoConfig))
  }

  args.push(...buildGlobalEnvArgs(monorepoConfig))

  await live([
    joinPaths(workspaceScriptsDir, 'node_modules/turbo/bin/turbo'),
    'run', ...taskNames, ...args,
  ], {
    cwd: monorepoDir,
  })

  if (taskNameMap.build) {
    await createMonorepoArchives(monorepoDir, monorepoConfig)
  }
}

function pluckOrderedArgs(args: string[]): string[] {
  let i = 0

  for (
    i = 0;
    i < args.length && !args[i].match(/^--/);
    i++
  ) {
    // nothing
  }

  return args.splice(0, i)
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

function strArrayToMap(strs: string[]): { [str: string]: true } {
  const map: { [str: string]: true } = {}

  for (const str of strs) {
    map[str] = true
  }

  return map
}

function buildGlobalEnvArgs(monorepoConfig: MonorepoConfig): string[] {
  const relDirs: string[] = ['.'].concat(monorepoConfig.defaultSubtrees || [])
  const globalEnvArgs: string[] = []

  for (let relDir of relDirs) {
    globalEnvArgs.push(
      '--global-deps', `${relDir}/*.{json,js,cjs}`,
      '--global-deps', `${relDir}/scripts/*.{json,js,cjs}`,
      '--global-deps', `${relDir}/scripts/src/**/*`,
      '--global-deps', `${relDir}/scripts/config/**/*`,
    )
  }

  return globalEnvArgs
}
