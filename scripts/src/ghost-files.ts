import { join as joinPaths } from 'path'
import { readFile, writeFile, copyFile } from 'fs/promises'
import { execCapture } from '../lib/exec.js'
import ghostFileConfigMap, { GhostFileConfig, GhostFilesConfigMap } from '../config/ghost-files.js'

export default async function() {
  const monorepoDir = process.cwd() // TODO: better?
  const subdirs = await querySubrepoSubdirs(monorepoDir)

  await Promise.all(
    subdirs.map((subdir) => generateSubdirFiles(monorepoDir, subdir, ghostFileConfigMap)),
  )
}

async function querySubrepoSubdirs(monorepoDir: string): Promise<string[]> {
  const s = await execCapture([
    'git', 'subrepo', 'status', '--quiet',
  ], {
    cwd: monorepoDir,
  })
  return s.trim().split('\n')
}

async function generateSubdirFiles(
  monorepoDir: string,
  subdir: string,
  ghostFileConfigMap: GhostFilesConfigMap,
): Promise<void> {
  await Promise.all(
    Object.keys(ghostFileConfigMap).map(async (ghostFilePath) => {
      const ghostFileConfig = ghostFileConfigMap[ghostFilePath]
      await generateSubdirFile(monorepoDir, subdir, ghostFilePath, ghostFileConfig)
    }),
  )
}

async function generateSubdirFile(
  monorepoDir: string,
  subdir: string,
  ghostFilePath: string,
  ghostFileConfig: GhostFileConfig,
): Promise<void> {
  if (ghostFileConfig.generator) {
    const readOrig = () => readFile(joinPaths(monorepoDir, ghostFilePath), 'utf8')
    const res = await ghostFileConfig.generator(readOrig, monorepoDir, subdir)

    if (typeof res === 'string') {
      await writeFile(joinPaths(monorepoDir, subdir, ghostFilePath), res)
    }
  } else {
    await copyFile(
      joinPaths(monorepoDir, ghostFilePath),
      joinPaths(monorepoDir, subdir, ghostFilePath),
    )
  }
}
