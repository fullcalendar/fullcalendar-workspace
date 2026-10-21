import { ViewApi } from '@fullcalendar/preact/public-api'
import { CalendarContext } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../resource/api/ResourceApi'
import { Resource } from '../resource/resource'

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

export interface ResourceExpanderInfo {
  isExpanded: boolean
}
