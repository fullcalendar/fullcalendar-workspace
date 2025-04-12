import { ViewApi, ClassNamesGenerator } from '@fullcalendar/core'
import { CustomContentGenerator, DidMountHandler, WillUnmountHandler, MountArg } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'
import { ResourceApi } from '../api/ResourceApi.js'

// NOTE: strange to reference columns in resource-common

// vresource header
export interface ResourceDayHeaderContentArg {
  resource: ResourceApi
  text: string
  isDisabled: boolean
  date?: Date
  view: ViewApi
}
export type ResourceDayHeaderMountArg = MountArg<ResourceDayHeaderContentArg>

// datagrid column header
export interface ResourceColumnHeaderContentArg {
  view: ViewApi
}
export type ResourceColumnHeaderMountArg = MountArg<ResourceColumnHeaderContentArg>

// datagrid cell
export interface ResourceCellContentArg {
  resource?: ResourceApi
  fieldValue: any
  view: ViewApi
}
export type ResourceCellMountArg = MountArg<ResourceCellContentArg>

// datagrid, for resource-GROUP entire row
export interface ResourceGroupHeaderContentArg {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupHeaderMountArg = MountArg<ResourceGroupHeaderContentArg>

// timeline lane, for resource-GROUP
export interface ResourceGroupLaneContentArg {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupLaneMountArg = MountArg<ResourceGroupLaneContentArg>

// resourceAreaColumns

export interface ColHeaderRenderHooks {
  headerClassNames?: ClassNamesGenerator<ResourceColumnHeaderContentArg>
  headerInnerClassNames?: ClassNamesGenerator<ResourceColumnHeaderContentArg>
  headerContent?: CustomContentGenerator<ResourceColumnHeaderContentArg>
  headerDefault?: (renderProps: ResourceColumnHeaderContentArg) => ComponentChild
  headerDidMount?: DidMountHandler<ResourceColumnHeaderMountArg>
  headerWillUnmount?: WillUnmountHandler<ResourceColumnHeaderMountArg>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number | string // string for percentage like '50%'
  field?: string

  cellClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  cellInnerClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  cellContent?: CustomContentGenerator<ResourceCellContentArg>
  cellDidMount?: DidMountHandler<ResourceCellMountArg>
  cellWillUnmount?: WillUnmountHandler<ResourceCellMountArg>
}

export interface GroupLaneRenderHooks {
  laneClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  laneContent?: CustomContentGenerator<ResourceCellContentArg>
  laneDidMount?: DidMountHandler<ResourceCellMountArg>
  laneWillUnmount?: WillUnmountHandler<ResourceCellMountArg>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  labelContent?: CustomContentGenerator<ResourceCellContentArg>
  labelDidMount?: DidMountHandler<ResourceCellMountArg>
  labelWillUnmount?: WillUnmountHandler<ResourceCellMountArg>
}
