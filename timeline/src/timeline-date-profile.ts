import { config, buildGotoAnchorHtml, computeVisibleDayRange, Duration, DateProfile, isSingleDay, addDays, wholeDivideDurations, DateMarker, startOfDay, createDuration, DateEnv, diffWholeDays, asRoughMs, createFormatter, greatestDurationDenominator, asRoughMinutes, padStart, asRoughSeconds, DateRange, isInt, htmlEscape, DateProfileGenerator } from '@fullcalendar/core'

export interface TimelineDateProfile {
  labelInterval: Duration
  slotDuration: Duration
  headerFormats: any
  isTimeScale: boolean
  largeUnit: string
  emphasizeWeeks: boolean
  snapDuration: Duration
  snapsPerSlot: number
  normalizedRange: DateRange // snaps to unit. adds in minTime/maxTime
  timeWindowMs: number
  slotDates: DateMarker[]
  isWeekStarts: boolean[]
  snapDiffToIndex: number[]
  snapIndexToDiff: number[]
  snapCnt: number
  slotCnt: number
  cellRows: TimelineHeaderCell[][]
}

export interface TimelineHeaderCell {
  text: string
  spanHtml: string
  date: DateMarker
  colspan: number
  isWeekStart: boolean
}


const MIN_AUTO_LABELS = 18 // more than `12` months but less that `24` hours
const MAX_AUTO_SLOTS_PER_LABEL = 6 // allows 6 10-min slots in an hour
const MAX_AUTO_CELLS = 200 // allows 4-days to have a :30 slot duration
config.MAX_TIMELINE_SLOTS = 1000

// potential nice values for slot-duration and interval-duration
const STOCK_SUB_DURATIONS = [ // from largest to smallest
  { years: 1 },
  { months: 1 },
  { days: 1 },
  { hours: 1 },
  { minutes: 30 },
  { minutes: 15 },
  { minutes: 10 },
  { minutes: 5 },
  { minutes: 1 },
  { seconds: 30 },
  { seconds: 15 },
  { seconds: 10 },
  { seconds: 5 },
  { seconds: 1 },
  { milliseconds: 500 },
  { milliseconds: 100 },
  { milliseconds: 10 },
  { milliseconds: 1 }
]


