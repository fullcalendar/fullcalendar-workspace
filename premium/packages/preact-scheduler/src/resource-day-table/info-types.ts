import { ViewApi } from '@fullcalendar/preact/public-api'
import { DateMeta } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../resource/api/ResourceApi'

// uses Partial<DateMeta> because might not be date-specific
export interface ResourceDayHeaderInfo extends Partial<DateMeta> {
  resource: ResourceApi
  text: string
  level: number
  view: ViewApi
  isDisabled: boolean
  isNarrow: boolean
  isMajor: boolean
}
