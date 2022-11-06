import { CalendarContext, MountArg } from '@fullcalendar/core'
import { ResourceApi } from './api/ResourceApi.js'
import { Resource } from './structs/resource.js'

export interface ResourceLaneContentArgInput {
  resource: Resource
  context: CalendarContext
}

export interface ResourceLaneContentArg {
  resource: ResourceApi
}

export type ResourceLaneMountArg = MountArg<ResourceLaneContentArg>
