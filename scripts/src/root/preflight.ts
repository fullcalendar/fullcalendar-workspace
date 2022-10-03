import { runPkgPreflight } from '../pkg/preflight.js'
import { getOurPkgDirs } from './lib.js'

export default async function() {
  const pkgDirs = await getOurPkgDirs()

  await Promise.all(
    pkgDirs.map(async (pkgDir) => {
      await runPkgPreflight(pkgDir)
    })
  )
}
