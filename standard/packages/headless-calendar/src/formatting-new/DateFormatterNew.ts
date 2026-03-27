import { DateMarker } from '../marker'
import { CalendarSystem } from '../calendar-system'
import { Locale } from '../locale'
import { ZonedMarker } from '../zoned-marker'

export interface FormattingContextNew {
  timeZone: string
  locale: Locale
  calendarSystem: CalendarSystem
  computeWeekNumber: (d: DateMarker) => number
  weekText: string
  weekTextShort: string
}

export type DateTimeFormatPartWithWeekNew = Omit<Intl.DateTimeFormatPart, 'type'> & {
  type: Intl.DateTimeFormatPart['type'] | 'week'
}

export type DateTimeRangeFormatPartWithWeekNew = Omit<Intl.DateTimeRangeFormatPart, 'type'> & {
  type: Intl.DateTimeRangeFormatPart['type'] | 'week'
}

export interface DateFormatterNew {
  formatToParts(date: ZonedMarker, context: FormattingContextNew): DateTimeFormatPartWithWeekNew[]
  formatRangeToParts(start: ZonedMarker, end: ZonedMarker, context: FormattingContextNew): DateTimeRangeFormatPartWithWeekNew[]
}
