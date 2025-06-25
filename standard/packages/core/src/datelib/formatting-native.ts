import { DateMarker, timeAsMs } from './marker.js'
import { CalendarSystem } from './calendar-system.js'
import { Locale } from './locale.js'
import { DateFormatter, DateFormattingContext } from './DateFormatter.js'
import { ZonedMarker } from './zoned-marker.js'
import { formatTimeZoneOffset, joinDateTimeFormatParts } from './formatting-utils.js'
import { memoize } from '../util/memoize.js'
import { DateTimeFormatPartWithWeek } from '../common/WeekNumberContainer.js'
import { trimEnd } from '../util/misc.js'

const EXTENDED_SETTINGS_AND_SEVERITIES = {
  week: 3,
  separator: 0, // 0 = not applicable
  omitZeroMinute: 0,
  meridiem: 0, // like am/pm
  omitCommas: 0,
  forceCommas: 0,
  weekdayJustify: 0,
}

const STANDARD_DATE_PROP_SEVERITIES = {
  timeZoneName: 7,
  era: 6,
  year: 5,
  month: 4,
  day: 2,
  weekday: 2,
  hour: 1,
  minute: 1,
  second: 1,
}

const MERIDIEM_RE = /([ap])\.?m\.?/i
const COMMA_RE = /,/g // we need re for globalness
const MULTI_SPACE_RE = /\s+/g
const LTR_RE = /\u200e/g // control character

export interface NativeFormatterOptions extends Intl.DateTimeFormatOptions {
  week?: 'long' | 'short' | 'narrow' | 'numeric'
  meridiem?: 'lowercase' | 'short' | 'narrow' | boolean
  omitZeroMinute?: boolean
  omitCommas?: boolean
  forceCommas?: boolean
  separator?: string
  weekdayJustify?: 'start' | 'end'
}

export class NativeFormatter implements DateFormatter {
  standardDateProps: any
  extendedSettings: any
  minSeverity: number
  private buildFormattingFunc: typeof buildFormattingFunc // caching for efficiency with same date env

  constructor(formatSettings: NativeFormatterOptions) {
    let standardDateProps: any = {}
    let extendedSettings: any = {}
    let minSeverity = 7

    for (let name in formatSettings) {
      if (name in EXTENDED_SETTINGS_AND_SEVERITIES) {
        extendedSettings[name] = formatSettings[name]
        const severity = EXTENDED_SETTINGS_AND_SEVERITIES[name]
        if (severity) {
          minSeverity = Math.min(severity, minSeverity)
        }
      } else {
        standardDateProps[name] = formatSettings[name]

        if (name in STANDARD_DATE_PROP_SEVERITIES) { // TODO: what about hour12? no severity
          const severity = STANDARD_DATE_PROP_SEVERITIES[name]
          if (severity) {
            minSeverity = Math.min(severity, minSeverity)
          }
        }
      }
    }

    this.standardDateProps = standardDateProps
    this.extendedSettings = extendedSettings
    this.minSeverity = minSeverity

    this.buildFormattingFunc = memoize(buildFormattingFunc)
  }

  format(
    date: ZonedMarker,
    context: DateFormattingContext
  ): [string, Intl.DateTimeFormatPart[]] {
    const parts = this.buildFormattingFunc(this.standardDateProps, this.extendedSettings, context)(date)
    return [joinDateTimeFormatParts(parts), parts as Intl.DateTimeFormatPart[]]
  }

  // Unlike format(), returns plain string!
  formatRange(
    start: ZonedMarker,
    end: ZonedMarker,
    context: DateFormattingContext,
    betterDefaultSeparator?: string,
  ): string {
    let { standardDateProps, extendedSettings } = this

    let diffSeverity = computeMarkerDiffSeverity(start.marker, end.marker, context.calendarSystem)
    if (!diffSeverity) {
      return this.format(start, context)[0]
    }

    let biggestUnitForPartial = diffSeverity
    if (
      biggestUnitForPartial > 1 && // the two dates are different in a way that's larger scale than time
      (standardDateProps.year === 'numeric' || standardDateProps.year === '2-digit') &&
      (standardDateProps.month === 'numeric' || standardDateProps.month === '2-digit') &&
      (standardDateProps.day === 'numeric' || standardDateProps.day === '2-digit')
    ) {
      biggestUnitForPartial = 1 // make it look like the dates are only different in terms of time
    }

    let [full0] = this.format(start, context)
    let [full1] = this.format(end, context)

    if (full0 === full1) {
      return full0
    }

    let partialDateProps = computePartialFormattingOptions(standardDateProps, biggestUnitForPartial)
    let partialFormattingFunc = buildFormattingFunc(partialDateProps, extendedSettings, context)
    let partial0 = partialFormattingFunc(start)
    let partial1 = partialFormattingFunc(end)

    let insertion = findCommonInsertion(full0, partial0, full1, partial1)
    let separator = extendedSettings.separator || betterDefaultSeparator || context.defaultSeparator || ''

    if (insertion) {
      return insertion.before + partial0 + separator + partial1 + insertion.after
    }

    return full0 + separator + full1
  }

