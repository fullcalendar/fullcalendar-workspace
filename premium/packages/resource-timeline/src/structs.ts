import { ViewApi, ClassNamesGenerator } from '@fullcalendar/core'
import { CustomContentGenerator, DidMountHandler, WillUnmountHandler, MountArg, CalendarContext } from '@fullcalendar/core/internal'
import { ComponentChild } from '@fullcalendar/core/preact'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'

export interface ResourceColumnHeaderContentArg {
  view: ViewApi
}
export type ResourceColumnHeaderMountArg = MountArg<ResourceColumnHeaderContentArg>

export interface ResourceCellContentArg {
  resource?: ResourceApi
  fieldValue: any
  view: ViewApi
}
export type ResourceCellMountArg = MountArg<ResourceCellContentArg>

export interface ResourceGroupHeaderContentArg {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupHeaderMountArg = MountArg<ResourceGroupHeaderContentArg>

export interface ResourceGroupLaneContentArg {
  fieldValue: any
  view: ViewApi
}
export type ResourceGroupLaneMountArg = MountArg<ResourceGroupLaneContentArg>

export interface ResourceLaneContentArgInput {
  resource: Resource
  context: CalendarContext
}

export interface ResourceLaneContentArg {
  resource: ResourceApi
}

export type ResourceLaneMountArg = MountArg<ResourceLaneContentArg>

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneContentArg {
  return {
    resource: new ResourceApi(input.context, input.resource),
  }
}

// resourceAreaColumns
// -------------------------------------------------------------------------------------------------

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
  laneInnerClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  laneContent?: CustomContentGenerator<ResourceCellContentArg>
  laneDidMount?: DidMountHandler<ResourceCellMountArg>
  laneWillUnmount?: WillUnmountHandler<ResourceCellMountArg>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  labelInnerClassNames?: ClassNamesGenerator<ResourceCellContentArg>
  labelContent?: CustomContentGenerator<ResourceCellContentArg>
  labelDidMount?: DidMountHandler<ResourceCellMountArg>
  labelWillUnmount?: WillUnmountHandler<ResourceCellMountArg>
}
