import { Locale } from '../locale'
import { ZonedMarker } from '../zoned-marker'
import { DateFormatterNew, DateTimeFormatPartWithWeekNew, FormattingContextNew } from './DateFormatterNew'
import { formatTimeZoneOffset, joinDateTimeFormatParts } from './formatting-utils-new'

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

const EXTENDED_SETTINGS = new Set([
  'week',
  'meridiem',
  'omitZeroMinute',
  'omitCommas',
  'forceCommas',
  'weekdayJustify',
])

const MERIDIEM_RE = /([ap])\.?m\.?/i
const COMMA_RE = /,/g
const MULTI_SPACE_RE = /\s+/g
const LTR_RE = /\u200e/g // control character

interface CachedFormats {
  normalFormat: Intl.DateTimeFormat
  zeroFormat?: Intl.DateTimeFormat
}

export class NativeDateFormatterNew implements DateFormatterNew {
  private standardDateProps: Intl.DateTimeFormatOptions
  private extendedSettings: Partial<NativeDateFormatterOptions>
  private _timeZoneOnly: boolean
  private _cachedContext: FormattingContextNew | undefined
  private _cachedFormats: CachedFormats | undefined

  constructor(options?: NativeDateFormatterOptions) {
    const standardDateProps: Intl.DateTimeFormatOptions = {}
    const extendedSettings: Partial<NativeDateFormatterOptions> = {}

    for (const name in options) {
      if (EXTENDED_SETTINGS.has(name)) {
        ;(extendedSettings as any)[name] = (options as any)[name]
      } else {
        ;(standardDateProps as any)[name] = (options as any)[name]
      }
    }

    // Detect timezone-only BEFORE sanitizeSettings, which would otherwise inject
    // hour/minute (a browser-quirk workaround) and make the check unreachable.
    this._timeZoneOnly = Object.keys(standardDateProps).length === 1 &&
      standardDateProps.timeZoneName === 'short'

    if (!this._timeZoneOnly) {
      sanitizeSettings(standardDateProps, extendedSettings)
    }

    standardDateProps.timeZone = 'UTC'

    this.standardDateProps = standardDateProps
    this.extendedSettings = extendedSettings
  }

  formatMarkerToParts(date: ZonedMarker, context: FormattingContextNew): DateTimeFormatPartWithWeekNew[] {
    const { standardDateProps, extendedSettings } = this

    // timezone-only
    if (this._timeZoneOnly) {
      return [{
        type: 'timeZoneName',
        value: formatTimeZoneOffset(date.timeZoneOffset),
      }]
    }

    const standardPropKeys = Object.keys(standardDateProps).filter((k) => k !== 'timeZone')

    // week-only
    if (standardPropKeys.length === 0 && extendedSettings.week) {
      return formatWeekNumberParts(
        context.computeWeekNumber(date.marker),
        context.weekText,
        context.weekTextShort,
        context.locale,
        extendedSettings.week,
      )
    }

    const { normalFormat, zeroFormat } = this._getFormats(context)
    const format = zeroFormat && !date.marker.getUTCMinutes() ? zeroFormat : normalFormat
    const parts = format.formatToParts(date.marker)
    return postProcessParts(parts, date, standardDateProps, extendedSettings)
  }

  formatMarkerRange(start: ZonedMarker, end: ZonedMarker, context: FormattingContextNew): string {
    const { standardDateProps, extendedSettings } = this

    // timezone-only or week-only: format start only, not a range
    if (this._timeZoneOnly) {
      return joinDateTimeFormatParts(this.formatMarkerToParts(start, context))
    }

    const standardPropKeys = Object.keys(standardDateProps).filter((k) => k !== 'timeZone')

    if (standardPropKeys.length === 0 && extendedSettings.week) {
      return joinDateTimeFormatParts(this.formatMarkerToParts(start, context))
    }

    const { normalFormat } = this._getFormats(context)
    const parts = normalFormat.formatRangeToParts(start.marker, end.marker)
    return joinDateTimeFormatParts(
      postProcessRangeParts(parts, start, end, standardDateProps, extendedSettings),
    )
  }

  private _getFormats(context: FormattingContextNew): CachedFormats {
    if (this._cachedContext !== context) {
      const { standardDateProps, extendedSettings } = this
      const { codes } = context.locale
      const normalFormat = new Intl.DateTimeFormat(codes, standardDateProps)
      let zeroFormat: Intl.DateTimeFormat | undefined

      if (extendedSettings.omitZeroMinute) {
        const zeroProps = { ...standardDateProps }
        delete zeroProps.minute
        zeroFormat = new Intl.DateTimeFormat(codes, zeroProps)
      }

      this._cachedContext = context
      this._cachedFormats = { normalFormat, zeroFormat }
    }

    return this._cachedFormats!
  }
}

function sanitizeSettings(
  standardDateProps: Intl.DateTimeFormatOptions,
  extendedSettings: Partial<NativeDateFormatterOptions>,
) {
  // formatting the timezone requires hour/minute to be present (browser inconsistency)
  if (standardDateProps.timeZoneName) {
    if (!standardDateProps.hour) {
      standardDateProps.hour = '2-digit'
    }
    if (!standardDateProps.minute) {
      standardDateProps.minute = '2-digit'
    }
  }

  // only support short timezone names
  if (standardDateProps.timeZoneName === 'long') {
    standardDateProps.timeZoneName = 'short'
  }

  // omitZeroMinute is incompatible with seconds
  if (extendedSettings.omitZeroMinute && (standardDateProps.second || standardDateProps.fractionalSecondDigits)) {
    delete extendedSettings.omitZeroMinute
  }
}

