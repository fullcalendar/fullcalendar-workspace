import { ViewApi, ClassNamesGenerator } from '@fullcalendar/core'
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
}

export interface ResourceLaneData {
  resource: ResourceApi
}

export type ResourceLaneMountData = MountData<ResourceLaneData>

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneData {
  return {
    resource: new ResourceApi(input.context, input.resource),
  }
}

export interface ResourceExpanderData {
  isExpanded: boolean
  direction: 'ltr' | 'rtl' // TODO: DRY
}

// resourceAreaColumns
// -------------------------------------------------------------------------------------------------

export interface ColHeaderRenderHooks {
  headerClass?: ClassNamesGenerator<ResourceColumnHeaderData>
  headerInnerClass?: ClassNamesGenerator<ResourceColumnHeaderData>
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

  cellClass?: ClassNamesGenerator<ResourceCellData>
  cellInnerClass?: ClassNamesGenerator<ResourceCellData>
  cellContent?: CustomContentGenerator<ResourceCellData>
  cellDidMount?: DidMountHandler<ResourceCellMountData>
  cellWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}

export interface GroupLaneRenderHooks {
  laneClass?: ClassNamesGenerator<ResourceCellData>
  laneInnerClass?: ClassNamesGenerator<ResourceCellData>
  laneContent?: CustomContentGenerator<ResourceCellData>
  laneDidMount?: DidMountHandler<ResourceCellMountData>
  laneWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClass?: ClassNamesGenerator<ResourceCellData>
  labelInnerClass?: ClassNamesGenerator<ResourceCellData>
  labelContent?: CustomContentGenerator<ResourceCellData>
  labelDidMount?: DidMountHandler<ResourceCellMountData>
  labelWillUnmount?: WillUnmountHandler<ResourceCellMountData>
}
