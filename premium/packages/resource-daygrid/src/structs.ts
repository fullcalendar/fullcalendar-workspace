import { ViewApi } from '@fullcalendar/core'
import { MountData, DateMeta } from '@fullcalendar/core/internal'
import { ResourceApi } from '@fullcalendar/resource'

// uses Partial<DateMeta> because might not be date-specific
export interface ResourceDayHeaderData extends Partial<DateMeta> {
  resource: ResourceApi
  text: string
  level: number
  view: ViewApi
  isDisabled: boolean
  isNarrow: boolean
  isMajor: boolean
}
export type ResourceDayHeaderMountData = MountData<ResourceDayHeaderData>
