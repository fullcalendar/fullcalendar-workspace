import { ViewApi } from '@fullcalendar/core'
import { MountData, DateMeta } from '@fullcalendar/core/internal'
import { ResourceApi } from '@fullcalendar/resource'

// uses Partial<DateMeta> because might not be date-specific
export interface ResourceDayHeaderContentArg extends Partial<DateMeta> {
  resource: ResourceApi
  text: string
  view: ViewApi
  isCompact: boolean
  // TODO: what about isMajor?
}
export type ResourceDayHeaderMountArg = MountData<ResourceDayHeaderContentArg>
