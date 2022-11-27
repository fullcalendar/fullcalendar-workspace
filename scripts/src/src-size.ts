import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import { PkgStruct, traverseMonorepoGreedy } from '@fullcalendar/standard-scripts/utils/monorepo-struct'
import { analyzePkg } from '@fullcalendar/standard-scripts/utils/pkg-analysis'
import { PkgSrcSizes, PkgSrcSizeStrs, getSrcSizes, pkgSrcSizesToStrs } from './pkg/src-size.js'

export default async function(this: ScriptContext) {
  const { monorepoStruct } = this
  const totalSizes: PkgSrcSizes = { componentSize: 0, nonComponentSize: 0, totalSize: 0 }
  const rows: { [name: string]: PkgSrcSizeStrs } = {}

  await traverseMonorepoGreedy(monorepoStruct, async (pkgStruct: PkgStruct) => {
    const { pkgDir, pkgJson } = pkgStruct
    const pkgAnalysis = analyzePkg(pkgDir)

    if (
      pkgJson.buildConfig &&
      !pkgAnalysis.isBundle &&
      !pkgAnalysis.isTests
    ) {
      const sizes = await getSrcSizes(pkgDir)
      rows[pkgJson.name] = pkgSrcSizesToStrs(sizes)

      totalSizes.componentSize += sizes.componentSize
      totalSizes.nonComponentSize += sizes.nonComponentSize
      totalSizes.totalSize += sizes.totalSize
    }
  })

  rows.TOTAL = pkgSrcSizesToStrs(totalSizes)
  console.table(rows)
}
