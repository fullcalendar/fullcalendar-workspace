import { ViewApi, ClassNameGenerator } from '@fullcalendar/preact/public-api'
import { ContentGenerator, DidMountHandler, WillUnmountHandler, CalendarContext } from '@fullcalendar/preact/protected-api'
import type { ReactNode } from 'react'
import { ResourceApi } from '../resource/api/ResourceApi'
import { Resource } from '../resource/structs/resource'

export interface ResourceColumnHeaderInfo {
  view: ViewApi
}

export interface ResourceCellInfo {
  resource?: ResourceApi
  field: string
  fieldValue: any
  view: ViewApi
}

export interface ResourceGroupHeaderInfo {
  fieldValue: any
  view: ViewApi
}

export interface ResourceGroupLaneInfo {
  fieldValue: any
  view: ViewApi
}

export interface ResourceLaneContentArgInput {
  resource: Resource
  context: CalendarContext
  eventOverlap: boolean
}

export interface ResourceLaneInfo {
  resource: ResourceApi
  options: { eventOverlap: boolean }
}

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneInfo {
  return {
    resource: new ResourceApi(input.context, input.resource),
    options: { eventOverlap: input.eventOverlap },
  }
}

export interface ResourceExpanderInfo {
  isExpanded: boolean
}

// resourceColumns
// -------------------------------------------------------------------------------------------------

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

export interface GroupSpec extends GroupLaneRenderHooks { // best place for this?
  field?: string
  order?: number

  labelClass?: ClassNameGenerator<ResourceCellInfo>
  labelInnerClass?: ClassNameGenerator<ResourceCellInfo>
  labelContent?: ContentGenerator<ResourceCellInfo>
  labelDidMount?: DidMountHandler<ResourceCellInfo>
  labelWillUnmount?: WillUnmountHandler<ResourceCellInfo>
}
