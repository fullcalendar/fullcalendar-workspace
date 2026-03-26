
function padStart(val, len) {
  let s = String(val)
  return '000'.substr(0, len - s.length) + s
}

// timeZoneOffset is in minutes
export function formatTimeZoneOffset(minutes: number, doIso = false) {
  let sign = minutes < 0 ? '-' : '+'
  let abs = Math.abs(minutes)
  let hours = Math.floor(abs / 60)
  let mins = Math.round(abs % 60)

  if (doIso) {
    return `${sign + padStart(hours, 2)}:${padStart(mins, 2)}`
  }
  return `GMT${sign}${hours}${mins ? `:${padStart(mins, 2)}` : ''}`
}

export function joinDateTimeFormatParts(
  parts: { value: string }[], // intentionally flexible, for DateTimeFormatPartWithWeekNew
): string {
  let s = ''
  for (const part of parts) {
    s += part.value
  }
  return s
}