export function buildTimelineDateProfile(dateProfile: DateProfile, dateEnv: DateEnv, allOptions: any, dateProfileGenerator: DateProfileGenerator): TimelineDateProfile {
  let tDateProfile = {
    labelInterval: queryDurationOption(allOptions, 'slotLabelInterval'),
    slotDuration: queryDurationOption(allOptions, 'slotDuration')
  } as TimelineDateProfile

  validateLabelAndSlot(tDateProfile, dateProfile, dateEnv) // validate after computed grid duration
  ensureLabelInterval(tDateProfile, dateProfile, dateEnv)
  ensureSlotDuration(tDateProfile, dateProfile, dateEnv)

  let input = allOptions.slotLabelFormat
  let rawFormats =
    Array.isArray(input) ?
      input
    : (input != null) ?
      [ input ]
    :
      computeHeaderFormats(tDateProfile, dateProfile, dateEnv, allOptions)

  tDateProfile.headerFormats = rawFormats.map(function(rawFormat) {
    return createFormatter(rawFormat)
  })

  tDateProfile.isTimeScale = Boolean(tDateProfile.slotDuration.milliseconds)

  let largeUnit = null
  if (!tDateProfile.isTimeScale) {
    const slotUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    if (/year|month|week/.test(slotUnit)) {
      largeUnit = slotUnit
    }
  }

  tDateProfile.largeUnit = largeUnit

  tDateProfile.emphasizeWeeks =
    isSingleDay(tDateProfile.slotDuration) &&
    currentRangeAs('weeks', dateProfile, dateEnv) >= 2 &&
    !allOptions.businessHours

  /*
  console.log('label interval =', timelineView.labelInterval.humanize())
  console.log('slot duration =', timelineView.slotDuration.humanize())
  console.log('header formats =', timelineView.headerFormats)
  console.log('isTimeScale', timelineView.isTimeScale)
  console.log('largeUnit', timelineView.largeUnit)
  */

  let rawSnapDuration = allOptions.snapDuration
  let snapDuration
  let snapsPerSlot

  if (rawSnapDuration) {
    snapDuration = createDuration(rawSnapDuration)
    snapsPerSlot = wholeDivideDurations(tDateProfile.slotDuration, snapDuration)
    // ^ TODO: warning if not whole?
  }

  if (snapsPerSlot == null) {
    snapDuration = tDateProfile.slotDuration
    snapsPerSlot = 1
  }

  tDateProfile.snapDuration = snapDuration
  tDateProfile.snapsPerSlot = snapsPerSlot

  // more...

  let timeWindowMs = asRoughMs(dateProfile.maxTime) - asRoughMs(dateProfile.minTime)

  // TODO: why not use normalizeRange!?
  let normalizedStart = normalizeDate(dateProfile.renderRange.start, tDateProfile, dateEnv)
  let normalizedEnd = normalizeDate(dateProfile.renderRange.end, tDateProfile, dateEnv)

  // apply minTime/maxTime
  // TODO: View should be responsible.
  if (tDateProfile.isTimeScale) {
    normalizedStart = dateEnv.add(normalizedStart, dateProfile.minTime)
    normalizedEnd = dateEnv.add(
      addDays(normalizedEnd, -1),
      dateProfile.maxTime
    )
  }

  tDateProfile.timeWindowMs = timeWindowMs
  tDateProfile.normalizedRange = { start: normalizedStart, end: normalizedEnd }

  let slotDates = []
  let date = normalizedStart
  while (date < normalizedEnd) {
    if (isValidDate(date, tDateProfile, dateProfile, dateProfileGenerator)) {
      slotDates.push(date)
    }
    date = dateEnv.add(date, tDateProfile.slotDuration)
  }

  tDateProfile.slotDates = slotDates

  // more...

  let snapIndex = -1
  let snapDiff = 0 // index of the diff :(
  const snapDiffToIndex = []
  const snapIndexToDiff = []

  date = normalizedStart
  while (date < normalizedEnd) {
    if (isValidDate(date, tDateProfile, dateProfile, dateProfileGenerator)) {
      snapIndex++
      snapDiffToIndex.push(snapIndex)
      snapIndexToDiff.push(snapDiff)
    } else {
      snapDiffToIndex.push(snapIndex + 0.5)
    }
    date = dateEnv.add(date, tDateProfile.snapDuration)
    snapDiff++
  }

  tDateProfile.snapDiffToIndex = snapDiffToIndex
  tDateProfile.snapIndexToDiff = snapIndexToDiff

  tDateProfile.snapCnt = snapIndex + 1 // is always one behind
  tDateProfile.slotCnt = tDateProfile.snapCnt / tDateProfile.snapsPerSlot

  // more...

  tDateProfile.isWeekStarts = buildIsWeekStarts(tDateProfile, dateEnv)
  tDateProfile.cellRows = buildCellRows(tDateProfile, dateEnv, allOptions)

  return tDateProfile
}


/*
snaps to appropriate unit
*/
export function normalizeDate(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): DateMarker {
  let normalDate = date

  if (!tDateProfile.isTimeScale) {
    normalDate = startOfDay(normalDate)

    if (tDateProfile.largeUnit) {
      normalDate = dateEnv.startOf(normalDate, tDateProfile.largeUnit)
    }
  }

  return normalDate
}