  getSmallestUnit() {
    switch (this.minSeverity) {
      case 2:
        return 'day'
      case 3:
        return 'week'
      case 4:
        return 'month'
      case 5:
      case 6:
        return 'year'
      default:
        return 'time' // really?
    }
  }
}

function buildFormattingFunc(
  standardDateProps,
  extendedSettings,
  context: DateFormattingContext,
): (date: ZonedMarker) => DateTimeFormatPartWithWeek[] {
  let standardDatePropCnt = Object.keys(standardDateProps).length

  if (standardDatePropCnt === 1 && standardDateProps.timeZoneName === 'short') {
    return (date: ZonedMarker) => [{
      type: 'timeZoneName',
      value: formatTimeZoneOffset(date.timeZoneOffset)
    }]
  }

  if (standardDatePropCnt === 0 && extendedSettings.week) {
    return (date: ZonedMarker) => (
      formatWeekNumberParts(
        context.computeWeekNumber(date.marker),
        context.weekText,
        context.weekTextShort,
        context.locale,
        extendedSettings.week,
      )
    )
  }

  return buildNativeFormattingFunc(standardDateProps, extendedSettings, context)
}

function buildNativeFormattingFunc(
  standardDateProps,
  extendedSettings,
  context: DateFormattingContext,
): (date: ZonedMarker) => Intl.DateTimeFormatPart[] {
  standardDateProps = { ...standardDateProps } // copy
  extendedSettings = { ...extendedSettings } // copy

  sanitizeSettings(standardDateProps, extendedSettings)

  standardDateProps.timeZone = 'UTC' // we leverage the only guaranteed timeZone for our UTC markers

  let normalFormat = new Intl.DateTimeFormat(context.locale.codes, standardDateProps)
  let zeroFormat: Intl.DateTimeFormat // needed?

  if (extendedSettings.omitZeroMinute) {
    let zeroProps = { ...standardDateProps }
    delete zeroProps.minute // seconds and ms were already considered in sanitizeSettings
    zeroFormat = new Intl.DateTimeFormat(context.locale.codes, zeroProps)
  }

  return (date: ZonedMarker) => {
    let { marker } = date
    let format: Intl.DateTimeFormat

    if (zeroFormat && !marker.getUTCMinutes()) {
      format = zeroFormat
    } else {
      format = normalFormat
    }

    let parts = format.formatToParts(marker)
    return postProcessParts(parts, date, standardDateProps, extendedSettings, context)
  }
}

function sanitizeSettings(standardDateProps, extendedSettings) {
  // deal with a browser inconsistency where formatting the timezone
  // requires that the hour/minute be present.
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

  // if requesting to display seconds, MUST display minutes
  if (extendedSettings.omitZeroMinute && (standardDateProps.second || standardDateProps.millisecond)) {
    delete extendedSettings.omitZeroMinute
  }
}

