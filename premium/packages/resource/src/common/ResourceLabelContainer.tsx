import { ViewApi } from '@fullcalendar/core'
import { ResourceApi } from '../api/ResourceApi.js'
import { MountArg } from '@fullcalendar/core/internal'

// TODO: relocate these types now that Component no longer exists?

export interface ResourceLabelContentArg {
  resource: ResourceApi
  text: string
  date?: Date
  view: ViewApi
}

export type ResourceLabelMountArg = MountArg<ResourceLabelContentArg>
