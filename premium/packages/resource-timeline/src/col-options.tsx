import { joinFuncishClassNames, mergeContentInjectors, mergeLifecycleCallbacks, ViewOptionsRefined } from '@fullcalendar/core/internal'
import { ColSpec } from '@fullcalendar/resource'
import { GroupSpec, DEFAULT_RESOURCE_ORDER } from '@fullcalendar/resource/internal'
import { ensureDimConfigsGrow, parseSiblingDimConfig } from './col-positioning.js'

const SPREADSHEET_COL_MIN_WIDTH = 50

export function processColOptions(options: ViewOptionsRefined) {
  let allColSpecs: ColSpec[] = options.resourceAreaColumns || []
  let superHeaderRendering = null

  if (!allColSpecs.length) {
    allColSpecs.push({
      headerDefault: () => 'Resources', // TODO: view.defaults
    })
  } else if (options.resourceAreaHeaderContent) { // weird way to determine if content
    superHeaderRendering = {
      headerClassNames: options.resourceAreaHeaderClassNames,
      headerInnerClassNames: options.resourceAreaHeaderInnerClassNames,
      headerContent: options.resourceAreaHeaderContent,
      headerDidMount: options.resourceAreaHeaderDidMount,
      headerWillUnmount: options.resourceAreaHeaderWillUnmount,
    }
  }

  let resourceColSpecs: ColSpec[] = []
  let groupColSpecs: ColSpec[] = [] // part of the colSpecs, but filtered out in order to put first
  let groupSpecs: GroupSpec[] = []
  let groupRowDepth = 0

  for (let colSpec of allColSpecs) {
    (colSpec.group ? groupColSpecs : resourceColSpecs).push({
      ...colSpec,

      headerClassNames: joinFuncishClassNames(options.resourceAreaHeaderClassNames, colSpec.headerClassNames),
      headerInnerClassNames: joinFuncishClassNames(options.resourceAreaHeaderInnerClassNames, colSpec.headerInnerClassNames),
      headerContent: mergeContentInjectors(options.resourceAreaHeaderContent, colSpec.headerContent),
      headerDidMount: mergeLifecycleCallbacks(options.resourceAreaHeaderDidMount, colSpec.headerDidMount),
      headerWillUnmount: mergeLifecycleCallbacks(options.resourceAreaHeaderWillUnmount, colSpec.headerWillUnmount),

      cellClassNames: joinFuncishClassNames(options.resourceCellClassNames, colSpec.cellClassNames),
      cellContent: mergeContentInjectors(options.resourceCellContent, colSpec.cellContent),
      cellDidMount: mergeLifecycleCallbacks(options.resourceCellDidMount, colSpec.cellDidMount),
      cellWillUnmount: mergeLifecycleCallbacks(options.resourceCellWillUnmount, colSpec.cellWillUnmount),
    })
  }

  if (groupColSpecs.length) {
    groupSpecs = groupColSpecs
  } else {
    groupRowDepth = 1
    let hGroupField = options.resourceGroupField
    if (hGroupField) {
      groupSpecs.push({
        field: hGroupField,

        labelClassNames: options.resourceGroupHeaderClassNames,
        labelContent: options.resourceGroupHeaderContent,
        labelDidMount: options.resourceGroupHeaderDidMount,
        labelWillUnmount: options.resourceGroupHeaderWillUnmount,

        laneClassNames: options.resourceGroupLaneClassNames,
        laneContent: options.resourceGroupLaneContent,
        laneDidMount: options.resourceGroupLaneDidMount,
        laneWillUnmount: options.resourceGroupLaneWillUnmount,
      })
    }
  }

  let allOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
  let plainOrderSpecs = []

  for (let orderSpec of allOrderSpecs) {
    let isGroup = false
    for (let groupSpec of groupSpecs) {
      if (groupSpec.field === orderSpec.field) {
        groupSpec.order = orderSpec.order // -1, 0, 1
        isGroup = true
        break
      }
    }
    if (!isGroup) {
      plainOrderSpecs.push(orderSpec)
    }
  }

  const colSpecs = groupColSpecs.concat(resourceColSpecs)

  const colWidthConfigs = colSpecs.map((colSpec) => (
    parseSiblingDimConfig(
      colSpec.width,
      /* grow = */ undefined,
      SPREADSHEET_COL_MIN_WIDTH,
    )
  ))

  ensureDimConfigsGrow(colWidthConfigs)

  return {
    groupSpecs,
    groupRowDepth,
    orderSpecs: plainOrderSpecs,
    colSpecs,
    groupColCnt: groupColSpecs.length,
    colWidthConfigs,
    superHeaderRendering,
  }
}
