import { ViewApi } from '@fullcalendar/preact/public-api'
import { MountData, DateMeta } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../resource/api/ResourceApi'

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
