import { ViewApi } from '@fullcalendar/core'
import { ResourceApi } from '../api/ResourceApi.js'
import { MountArg } from '@fullcalendar/core/internal'

// TODO: kill these
export interface ResourceLabelContentArg {
  resource: ResourceApi
  text: string
  isDisabled: boolean
  date?: Date
  view: ViewApi
}
export type ResourceLabelMountArg = MountArg<ResourceLabelContentArg>

// new
export interface ResourceDayHeaderContentArg {
  resource: ResourceApi
  text: string
  isDisabled: boolean
  date?: Date
  view: ViewApi
}
export type ResourceDayHeaderMountArg = MountArg<ResourceDayHeaderContentArg>
