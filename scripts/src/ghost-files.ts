import { join as joinPaths } from 'path'
import { readFile, writeFile, copyFile, rm } from 'fs/promises'
import { execCapture } from '../lib/exec.js'
import { monorepoDir } from './monorepo/lib.js'
import { addFile, assumeUnchanged, boolSuccess, checkoutFile, commitDir, hasDiff } from './subrepo/lib/git.js'
import ghostFileConfigMap, { GhostFileConfig } from '../config/ghost-files.js'

export default async function(...args: string[]) {
  await updateGhostFiles(
    monorepoDir,
    args.indexOf('--no-commit') === -1,
  )
}

async function updateGhostFiles(monorepoDir: string, doCommit = true) {
  const subdirs = await querySubrepoSubdirs(monorepoDir)
  const ghostFilePaths = getGhostFilePaths(monorepoDir, subdirs)

  await revealFiles(ghostFilePaths)
  await generateFiles(monorepoDir, subdirs)
  const anyAdded = await addFiles(ghostFilePaths)

  if (anyAdded && doCommit) {
    await commitDir(monorepoDir, 'subrepo meta file changes')
  }

  // if not committed, files will be seen as staged, even after hiding them
  await hideFiles(ghostFilePaths)
}

// generation

async function generateFiles(monorepoDir: string, subdirs: string[]) {
  await Promise.all(
    subdirs.map((subdir) => generateSubdirFiles(monorepoDir, subdir)),
  )
}

async function generateSubdirFiles(monorepoDir: string, subdir: string): Promise<void> {
  await Promise.all(
    Object.keys(ghostFileConfigMap).map(async (ghostFileSubpath) => {
      const ghostFileConfig = ghostFileConfigMap[ghostFileSubpath]
      await generateSubdirFile(monorepoDir, subdir, ghostFileSubpath, ghostFileConfig)
    }),
  )
}

async function generateSubdirFile(
  monorepoDir: string,
  subdir: string,
  ghostFileSubpath: string,
  ghostFileConfig: GhostFileConfig,
): Promise<void> {
  if (ghostFileConfig.generator) {
    const readOrig = () => readFile(joinPaths(monorepoDir, ghostFileSubpath), 'utf8')
    const res = await ghostFileConfig.generator(readOrig, monorepoDir, subdir)

    if (typeof res === 'string') {
      await writeFile(joinPaths(monorepoDir, subdir, ghostFileSubpath), res)
    }
  } else {
    await copyFile(
      joinPaths(monorepoDir, ghostFileSubpath),
      joinPaths(monorepoDir, subdir, ghostFileSubpath),
    )
  }
}

// subrepo utils

async function querySubrepoSubdirs(monorepoDir: string): Promise<string[]> {
  const s = await execCapture([
    'git', 'subrepo', 'status', '--quiet',
  ], {
    cwd: monorepoDir,
  })
  return s.trim().split('\n')
}

function getGhostFilePaths(monorepoDir: string, subdirs: string[]): string[] {
  const ghostFileSubpaths = Object.keys(ghostFileConfigMap)
  const paths: string[] = []

  for (const subdir of subdirs) {
    for (const ghostFilePath of ghostFileSubpaths) {
      paths.push(joinPaths(monorepoDir, subdir, ghostFilePath))
    }
  }

  return paths
}

// git utils

async function revealFiles(paths: string[]): Promise<void> {
  for (let path of paths) {
    const inIndex = await boolSuccess(assumeUnchanged(path, false))
    if (inIndex) {
      await checkoutFile(path)
    }
  }
}

async function addFiles(paths: string[]): Promise<boolean> {
  let anyAdded = false

  for (let path of paths) {
    if (await hasDiff(path)) {
      await addFile(path)
      anyAdded = true
    }
  }

  return anyAdded
}

async function hideFiles(paths: string[]): Promise<void> {
  for (let path of paths) {
    const inIndex = await boolSuccess(assumeUnchanged(path, true))
    if (inIndex) {
      await rm(path, { force: true })
    }
  }
}
