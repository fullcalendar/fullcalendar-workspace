import { DateMarker, DateTimeFormatPartWithWeek } from '@full-ui/headless-calendar'
import { ViewApi } from '../api/ViewApi'
import { DateMeta } from '../date-profile/date-meta'

/*
What the day-table views' render hooks receive (DayGrid, TimeGrid's all-day and header rows,
MultiMonth): day headers and cells, and week numbers
*/

export interface DayHeaderInfo extends DateMeta {
  date: Date
  isNarrow: boolean
  isMajor: boolean
  inPopover: boolean
  hasNavLink: boolean
  level: number
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  weekdayText: string
  dayNumberText: string
  view: ViewApi
  [otherProp: string]: any
}

export interface DayHeaderDividerInfo {
  isSticky: boolean
  multiMonthColumns: number
  options: { allDaySlot: boolean }
}

export interface DayCellInfo extends DateMeta {
  date: DateMarker // localized
  isMajor: boolean
  isNarrow: boolean
  inPopover: boolean
  hasNavLink: boolean
  view: ViewApi
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  weekdayText: string
  dayNumberText: string
  monthText: string
  options: { businessHours: boolean }
  [extraProp: string]: any // so can include a resource
}

// a week number in the header
export interface WeekNumberHeaderInfo {
  num?: number // undefined if not for specific date
  date?: Date // undefined if not for specific date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
  options: { dayMinWidth: number | undefined }
}

// a week number cell (eventually)
export interface WeekNumberCellInfo { // TODO: DRY with inline?
  num: number
  date: Date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
}

// a week number inline, in a day cell
export interface InlineWeekNumberInfo {
  num: number
  date: Date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
}