/*
snaps to appropriate unit
*/
export function normalizeRange(range: DateRange, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): DateRange {

  if (!tDateProfile.isTimeScale) {
    range = computeVisibleDayRange(range)

    if (tDateProfile.largeUnit) {
      let dayRange = range // preserve original result

      range = {
        start: dateEnv.startOf(range.start, tDateProfile.largeUnit),
        end: dateEnv.startOf(range.end, tDateProfile.largeUnit)
      }

      // if date is partially through the interval, or is in the same interval as the start,
      // make the exclusive end be the *next* interval
      if (range.end.valueOf() !== dayRange.end.valueOf() || range.end <= range.start) {
        range = {
          start: range.start,
          end: dateEnv.add(range.end, tDateProfile.slotDuration)
        }
      }
    }
  }

  return range
}


export function isValidDate(date: DateMarker, tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
  if (dateProfileGenerator.isHiddenDay(date)) {
    return false
  } else if (tDateProfile.isTimeScale) {
    // determine if the time is within minTime/maxTime, which may have wacky values
    let day = startOfDay(date)
    let timeMs = date.valueOf() - day.valueOf()
    let ms = timeMs - asRoughMs(dateProfile.minTime) // milliseconds since minTime
    ms = ((ms % 86400000) + 86400000) % 86400000 // make negative values wrap to 24hr clock
    return ms < tDateProfile.timeWindowMs // before the maxTime?
  } else {
    return true
  }
}


function queryDurationOption(allOptions: any, name: string) {
  const input = allOptions[name]
  if (input != null) {
    return createDuration(input)
  }
}


function validateLabelAndSlot(tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateEnv: DateEnv) {
  const { currentRange } = dateProfile

  // make sure labelInterval doesn't exceed the max number of cells
  if (tDateProfile.labelInterval) {
    const labelCnt = dateEnv.countDurationsBetween(
      currentRange.start,
      currentRange.end,
      tDateProfile.labelInterval
    )
    if (labelCnt > config.MAX_TIMELINE_SLOTS) {
      console.warn('slotLabelInterval results in too many cells')
      tDateProfile.labelInterval = null
    }
  }

  // make sure slotDuration doesn't exceed the maximum number of cells
  if (tDateProfile.slotDuration) {
    const slotCnt = dateEnv.countDurationsBetween(
      currentRange.start,
      currentRange.end,
      tDateProfile.slotDuration
    )
    if (slotCnt > config.MAX_TIMELINE_SLOTS) {
      console.warn('slotDuration results in too many cells')
      tDateProfile.slotDuration = null
    }
  }

  // make sure labelInterval is a multiple of slotDuration
  if (tDateProfile.labelInterval && tDateProfile.slotDuration) {
    const slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)
    if (slotsPerLabel === null || slotsPerLabel < 1) {
      console.warn('slotLabelInterval must be a multiple of slotDuration')
      tDateProfile.slotDuration = null
    }
  }
}


function ensureLabelInterval(tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateEnv: DateEnv) {
  const { currentRange } = dateProfile
  let { labelInterval } = tDateProfile

  if (!labelInterval) {

    // compute based off the slot duration
    // find the largest label interval with an acceptable slots-per-label
    let input
    if (tDateProfile.slotDuration) {
      for (input of STOCK_SUB_DURATIONS) {
        const tryLabelInterval = createDuration(input)
        const slotsPerLabel = wholeDivideDurations(tryLabelInterval, tDateProfile.slotDuration)
        if (slotsPerLabel !== null && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
          labelInterval = tryLabelInterval
          break
        }
      }

      // use the slot duration as a last resort
      if (!labelInterval) {
        labelInterval = tDateProfile.slotDuration
      }

    // compute based off the view's duration
    // find the largest label interval that yields the minimum number of labels
    } else {
      for (input of STOCK_SUB_DURATIONS) {
        labelInterval = createDuration(input)
        const labelCnt = dateEnv.countDurationsBetween(
          currentRange.start,
          currentRange.end,
          labelInterval
        )
        if (labelCnt >= MIN_AUTO_LABELS) {
          break
        }
      }
    }

    tDateProfile.labelInterval = labelInterval
  }

  return labelInterval
}


