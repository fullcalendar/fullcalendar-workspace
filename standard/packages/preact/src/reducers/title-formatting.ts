import { BaseOptions } from '@fullcalendar/core/protected-api'
import { DateProfile } from '../DateProfileGenerator'
import { diffWholeDays, DateRange, DateEnv, joinDateTimeFormatParts, DateTimeRangeFormatPartWithWeek } from '@full-ui/headless-calendar'
import { createFormatter, FormatterInput } from '../datelib/formatting'

// Computes what the title at the top of the calendarApi should be for this view
export function buildTitle(
  dateProfile: DateProfile,
  viewOptions: BaseOptions,
  dateEnv: DateEnv,
): string {
  let range: DateRange

  // for views that span a large unit of time, show the proper interval, ignoring stray days before and after
  if (/^(year|month)$/.test(dateProfile.currentRangeUnit)) {
    range = dateProfile.currentRange
  } else { // for day units or smaller, use the actual day range
    range = dateProfile.activeRange
  }

  let parts: DateTimeRangeFormatPartWithWeek[]
  const options = { isEndExclusive: dateProfile.isRangeAllDay }

  if (viewOptions.titleFormat) {
    parts = dateEnv.formatRangeToParts(
      range.start,
      range.end,
      createFormatter(viewOptions.titleFormat),
      options,
    )
  } else {
    parts = dateEnv.formatRangeToParts(
      range.start,
      range.end,
      createFormatter(buildTitleFormat(dateProfile, 'long')),
      options,
    )

    if (hasTwoMonths(parts)) {
      parts = dateEnv.formatRangeToParts(
        range.start,
        range.end,
        createFormatter(buildTitleFormat(dateProfile, 'short')),
        options,
      )
    }
  }

  return joinDateTimeFormatParts(parts)
}

// Generates the format string that should be used to generate the title for the current date range.
// Attempts to compute the most appropriate format if not explicitly specified with `titleFormat`.
function buildTitleFormat(
  dateProfile: DateProfile,
  monthFormat: 'long' | 'short'
): FormatterInput {
  const { currentRangeUnit } = dateProfile

  if (currentRangeUnit === 'year') {
    return { year: 'numeric' }
  }

  if (currentRangeUnit === 'month') {
    return { year: 'numeric', month: monthFormat }
  }

  // currentRangeUnit is 'weeks' or 'days' ...

  const days = diffWholeDays(
    dateProfile.currentRange.start,
    dateProfile.currentRange.end,
  )

  // not a single-day view
  if (days !== null && days > 1) {
    return {
      year: 'numeric',
      month: monthFormat,
    }
  }

  // one day. longer, like "September 9 2014"
  return { year: 'numeric', month: 'long', day: 'numeric' }
}

function hasTwoMonths(parts: DateTimeRangeFormatPartWithWeek[]): boolean {
  let hasStartMonth = false
  let hasEndMonth = false
  for (const part of parts) {
    if (part.type === 'month') {
      if (part.source === 'startRange') hasStartMonth = true
      if (part.source === 'endRange') hasEndMonth = true
    }
  }
  return hasStartMonth && hasEndMonth
}
