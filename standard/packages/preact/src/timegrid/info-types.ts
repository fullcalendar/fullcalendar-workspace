import { DateMarker, Duration } from '@full-ui/headless-calendar'
import { ViewApi } from '../api/ViewApi'
import { DateMeta } from '../date-profile/date-meta'

/*
What TimeGrid's render hooks receive: the time slots (lanes and their header labels, which the
timeline views use too), the all-day header, and the day lanes
*/

export interface SlotLaneInfo extends DateMeta {
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
}

export interface SlotHeaderInfo extends SlotLaneInfo {
  level: number
  isTime: boolean
  text: string
  isNarrow: boolean
  hasNavLink: boolean
  isFirst: boolean
}

export interface AllDayHeaderInfo {
  text: string
  view: ViewApi
  isNarrow: boolean
}

export interface DayLaneInfo extends DateMeta {
  date: DateMarker // localized
  isNarrow: boolean
  isStack: boolean
  isMajor: boolean
  view: ViewApi
  [extraProp: string]: any // so can include a resource
}
