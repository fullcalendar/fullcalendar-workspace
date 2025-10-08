import { createFormatter } from '../datelib/formatting.js'

export const DAY_NUMBER_ONLY_FORMAT = createFormatter({
  day: 'numeric',
})

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
