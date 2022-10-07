import { MonorepoConfig, readSrcPkgMeta } from '../pkg/meta.js'
import { runPkgPreflight } from '../pkg/preflight.js'
import { getOurPkgDirs } from './lib.js'

export default async function() {
  const monorepoDir = process.cwd()
  const monorepoPkgMeta = await readSrcPkgMeta(monorepoDir)
  const monorepoConfig = monorepoPkgMeta.monorepoConfig || {}

  await runMonorepoPreflight(monorepoDir, monorepoConfig)
}

export async function runMonorepoPreflight(
  monorepoDir: string,
  monorepoConfig: MonorepoConfig,
) {
  const pkgDirs = await getOurPkgDirs(monorepoDir, monorepoConfig)

  await Promise.all(
    pkgDirs.map(async (pkgDir) => {
      await runPkgPreflight(pkgDir)
    }),
  )
}