function postProcessParts(
  parts: Intl.DateTimeFormatPart[],
  date: ZonedMarker,
  standardDateProps,
  extendedSettings,
  context: DateFormattingContext,
): Intl.DateTimeFormatPart[] {
  let injectableTz = standardDateProps.timeZoneName === 'short' && (
    (context.timeZone === 'UTC' || date.timeZoneOffset == null)
      ? 'UTC' // important to normalize for IE, which does "GMT"
      : formatTimeZoneOffset(date.timeZoneOffset)
  )
  let injectedTz = false
  let priorLiteral: Intl.DateTimeFormatPart | undefined

  for (const part of parts) {
    const isLiteral = part.type === 'literal'

    if (isLiteral || part.type === 'dayPeriod') {
      let s = part.value

      // remove left-to-right control chars. do first. good for other regexes
      s = s.replace(LTR_RE, '')

      if (extendedSettings.omitCommas) {
        s = s.replace(COMMA_RE, '')
      }

      if (!isLiteral) { // dayPeriod
        const { meridiem } = extendedSettings

        if (meridiem === false) {
          s = s.replace(MERIDIEM_RE, '')
        } else if (meridiem === 'narrow') { // a/p
          s = s.replace(MERIDIEM_RE, (m0, m1) => m1.toLocaleLowerCase())
        } else if (meridiem === 'short') { // am/pm
          s = s.replace(MERIDIEM_RE, (m0, m1) => `${m1.toLocaleLowerCase()}m`)
        } else if (meridiem === 'lowercase') { // other meridiem transformers already converted to lowercase
          s = s.replace(MERIDIEM_RE, (m0) => m0.toLocaleLowerCase())
        }

        // remove prior space. Makes "7 pm" -> "7pm"
        if (priorLiteral) {
          priorLiteral.value = trimEnd(priorLiteral.value)
        }
      }

      s = s.replace(MULTI_SPACE_RE, ' ')
      part.value = s

    } else if (part.type === 'timeZoneName' && injectableTz) {
      part.value = injectableTz
      injectedTz = true
    }

    priorLiteral = isLiteral ? part : undefined
  }

  if (injectableTz && !injectedTz) {
    if (priorLiteral) {
      priorLiteral.value += ' '
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
    parts = parts.map((part) => {
      if (part.value === ' ') {
        return { ...part, value: ', '}
      }
      return part
    })
  }

  return parts.filter((part) => part.value) // filter empty parts
}

function formatWeekNumberParts(
  num: number,
  weekText: string,
  weekTextShort: string,
  locale: Locale,
  display?: 'numeric' | 'narrow' | 'short' | 'long',
): DateTimeFormatPartWithWeek[] {
  let parts: DateTimeFormatPartWithWeek[] = []

  if (display === 'long') {
    parts.push({ type: 'literal', value: weekText })
  } else if (display === 'short' || display === 'narrow') {
    parts.push({ type: 'literal', value: weekTextShort })
  }

  // TODO: probably not okay to have consecutive literals?
  // (but need it for RTL, right?)
  if (display === 'long' || display === 'short') {
    parts.push({ type: 'literal', value: ' ' })
  }

  parts.push({
    type: 'week',
    value: locale.simpleNumberFormat.format(num),
  })

  if (locale.options.direction === 'rtl') { // TODO: use control characters instead?
    parts.reverse()
  }

  return parts
}

// Range Formatting Utils

// 0 = exactly the same
// 1 = different by time
// and bigger
function computeMarkerDiffSeverity(d0: DateMarker, d1: DateMarker, ca: CalendarSystem) {
  if (ca.getMarkerYear(d0) !== ca.getMarkerYear(d1)) {
    return 5
  }
  if (ca.getMarkerMonth(d0) !== ca.getMarkerMonth(d1)) {
    return 4
  }
  if (ca.getMarkerDay(d0) !== ca.getMarkerDay(d1)) {
    return 2
  }
  if (timeAsMs(d0) !== timeAsMs(d1)) {
    return 1
  }
  return 0
}

function computePartialFormattingOptions(options, biggestUnit) {
  let partialOptions = {}

  for (let name in options) {
    if (
      !(name in STANDARD_DATE_PROP_SEVERITIES) || // not a date part prop (like timeZone)
      STANDARD_DATE_PROP_SEVERITIES[name] <= biggestUnit
    ) {
      partialOptions[name] = options[name]
    }
  }

  return partialOptions
}

function findCommonInsertion(full0, partial0, full1, partial1) {
  let i0 = 0
  while (i0 < full0.length) {
    let found0 = full0.indexOf(partial0, i0)
    if (found0 === -1) {
      break
    }

    let before0 = full0.substr(0, found0)
    i0 = found0 + partial0.length
    let after0 = full0.substr(i0)

    let i1 = 0
    while (i1 < full1.length) {
      let found1 = full1.indexOf(partial1, i1)
      if (found1 === -1) {
        break
      }

      let before1 = full1.substr(0, found1)
      i1 = found1 + partial1.length
      let after1 = full1.substr(i1)

      if (before0 === before1 && after0 === after1) {
        return {
          before: before0,
          after: after0,
        }
      }
    }
  }

  return null
}
