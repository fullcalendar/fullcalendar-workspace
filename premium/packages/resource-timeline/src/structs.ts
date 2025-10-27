import { ViewApi, ClassNameGenerator } from '@fullcalendar/core'
import { CustomContentGenerator, DidMountHandler, WillUnmountHandler, MountData, CalendarContext } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'

export interface ResourceColumnHeaderData {
  view: ViewApi
}
export type ResourceColumnHeaderMountData = MountData<ResourceColumnHeaderData>

export interface ResourceCellData {
  resource?: ResourceApi
  fieldValue: any
  view: ViewApi
}
export type ResourceCellMountData = MountData<ResourceCellData>

export interface ResourceGroupHeaderData {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupHeaderMountData = MountData<ResourceGroupHeaderData>

export interface ResourceGroupLaneData {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupLaneMountData = MountData<ResourceGroupLaneData>

export interface ResourceLaneContentArgInput {
  resource: Resource
  context: CalendarContext
  isCompact: boolean,
}

export interface ResourceLaneData {
  resource: ResourceApi
  isCompact: boolean
}

export type ResourceLaneMountData = MountData<ResourceLaneData>

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneData {
  return {
    resource: new ResourceApi(input.context, input.resource),
    isCompact: input.isCompact,
  }
}

export interface ResourceExpanderData {
  isExpanded: boolean
}

// resourceAreaColumns
// -------------------------------------------------------------------------------------------------

export interface ColHeaderRenderHooks {
  headerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerInnerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerResizerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerContent?: CustomContentGenerator<ResourceColumnHeaderData>
  headerDefault?: (renderProps: ResourceColumnHeaderData) => ComponentChild
  headerDidMount?: DidMountHandler<ResourceColumnHeaderMountData>
  headerWillUnmount?: WillUnmountHandler<ResourceColumnHeaderMountData>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number | string // string for percentage like '50%'
  field?: string

  cellClass?: ClassNameGenerator<ResourceCellData>
  cellInnerClass?: ClassNameGenerator<ResourceCellData>
  cellContent?: CustomContentGenerator<ResourceCellData>
  cellDidMount?: DidMountHandler<ResourceCellMountData>
  cellWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}

export interface GroupLaneRenderHooks {
  laneClass?: ClassNameGenerator<ResourceCellData>
  laneInnerClass?: ClassNameGenerator<ResourceCellData>
  laneContent?: CustomContentGenerator<ResourceCellData>
  laneDidMount?: DidMountHandler<ResourceCellMountData>
  laneWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClass?: ClassNameGenerator<ResourceCellData>
  labelInnerClass?: ClassNameGenerator<ResourceCellData>
  labelContent?: CustomContentGenerator<ResourceCellData>
  labelDidMount?: DidMountHandler<ResourceCellMountData>
  labelWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}
