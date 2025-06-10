import { DateMarker } from './marker.js'
import { CalendarSystem } from './calendar-system.js'
import { Locale } from './locale.js'
import { ZonedMarker, ExpandedZonedMarker, expandZonedMarker } from './zoned-marker.js'

export interface VerboseFormattingData {
  date: ExpandedZonedMarker
  start: ExpandedZonedMarker
  end?: ExpandedZonedMarker
  timeZone: string
  localeCodes: string[],
  defaultSeparator: string
}

export function createVerboseFormattingArg(
  start: ZonedMarker,
  end: ZonedMarker,
  context: DateFormattingContext,
  betterDefaultSeparator?: string,
): VerboseFormattingData {
  let startInfo = expandZonedMarker(start, context.calendarSystem)
  let endInfo = end ? expandZonedMarker(end, context.calendarSystem) : null

  return {
    date: startInfo,
    start: startInfo,
    end: endInfo,
    timeZone: context.timeZone,
    localeCodes: context.locale.codes,
    defaultSeparator: betterDefaultSeparator || context.defaultSeparator,
  }
}

export type CmdFormatterFunc = (
  cmd: string,
  arg: VerboseFormattingData,
) => string | Intl.DateTimeFormatPart[]

export interface DateFormattingContext {
  timeZone: string,
  locale: Locale,
  calendarSystem: CalendarSystem
  computeWeekNumber: (d: DateMarker) => number
  weekText: string
  weekTextShort: string
  cmdFormatter?: CmdFormatterFunc
  defaultSeparator: string
}

export interface DateFormatter {
  format(
    date: ZonedMarker,
    context: DateFormattingContext
  ): [string, Intl.DateTimeFormatPart[]]

  // Unlike format(), returns plain string!
  formatRange(
    start: ZonedMarker,
    end: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string
  ): string
}
