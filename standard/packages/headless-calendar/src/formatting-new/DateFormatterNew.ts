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

export interface DateFormatterNew {
  formatMarkerToParts(date: ZonedMarker, context: FormattingContextNew): DateTimeFormatPartWithWeekNew[]
  formatMarkerRange(start: ZonedMarker, end: ZonedMarker, context: FormattingContextNew): string
}
