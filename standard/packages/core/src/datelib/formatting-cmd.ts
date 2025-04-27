import { DateFormatter, DateFormattingContext, createVerboseFormattingArg } from './DateFormatter.js'
import { joinDateTimeFormatParts } from './formatting-utils.js'
import { ZonedMarker } from './zoned-marker.js'

/*
TODO: fix the terminology of "formatter" vs "formatting func"
*/

/*
At the time of instantiation, this object does not know which cmd-formatting system it will use.
It receives this at the time of formatting, as a setting.
*/
export class CmdFormatter implements DateFormatter {
  cmdStr: string

  constructor(cmdStr: string) {
    this.cmdStr = cmdStr
  }

  format(
    date: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string,
  ): [string, Intl.DateTimeFormatPart[]] {
    const res = context.cmdFormatter(
      this.cmdStr,
      createVerboseFormattingArg(date, null, context, betterDefaultSeparator)
    )

    // array of parts?
    if (typeof res === 'object') {
      return [joinDateTimeFormatParts(res), res]
    }

    // otherwise, just a string
    return [res, [{ type: 'literal', value: res }]]
  }

  // Unlike format(), returns plain string!
  formatRange(
    start: ZonedMarker,
    end: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string
  ): string {
    const res = context.cmdFormatter(
      this.cmdStr,
      createVerboseFormattingArg(start, end, context, betterDefaultSeparator)
    )

    // array of parts?
    if (typeof res === 'object') {
      return joinDateTimeFormatParts(res)
    }

    // otherwise, just a string
    return res
  }
}
