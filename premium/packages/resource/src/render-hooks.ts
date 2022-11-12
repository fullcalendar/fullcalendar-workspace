import { CalendarContext, MountArg } from '@fullcalendar/core/internal'
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

export function refineRenderProps(input: ResourceLaneContentArgInput): ResourceLaneContentArg {
  return {
    resource: new ResourceApi(input.context, input.resource),
  }
}
