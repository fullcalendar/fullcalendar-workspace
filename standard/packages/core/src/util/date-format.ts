import { createFormatter } from '../datelib/formatting.js'

export const FULL_DATE_FORMAT = createFormatter({ year: 'numeric', month: 'long', day: 'numeric' })
export const WEEK_FORMAT = createFormatter({ week: 'long' })
export const WEEKDAY_ONLY_FORMAT = createFormatter({
  weekday: 'long',
})

export function findWeekdayText(parts: Intl.DateTimeFormatPart[]): string {
  for (const part of parts) {
    if (part.type === 'weekday') {
      return part.value
    }
  }
  return ''
}

export function findDayNumberText(parts: Intl.DateTimeFormatPart[]): string {
  for (const part of parts) {
    if (part.type === 'day') {
      return part.value
    }
  }
  return ''
}

export function findMonthText(parts: Intl.DateTimeFormatPart[]): string {
  for (const part of parts) {
    if (part.type === 'month') {
      return part.value
    }
  }
  return ''
}
