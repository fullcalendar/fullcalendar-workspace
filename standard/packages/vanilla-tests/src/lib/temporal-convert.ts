import { Temporal } from 'temporal-polyfill'

export function plainAndZoneToString(dateStr: string, timeZone: string): string {
  return plainAndZone(dateStr, timeZone)
    .toString()
    .replace(/\[[^\]]*\]$/, '') // remove timezone part
}

export function plainAndZoneToDate(dateStr: string, timeZone: string): Date {
  return new Date(plainAndZone(dateStr, timeZone).epochMilliseconds)
}

function plainAndZone(dateStr: string, timeZone: string): Temporal.ZonedDateTime {
  const plain = dateStr.includes('T')
    ? Temporal.PlainDateTime.from(dateStr)
    : Temporal.PlainDate.from(dateStr)

  return plain.toZonedDateTime(timeZone)
}
