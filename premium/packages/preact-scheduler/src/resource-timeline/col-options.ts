import type { ReactNode } from 'react'
import { ClassNameGenerator } from '@fullcalendar/preact/public-api'
import {
  ContentGenerator, DidMountHandler, WillUnmountHandler,
  joinFuncishClassNames, mergeContentInjectors, mergeLifecycleCallbacks, ViewOptionsRefined,
} from '@fullcalendar/preact/protected-api'
import { ensureDimConfigsGrow, parseSiblingDimConfig } from '@full-ui/headless-grid'
import { DEFAULT_RESOURCE_ORDER } from '../resource/resource-hierarchy'
import { ResourceColumnHeaderInfo, ResourceCellInfo } from './info-types'

/*
The spreadsheet's column specs (the resourceColumns option) and the resource-group specs, and
processColOptions, which builds both from a view's options and splits resourceOrder between them
*/

export interface ColHeaderRenderHooks {
  headerClass?: ClassNameGenerator<ResourceColumnHeaderInfo>
  headerInnerClass?: ClassNameGenerator<ResourceColumnHeaderInfo>
  headerResizerClass?: ClassNameGenerator<ResourceColumnHeaderInfo>
  headerContent?: ContentGenerator<ResourceColumnHeaderInfo>
  headerDefault?: (renderProps: ResourceColumnHeaderInfo) => ReactNode
  headerDidMount?: DidMountHandler<ResourceColumnHeaderInfo>
  headerWillUnmount?: WillUnmountHandler<ResourceColumnHeaderInfo>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number | string // string for percentage like '50%'
  field?: string

  cellClass?: ClassNameGenerator<ResourceCellInfo>
  cellInnerClass?: ClassNameGenerator<ResourceCellInfo>
  cellContent?: ContentGenerator<ResourceCellInfo>
  cellDidMount?: DidMountHandler<ResourceCellInfo>
  cellWillUnmount?: WillUnmountHandler<ResourceCellInfo>
}

export interface GroupLaneRenderHooks {
  laneClass?: ClassNameGenerator<ResourceCellInfo>
  laneInnerClass?: ClassNameGenerator<ResourceCellInfo>
  laneContent?: ContentGenerator<ResourceCellInfo>
  laneDidMount?: DidMountHandler<ResourceCellInfo>
  laneWillUnmount?: WillUnmountHandler<ResourceCellInfo>
}

export interface GroupSpec extends GroupLaneRenderHooks {
  field?: string
  order?: number

  labelClass?: ClassNameGenerator<ResourceCellInfo>
  labelInnerClass?: ClassNameGenerator<ResourceCellInfo>
  labelContent?: ContentGenerator<ResourceCellInfo>
  labelDidMount?: DidMountHandler<ResourceCellInfo>
  labelWillUnmount?: WillUnmountHandler<ResourceCellInfo>
}

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
