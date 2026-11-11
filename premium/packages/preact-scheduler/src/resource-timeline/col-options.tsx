import { joinFuncishClassNames, mergeContentInjectors, mergeLifecycleCallbacks, ViewOptionsRefined, warn } from '@fullcalendar/preact/protected-api'
import type { CssDimValue } from '@fullcalendar/preact/public-api'
import { DEFAULT_RESOURCE_ORDER } from '../resource/resources-crud'
import { DimConfig, ensureDimConfigsGrow, parseDimConfig, toSiblingDimConfig } from '@full-ui/headless-grid'
import { GroupSpec, ColSpec } from './structs'

const SPREADSHEET_COL_MIN_WIDTH = 50

export function processColOptions(options: ViewOptionsRefined) {
  let allColSpecs: ColSpec[] = options.resourceColumns || []
  let superHeaderRendering = null

  if (!allColSpecs.length) {
    allColSpecs.push({
      headerDefault: () => 'Resources', // TODO: view.defaults
    })
  } else if (options.resourceColumnHeaderContent) { // weird way to determine if content
    superHeaderRendering = {
      headerClass: options.resourceColumnHeaderClass,
      headerInnerClass: options.resourceColumnHeaderInnerClass,
      headerContent: options.resourceColumnHeaderContent,
      headerDidMount: options.resourceColumnHeaderDidMount,
      headerWillUnmount: options.resourceColumnHeaderWillUnmount,
    }
  }

  let resourceColSpecs: ColSpec[] = []
  let groupColSpecs: ColSpec[] = [] // part of the colSpecs, but filtered out in order to put first
  let groupSpecs: GroupSpec[] = []
  let groupRowDepth = 0
  let foundMainColSpec = false

  for (let colSpec of allColSpecs) {
    (colSpec.group ? groupColSpecs : resourceColSpecs).push({
      ...colSpec,
      isMain: (
        (!colSpec.group && !foundMainColSpec)
          ? (foundMainColSpec = true)
          : false
      ),

      headerClass: joinFuncishClassNames(options.resourceColumnHeaderClass, colSpec.headerClass, 'resourceColumnHeaderClass'),
      headerInnerClass: joinFuncishClassNames(options.resourceColumnHeaderInnerClass, colSpec.headerInnerClass, 'resourceColumnHeaderInnerClass'),
      headerResizerClass: joinFuncishClassNames(options.resourceColumnResizerClass, colSpec.headerResizerClass, 'resourceColumnResizerClass'),
      headerContent: mergeContentInjectors(options.resourceColumnHeaderContent, colSpec.headerContent),
      headerDidMount: mergeLifecycleCallbacks(options.resourceColumnHeaderDidMount, colSpec.headerDidMount),
      headerWillUnmount: mergeLifecycleCallbacks(options.resourceColumnHeaderWillUnmount, colSpec.headerWillUnmount),

      cellClass: joinFuncishClassNames(options.resourceCellClass, colSpec.cellClass, 'resourceCellClass'),
      cellInnerClass: joinFuncishClassNames(options.resourceCellInnerClass, colSpec.cellInnerClass, 'resourceCellInnerClass'),
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

        labelClass: options.resourceGroupHeaderClass,
        labelInnerClass: options.resourceGroupHeaderInnerClass,
        labelContent: options.resourceGroupHeaderContent,
        labelDidMount: options.resourceGroupHeaderDidMount,
        labelWillUnmount: options.resourceGroupHeaderWillUnmount,

        laneClass: options.resourceGroupLaneClass,
        laneInnerClass: options.resourceGroupLaneInnerClass,
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
    toSiblingDimConfig(
      parseDimOption(
        colSpec.width,
        SPREADSHEET_COL_MIN_WIDTH,
        'resource column `width`',
        'The column grows to fill the space instead.',
      ),
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

/*
Only a number, px or % parses. Anything else warns, naming the option and what happens instead
*/
export function parseDimOption(
  input: CssDimValue | undefined,
  minDim: number,
  name: string,
  fallback: string,
): DimConfig | undefined {
  const dimConfig = parseDimConfig(input, minDim)

  if (input != null && !dimConfig) {
    warn(`Invalid ${name}: ${JSON.stringify(input)}. Expected a number, or a string in px or %. ${fallback}`)
  }
  return dimConfig
}
