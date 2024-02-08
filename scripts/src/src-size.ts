import { ScriptContext } from '@fullcalendar-scripts/standard/utils/script-runner'
import { PkgStruct, traverseMonorepoGreedy } from '@fullcalendar-scripts/standard/utils/monorepo-struct'
import { analyzePkg } from '@fullcalendar-scripts/standard/utils/pkg-analysis'
import { PkgSrcs, getPkgSrcs, compileSizes, displayTable } from './pkg/src-size.js'

export default async function(this: ScriptContext) {
  const { monorepoStruct } = this
  const pkgSrcsMap: { [name: string]: PkgSrcs } = {}
  const bundles: { [name: string]: string[] } = {}

  await traverseMonorepoGreedy(monorepoStruct, async (pkgStruct: PkgStruct) => {
    const { pkgDir, pkgJson } = pkgStruct
    const pkgAnalysis = analyzePkg(pkgDir)

    if (pkgJson.buildConfig) {
      if (pkgAnalysis.isBundle) {
        bundles[pkgJson.name] = Object.keys(pkgJson.dependencies)
      } else if (!pkgAnalysis.isTests) {
        pkgSrcsMap[pkgJson.name] = await getPkgSrcs(pkgDir)
      }
    }
  })

  const compiledRowMap = await compileSizes(pkgSrcsMap)
  displayTable(compiledRowMap)

  for (const bundleName in bundles) {
    const pkgNames = bundles[bundleName]
    const compiledRowMap = await compileSizes(pkgSrcsMap, pkgNames)

    console.log()
    console.log(bundleName)
    displayTable(compiledRowMap)
  }
}
