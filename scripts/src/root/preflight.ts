import { runPkgPreflight } from '../pkg/preflight.js'
import { getNormalPkgDirs } from './lib.js'

export default async function() {
  const pkgDirs = await getNormalPkgDirs()

  await Promise.all(
    pkgDirs.map(async (pkgDir) => {
      await runPkgPreflight(pkgDir)
    })
  )
}
