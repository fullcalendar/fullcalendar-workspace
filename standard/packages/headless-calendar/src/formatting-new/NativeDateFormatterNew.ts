import { LocaleCodeArg } from "../locale"
import { ZonedMarker } from "../zoned-marker"
import { DateFormatterNew, DateTimeFormatPartWithWeekNew, FormattingContextNew } from "./DateFormatterNew"

export interface NativeDateFormatterOptions extends Intl.DateTimeFormatOptions {
  /*
  If specified, must be the only option.
  Outputs a part with type:'week', aka DateTimeFormatPartWithWeekNew
  */
  week?: 'long' | 'short' | 'narrow' | 'numeric'

  /*
  If specified, converts any dayPeriod string that matches MERIDIEM_RE to be uppercase, lowercase,
  "short" ("am" or "pm"), "narrow" ("a" or "p"), or `false` (completely omitted). `true` does nothing
  If short or narrow are specified, ensures that there's no separation between prior value and meridiem,
  so "7 a.m." will end up like "7am" or "7a"
  */
  meridiem?: 'lowercase' | 'short' | 'narrow' | boolean

  /*
  when receiving a marker with zero hour/minute/second/millisecond,
  format with a different internal DateTimeFormat that hides all time parts
  */
  omitZeroMinute?: boolean

  /*
  forces all strings like ", " to be " "
  */
  omitCommas?: boolean

  /*
  forces all empty-space literal strings to be ", "
  */
  forceCommas?: boolean

  /*
  can force a weekday like "Saturday 1" to the end like "1 Saturday"
  can force a weekday like "2 Sunday" to the start like "Sunday 1"
  only expected to work when there are three parts: weekday, an empty-space literal, and something else
  */
  weekdayJustify?: 'start' | 'end'
}

/*
NOTE: you'll probably need this normalization utils

const MULTI_SPACE_RE = /\s+/g
const LTR_RE = /\u200e/g // control character
*/

/*
NOTE: if you ever need any of the ../formatting-utils,
Copy them somewhere inside this "formatting-new" directory instead of importing directly
*/

export class NativeDateFormatterNew implements DateFormatterNew {
  constructor(locale?: LocaleCodeArg, options?: NativeDateFormatterOptions) {
  }

  formatMarkerToParts(date: ZonedMarker, context: FormattingContextNew): DateTimeFormatPartWithWeekNew[] {

    // a Date, forced to UTC, whos y/m/d/etc values represent a "plain" date
    // always give this to a DateTimeFormat who's timeZone has been explicitly set to "UTC"
    // if we want to include a timeZoneName in the output, we inject it in place of the "UTC"
    date.marker

    // timezone offset in minutes
    // use formatTimeZoneOffset, but copy in into this "formatting-new" directory somehow
    date.timeZoneOffset

    // // for formatting week numbers
    // const weekNumber = context.computeWeekNumber(date.marker)
    // const weekNumberString = context.locale.simpleNumberFormat.format(weekNumber)

    return []
  }

  formatMarkerRange(start: ZonedMarker, end: ZonedMarker, context: FormattingContextNew): string {
    // will likely do similar things as formatMarkerToParts, but will join into a string at the end
    return ''
  }
}
