
export const enUsSep = getRangeSeparatorForLocale('en-US')
export const enGbSep = getRangeSeparatorForLocale('en-GB')

// Utils
// -----

function getRangeSeparatorForLocale(locale: string): string {
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const dateTimeStart = new Date('2014-06-13T01:00:00')
  const dateTimeEnd = new Date('2014-06-13T02:00:00')

  return getRangeSeparator(dateTimeFormatter.formatRangeToParts(dateTimeStart, dateTimeEnd))
}

function getRangeSeparator(parts: Intl.DateTimeRangeFormatPart[]): string {
  const sharedPart = parts.find(
    part => part.source === 'shared' && part.type === 'literal' && !/^[\s,]*$/.test(part.value)
  )

  if (!sharedPart) {
    throw new Error('Expected Intl.DateTimeFormat.formatRangeToParts() to produce a shared separator.')
  }

  return sharedPart.value
}
