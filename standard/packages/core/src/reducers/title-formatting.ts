import { DateProfile } from '../DateProfileGenerator.js'
import { diffWholeDays } from '../datelib/marker.js'
import { createFormatter, FormatterInput } from '../datelib/formatting.js'
import { DateRange } from '../datelib/date-range.js'
import { DateEnv } from '../datelib/env.js'
import { BaseOptions } from '../options.js'

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

  return dateEnv.formatRange(
    range.start,
    range.end,
    createFormatter(viewOptions.titleFormat || buildTitleFormat(dateProfile, dateEnv)),
    {
      isEndExclusive: dateProfile.isRangeAllDay,
      defaultSeparator: viewOptions.titleRangeSeparator,
    },
  )
}

// Generates the format string that should be used to generate the title for the current date range.
// Attempts to compute the most appropriate format if not explicitly specified with `titleFormat`.
function buildTitleFormat(
  dateProfile: DateProfile,
  dateEnv: DateEnv,
): FormatterInput {
  let { currentRangeUnit } = dateProfile

  if (currentRangeUnit === 'year') {
    return { year: 'numeric' }
  }

  if (currentRangeUnit === 'month') {
    return { year: 'numeric', month: 'long' } // like "September 2014"
  }

  let days = diffWholeDays(
    dateProfile.currentRange.start,
    dateProfile.currentRange.end,
  )

  if (days !== null && days > 1) {
    return {
      year: 'numeric',
      month: dateEnv.getMonth(dateProfile.activeRange.start) !== dateEnv.getMonth(dateProfile.activeRange.end)
        ? 'short' // different months? do "Sep - Oct 2014"
        : 'long', // same month? do "September 2014"
    }
  }

  // one day. longer, like "September 9 2014"
  return { year: 'numeric', month: 'long', day: 'numeric' }
}
