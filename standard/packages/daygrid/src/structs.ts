import { ViewApi } from '@fullcalendar/core'
import { DateMarker, DateMeta, MountArg } from '@fullcalendar/core/internal'

export interface DayHeaderContentArg extends DateMeta {
  date: Date
  isMajor: boolean
  text: string
  view: ViewApi
  [otherProp: string]: any
}
export type DayHeaderMountArg = MountArg<DayHeaderContentArg>

export interface DayCellContentArg extends DateMeta {
  date: DateMarker // localized
  isMajor: boolean
  view: ViewApi
  dayNumberText: string
  [extraProp: string]: any // so can include a resource
}

export type DayCellMountArg = MountArg<DayCellContentArg>
