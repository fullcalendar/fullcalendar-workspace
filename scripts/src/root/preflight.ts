import { readSrcPkgMeta } from '../pkg/meta.js'
import { runPkgPreflight } from '../pkg/preflight.js'
import { getNormalPkgDirs } from './lib.js'

export default async function() {
  const pkgDirs = await getNormalPkgDirs()

  await Promise.all(
    pkgDirs.map(async (pkgDir) => {
      const pkgMeta = await readSrcPkgMeta(pkgDir)

      if (
        pkgMeta.buildConfig &&
        pkgMeta.publishConfig?.linkDirectory
      ) {
        await runPkgPreflight(pkgDir)
      }
    })
  )
}