// Runs the shared per-part transforms in-place. Returns the last literal seen and whether
// any timeZoneName part was written (used by postProcessParts for tz fallback injection).
function processPartsLoop<T extends Intl.DateTimeFormatPart>(
  parts: T[],
  extendedSettings: Partial<NativeDateFormatterOptions>,
  getTzValue: (part: T) => string | undefined,
): { lastLiteral: T | undefined, anyTzInjected: boolean } {
  let anyTzInjected = false
  let priorLiteral: T | undefined

  for (const part of parts) {
    const isLiteral = part.type === 'literal'

    if (isLiteral || part.type === 'dayPeriod') {
      let s = part.value
      s = s.replace(LTR_RE, '')

      if (extendedSettings.omitCommas) {
        s = s.replace(COMMA_RE, '')
      }

      if (!isLiteral) { // dayPeriod
        const { meridiem } = extendedSettings
        if (meridiem === false) {
          s = s.replace(MERIDIEM_RE, '')
        } else if (meridiem === 'narrow') {
          s = s.replace(MERIDIEM_RE, (_m0: string, m1: string) => m1.toLocaleLowerCase())
        } else if (meridiem === 'short') {
          s = s.replace(MERIDIEM_RE, (_m0: string, m1: string) => `${m1.toLocaleLowerCase()}m`)
        } else if (meridiem === 'lowercase') {
          s = s.replace(MERIDIEM_RE, (m0: string) => m0.toLocaleLowerCase())
        }

        // remove prior space: "7 pm" → "7pm"
        if (priorLiteral) {
          priorLiteral.value = priorLiteral.value.trimEnd()
        }
      }

      s = s.replace(MULTI_SPACE_RE, ' ')
      part.value = s
    } else if (part.type === 'timeZoneName') {
      const tzValue = getTzValue(part)
      if (tzValue != null) {
        part.value = tzValue
        anyTzInjected = true
      }
    }

    priorLiteral = isLiteral ? part : undefined
  }

  return { lastLiteral: priorLiteral, anyTzInjected }
}

function postProcessParts(
  parts: Intl.DateTimeFormatPart[],
  date: ZonedMarker,
  standardDateProps: Intl.DateTimeFormatOptions,
  extendedSettings: Partial<NativeDateFormatterOptions>,
): DateTimeFormatPartWithWeekNew[] {
  const injectableTz = standardDateProps.timeZoneName === 'short'
    ? (date.timeZoneOffset == null ? 'UTC' : formatTimeZoneOffset(date.timeZoneOffset))
    : undefined

  const { lastLiteral, anyTzInjected } = processPartsLoop(parts, extendedSettings, () => injectableTz)

  if (injectableTz && !anyTzInjected) {
    if (lastLiteral) {
      lastLiteral.value += ' '
    } else {
      parts.push({ type: 'literal', value: ' ' })
    }
    parts.push({ type: 'timeZoneName', value: injectableTz })
  }

  if (
    extendedSettings.weekdayJustify &&
    parts.length === 3 &&
    parts[1].value === ' '
  ) {
    if (parts[extendedSettings.weekdayJustify === 'start' ? 2 : 0].type === 'weekday') {
      parts.reverse()
    }
  }

  if (extendedSettings.forceCommas) {
    for (const part of parts) {
      if (part.value === ' ') {
        part.value = ', '
      }
    }
  }

  return parts.filter((part) => part.value)
}

function postProcessRangeParts(
  parts: Intl.DateTimeRangeFormatPart[],
  start: ZonedMarker,
  end: ZonedMarker,
  standardDateProps: Intl.DateTimeFormatOptions,
  extendedSettings: Partial<NativeDateFormatterOptions>,
): { value: string }[] {
  const injectTz = standardDateProps.timeZoneName === 'short'

  processPartsLoop(parts, extendedSettings, (part) => {
    if (!injectTz) return undefined
    const offset = part.source === 'endRange' ? end.timeZoneOffset : start.timeZoneOffset
    return offset == null ? 'UTC' : formatTimeZoneOffset(offset)
  })

  if (extendedSettings.forceCommas) {
    for (const part of parts) {
      if (part.value === ' ') {
        part.value = ', '
      }
    }
  }

  return parts.filter((part) => part.value)
}

function formatWeekNumberParts(
  num: number,
  weekText: string,
  weekTextShort: string,
  locale: Locale,
  display?: 'numeric' | 'narrow' | 'short' | 'long',
): DateTimeFormatPartWithWeekNew[] {
  const parts: DateTimeFormatPartWithWeekNew[] = []

  if (display === 'long') {
    parts.push({ type: 'literal', value: weekText })
  } else if (display === 'short' || display === 'narrow') {
    parts.push({ type: 'literal', value: weekTextShort })
  }

  if (display === 'long' || display === 'short') {
    parts.push({ type: 'literal', value: ' ' })
  }

  parts.push({
    type: 'week',
    value: locale.simpleNumberFormat.format(num),
  })

  if (locale.options.direction === 'rtl') {
    parts.reverse()
  }

  return parts
}
