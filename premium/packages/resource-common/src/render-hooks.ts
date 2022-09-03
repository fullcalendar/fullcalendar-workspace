import { CalendarContext, MountArg } from '@fullcalendar/common'
import { ResourceApi } from './api/ResourceApi'
import { Resource } from './structs/resource'

export interface ResourceLaneHookPropsInput {
  resource: Resource
  context: CalendarContext
}

export interface ResourceLaneContentArg {
  resource: ResourceApi
}

export type ResourceLaneMountArg = MountArg<ResourceLaneContentArg>
