import { ViewApi, ClassNameGenerator } from '@fullcalendar/preact/public-api'
import { CustomContentGenerator, DidMountHandler, WillUnmountHandler, CalendarContext } from '@fullcalendar/preact/protected-api'
import type { ReactNode } from 'react'
import { ResourceApi } from '../resource/api/ResourceApi'
import { Resource } from '../resource/structs/resource'

export interface ResourceColumnHeaderData {
  view: ViewApi
}

export interface ResourceCellData {
  resource?: ResourceApi
  field: string
  fieldValue: any
  view: ViewApi
}

export interface ResourceGroupHeaderData {
  fieldValue: any
  view: ViewApi
}

export interface ResourceGroupLaneData {
  fieldValue: any
  view: ViewApi
}

export interface ResourceLaneContentArgInput {
  resource: Resource
  context: CalendarContext
  eventOverlap: boolean
}

export interface ResourceLaneData {
  resource: ResourceApi
  options: { eventOverlap: boolean }
}

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneData {
  return {
    resource: new ResourceApi(input.context, input.resource),
    options: { eventOverlap: input.eventOverlap },
  }
}

export interface ResourceExpanderData {
  isExpanded: boolean
}

// resourceColumns
// -------------------------------------------------------------------------------------------------

export interface ColHeaderRenderHooks {
  headerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerInnerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerResizerClass?: ClassNameGenerator<ResourceColumnHeaderData>
  headerContent?: CustomContentGenerator<ResourceColumnHeaderData>
  headerDefault?: (renderProps: ResourceColumnHeaderData) => ReactNode
  headerDidMount?: DidMountHandler<ResourceColumnHeaderData>
  headerWillUnmount?: WillUnmountHandler<ResourceColumnHeaderData>
}

export interface ColSpec extends ColHeaderRenderHooks {
  group?: boolean
  isMain?: boolean // whether its the first resource-specific unique cell for the row
  width?: number | string // string for percentage like '50%'
  field?: string

  cellClass?: ClassNameGenerator<ResourceCellData>
  cellInnerClass?: ClassNameGenerator<ResourceCellData>
  cellContent?: CustomContentGenerator<ResourceCellData>
  cellDidMount?: DidMountHandler<ResourceCellData>
  cellWillUnmount?: WillUnmountHandler<ResourceCellData>
}

export interface GroupLaneRenderHooks {
  laneClass?: ClassNameGenerator<ResourceCellData>
  laneInnerClass?: ClassNameGenerator<ResourceCellData>
  laneContent?: CustomContentGenerator<ResourceCellData>
  laneDidMount?: DidMountHandler<ResourceCellData>
  laneWillUnmount?: WillUnmountHandler<ResourceCellData>
}

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClass?: ClassNameGenerator<ResourceCellData>
  labelInnerClass?: ClassNameGenerator<ResourceCellData>
  labelContent?: CustomContentGenerator<ResourceCellData>
  labelDidMount?: DidMountHandler<ResourceCellData>
  labelWillUnmount?: WillUnmountHandler<ResourceCellData>
}