function ensureSlotDuration(tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateEnv: DateEnv) {
  const { currentRange } = dateProfile
  let { slotDuration } = tDateProfile

  if (!slotDuration) {
    const labelInterval = ensureLabelInterval(tDateProfile, dateProfile, dateEnv) // will compute if necessary

    // compute based off the label interval
    // find the largest slot duration that is different from labelInterval, but still acceptable
    for (let input of STOCK_SUB_DURATIONS) {
      const trySlotDuration = createDuration(input)
      const slotsPerLabel = wholeDivideDurations(labelInterval, trySlotDuration)
      if (slotsPerLabel !== null && slotsPerLabel > 1 && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
        slotDuration = trySlotDuration
        break
      }
    }

    // only allow the value if it won't exceed the view's # of slots limit
    if (slotDuration) {
      const slotCnt = dateEnv.countDurationsBetween(
        currentRange.start,
        currentRange.end,
        slotDuration
      )
      if (slotCnt > MAX_AUTO_CELLS) {
        slotDuration = null
      }
    }

    // use the label interval as a last resort
    if (!slotDuration) {
      slotDuration = labelInterval
    }

    tDateProfile.slotDuration = slotDuration
  }

  return slotDuration
}


function computeHeaderFormats(tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateEnv: DateEnv, allOptions: any) {
  let format1
  let format2
  const { labelInterval } = tDateProfile
  let unit = greatestDurationDenominator(labelInterval).unit
  const weekNumbersVisible = allOptions.weekNumbers
  let format0 = (format1 = (format2 = null))

  // NOTE: weekNumber computation function wont work

  if ((unit === 'week') && !weekNumbersVisible) {
    unit = 'day'
  }

  switch (unit) {
    case 'year':
      format0 = { year: 'numeric' } // '2015'
      break

    case 'month':
      if (currentRangeAs('years', dateProfile, dateEnv) > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { month: 'short' } // 'Jan'
      break

    case 'week':
      if (currentRangeAs('years', dateProfile, dateEnv) > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { week: 'narrow' } // 'Wk4'
      break

    case 'day':
      if (currentRangeAs('years', dateProfile, dateEnv) > 1) {
        format0 = { year: 'numeric', month: 'long' } // 'January 2014'
      } else if (currentRangeAs('months', dateProfile, dateEnv) > 1) {
        format0 = { month: 'long' } // 'January'
      }

      if (weekNumbersVisible) {
        format1 = { week: 'short' } // 'Wk 4'
      }

      format2 = { weekday: 'narrow', day: 'numeric' } // 'Su 9'
      break

    case 'hour':
      if (weekNumbersVisible) {
        format0 = { week: 'short' } // 'Wk 4'
      }

      if (currentRangeAs('days', dateProfile, dateEnv) > 1) {
        format1 = { weekday: 'short', day: 'numeric', month: 'numeric', omitCommas: true } // Sat 4/7
      }

      format2 = {
        hour: 'numeric',
        minute: '2-digit',
        omitZeroMinute: true,
        meridiem: 'short'
      }
      break

    case 'minute':
      // sufficiently large number of different minute cells?
      if ((asRoughMinutes(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = {
          hour: 'numeric',
          meridiem: 'short'
        }
        format1 = function(params) {
          return ':' + padStart(params.date.minute, 2) // ':30'
        }
      } else {
        format0 = {
          hour: 'numeric',
          minute: 'numeric',
          meridiem: 'short'
        }
      }
      break

    case 'second':
      // sufficiently large number of different second cells?
      if ((asRoughSeconds(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = { hour: 'numeric', minute: '2-digit', meridiem: 'lowercase' } // '8:30 PM'
        format1 = function(params) {
          return ':' + padStart(params.date.second, 2) // ':30'
        }
      } else {
        format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit', meridiem: 'lowercase' } // '8:30:45 PM'
      }
      break

    case 'millisecond':
      format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit', meridiem: 'lowercase' } // '8:30:45 PM'
      format1 = function(params) {
        return '.' + padStart(params.millisecond, 3)
      }
      break
  }

  return [].concat(format0 || [], format1 || [], format2 || [])
}

// Compute the number of the give units in the "current" range.
// Won't go more precise than days.
// Will return `0` if there's not a clean whole interval.
function currentRangeAs(unit: string, dateProfile: DateProfile, dateEnv: DateEnv) {
  let range = dateProfile.currentRange
  let res = null

  if (unit === 'years') {
    res = dateEnv.diffWholeYears(range.start, range.end)
  } else if (unit === 'months') {
    res = dateEnv.diffWholeMonths(range.start, range.end)
  } else if (unit === 'weeks') {
    res = dateEnv.diffWholeMonths(range.start, range.end)
  } else if (unit === 'days') {
    res = diffWholeDays(range.start, range.end)
  }

  return res || 0
}


function buildIsWeekStarts(tDateProfile: TimelineDateProfile, dateEnv: DateEnv) {
  let { slotDates, emphasizeWeeks } = tDateProfile
  let prevWeekNumber = null
  let isWeekStarts: boolean[] = []

  for (let slotDate of slotDates) {
    let weekNumber = dateEnv.computeWeekNumber(slotDate)
    let isWeekStart = emphasizeWeeks && (prevWeekNumber !== null) && (prevWeekNumber !== weekNumber)
    prevWeekNumber = weekNumber

    isWeekStarts.push(isWeekStart)
  }

  return isWeekStarts
}


function buildCellRows(tDateProfile: TimelineDateProfile, dateEnv: DateEnv, allOptions: any) {
  let slotDates = tDateProfile.slotDates
  let formats = tDateProfile.headerFormats
  let cellRows = formats.map((format) => []) // indexed by row,col

  // specifically for navclicks
  let rowUnits = formats.map((format) => {
    return format.getLargestUnit ? format.getLargestUnit() : null
  })

  // builds cellRows and slotCells
  for (let i = 0; i < slotDates.length; i++) {
    let date = slotDates[i]
    let isWeekStart = tDateProfile.isWeekStarts[i]

    for (let row = 0; row < formats.length; row++) {
      let format = formats[row]
      let rowCells = cellRows[row]
      let leadingCell = rowCells[rowCells.length - 1]
      let isSuperRow = (formats.length > 1) && (row < (formats.length - 1)) // more than one row and not the last
      let newCell = null

      if (isSuperRow) {
        let text = dateEnv.format(date, format)
        if (!leadingCell || (leadingCell.text !== text)) {
          newCell = buildCellObject(date, text, rowUnits[row], allOptions, dateEnv)
        } else {
          leadingCell.colspan += 1
        }
      } else {
        if (
          !leadingCell ||
          isInt(dateEnv.countDurationsBetween(
            tDateProfile.normalizedRange.start,
            date,
            tDateProfile.labelInterval
          ))
        ) {
          let text = dateEnv.format(date, format)
          newCell = buildCellObject(date, text, rowUnits[row], allOptions, dateEnv)
        } else {
          leadingCell.colspan += 1
        }
      }

      if (newCell) {
        newCell.weekStart = isWeekStart
        rowCells.push(newCell)
      }
    }
  }

  return cellRows
}


function buildCellObject(date: DateMarker, text, rowUnit, allOptions: any, dateEnv: DateEnv): TimelineHeaderCell {
  const spanHtml = buildGotoAnchorHtml(
    allOptions,
    dateEnv,
    {
      date,
      type: rowUnit,
      forceOff: !rowUnit
    },
    {
      'class': 'fc-cell-text'
    },
    htmlEscape(text)
  )
  return { text, spanHtml, date, colspan: 1, isWeekStart: false }
}
