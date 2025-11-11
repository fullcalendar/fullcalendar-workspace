import { DateMeta } from './component-util/date-rendering.js'
import { Duration } from './datelib/duration.js'
import { ViewApi } from './api/ViewApi.js'
import { MountData } from './common/render-hook.js'
import { DateMarker } from './datelib/marker.js'

export interface SlotLaneData extends DateMeta {
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
}
export type SlotLaneMountData = MountData<SlotLaneData>

export interface SlotLabelData extends SlotLaneData {
  level: number
  isTime: boolean
  text: string
  isNarrow: boolean
  hasNavLink: boolean
  isFirst: boolean
}
export type SlotLabelMountData = MountData<SlotLabelData>

export interface AllDayHeaderData {
  text: string
  view: ViewApi
  isNarrow: boolean
}
export type AllDayHeaderMountData = MountData<AllDayHeaderData>

export interface DayHeaderData extends DateMeta {
  date: Date
  isNarrow: boolean
  isMajor: boolean
  inPopover: boolean
  hasNavLink: boolean
  level: number
  text: string
  textParts: Intl.DateTimeFormatPart[]
  weekdayText: string
  dayNumberText: string
  view: ViewApi
  [otherProp: string]: any
}
export type DayHeaderMountData = MountData<DayHeaderData>

export interface DayCellData extends DateMeta {
  date: DateMarker // localized
  isMajor: boolean
  isNarrow: boolean
  inPopover: boolean
  hasNavLink: boolean
  view: ViewApi
  text: string
  textParts: Intl.DateTimeFormatPart[]
  dayNumberText: string
  monthText: string
  options: { businessHours: boolean }
  [extraProp: string]: any // so can include a resource
}

export type DayCellMountData = MountData<DayCellData>
