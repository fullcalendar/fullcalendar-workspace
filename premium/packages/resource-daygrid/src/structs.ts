import { ViewApi } from '@fullcalendar/core'
import { MountArg, DateMeta } from '@fullcalendar/core/internal'
import { ResourceApi } from '@fullcalendar/resource'

// uses Partial<DateMeta> because might not be date-specific
export interface ResourceDayHeaderContentArg extends Partial<DateMeta> {
  resource: ResourceApi
  text: string
  view: ViewApi
}
export type ResourceDayHeaderMountArg = MountArg<ResourceDayHeaderContentArg>
