import { DateFormatter, DateFormattingContext, createVerboseFormattingArg, VerboseFormattingArg } from './DateFormatter.js'
import { ZonedMarker } from './zoned-marker.js'

export type FuncFormatterFunc = (arg: VerboseFormattingArg) => string

export class FuncFormatter implements DateFormatter {
  func: FuncFormatterFunc

  constructor(func: FuncFormatterFunc) {
    this.func = func
  }

  format(
    date: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string
  ): [string, Intl.DateTimeFormatPart[]] {
    const str = this.func(createVerboseFormattingArg(date, null, context, betterDefaultSeparator))

    return [
      str,
      // HACK. In future versions, allow func-formatters to return parts?
      [{ type: 'literal', value: str }],
    ]
  }

  // Unlike format(), returns plain string!
  formatRange(
    start: ZonedMarker,
    end: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string,
  ): string {
    return this.func(createVerboseFormattingArg(start, end, context, betterDefaultSeparator))
  }
}
