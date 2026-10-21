import { createFormatter } from '../../datelib/formatting'
import { DateFormatter } from '@full-ui/headless-calendar'

/*
The day header's date format: the option, or a default for how many days and how narrow
*/

export const dayMicroWidth = 60

export const dayHeaderMicroFormat = createFormatter({
  weekday: 'narrow'
})

export function createDayHeaderFormatter(
  explicitFormat: DateFormatter,
  datesRepDistinctDays: boolean,
  dateCnt: number,
): DateFormatter {
  return explicitFormat || computeFallbackHeaderFormat(datesRepDistinctDays, dateCnt)
}

// Computes a default column header formatting string if `colFormat` is not explicitly defined
export function computeFallbackHeaderFormat(datesRepDistinctDays: boolean, dayCnt: number): DateFormatter {
  // if more than one week row, or if there are a lot of columns with not much space,
  // put just the day numbers will be in each cell
  if (!datesRepDistinctDays) {
    return createFormatter({ weekday: 'short' }) // "Sat"
  }

  if (dayCnt > 1) {
    return createFormatter({ // "Sat 11"
      weekday: 'short',
      weekdayJustify: 'start',
      day: 'numeric',
      omitCommas: true,
      omitTrailing: true,
    })
  }

  return createFormatter({ // "Saturday 11"
    weekday: 'long',
    weekdayJustify: 'start',
    day: 'numeric',
    omitCommas: true,
    omitTrailing: true,
  })
}
