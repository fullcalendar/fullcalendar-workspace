import { Duration } from '@fullcalendar/core'
import {
  config, computeVisibleDayRange, DateProfile, asCleanDays, addDays, wholeDivideDurations, DateMarker,
  startOfDay, createDuration, DateEnv, diffWholeDays, asRoughMs, createFormatter, greatestDurationDenominator,
  asRoughMinutes, padStart, asRoughSeconds, DateRange, isInt, DateProfileGenerator, BaseOptionsRefined,
  computeMajorUnit,
  isMajorUnit,
} from '@fullcalendar/core/internal'

export interface TimelineDateProfile {
  labelInterval: Duration
  slotDuration: Duration
  slotsPerLabel: number
  headerFormats: any
  isTimeScale: boolean
  largeUnit: string
  snapDuration: Duration
  snapsPerSlot: number
  normalizedRange: DateRange // snaps to unit. adds in slotMinTime/slotMaxTime
  timeWindowMs: number
  slotDates: DateMarker[]
  slotDatesMajor: boolean[]
  snapDiffToIndex: number[]
  snapIndexToDiff: number[]
  snapCnt: number
  slotCnt: number
  cellRows: TimelineHeaderCellData[][]
}

export interface TimelineHeaderCellData {
  date: DateMarker
  isMajor: boolean
  text: string
  rowUnit: string
  colspan: number
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
  { milliseconds: 1 },
]

export function buildTimelineDateProfile(
  dateProfile: DateProfile,
  dateEnv: DateEnv,
  allOptions: BaseOptionsRefined,
  dateProfileGenerator: DateProfileGenerator,
): TimelineDateProfile {
  let tDateProfile = {
    labelInterval: allOptions.slotLabelInterval,
    slotDuration: allOptions.slotDuration,
  } as TimelineDateProfile

  validateLabelAndSlot(tDateProfile, dateProfile, dateEnv) // validate after computed grid duration
  ensureLabelInterval(tDateProfile, dateProfile, dateEnv)
  ensureSlotDuration(tDateProfile, dateProfile, dateEnv)

  let input = allOptions.slotLabelFormat
  let rawFormats =
    Array.isArray(input) ? input :
      (input != null) ? [input] :
        computeHeaderFormats(tDateProfile, dateProfile, dateEnv, allOptions)

  tDateProfile.headerFormats = rawFormats.map((rawFormat) => createFormatter(rawFormat))

  tDateProfile.isTimeScale = Boolean(tDateProfile.slotDuration.milliseconds)

  let largeUnit = null
  if (!tDateProfile.isTimeScale) {
    const slotUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    if (/year|month|week/.test(slotUnit)) {
      largeUnit = slotUnit
    }
  }

  tDateProfile.largeUnit = largeUnit

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

  let timeWindowMs = asRoughMs(dateProfile.slotMaxTime) - asRoughMs(dateProfile.slotMinTime)

  // TODO: why not use normalizeRange!?
  let normalizedStart = normalizeDate(dateProfile.renderRange.start, tDateProfile, dateEnv)
  let normalizedEnd = normalizeDate(dateProfile.renderRange.end, tDateProfile, dateEnv)

  // apply slotMinTime/slotMaxTime
  // TODO: View should be responsible.
  if (tDateProfile.isTimeScale) {
    normalizedStart = dateEnv.add(normalizedStart, dateProfile.slotMinTime)
    normalizedEnd = dateEnv.add(
      addDays(normalizedEnd, -1),
      dateProfile.slotMaxTime,
    )
  }

  tDateProfile.timeWindowMs = timeWindowMs
  tDateProfile.normalizedRange = { start: normalizedStart, end: normalizedEnd }

  let slotDates: DateMarker[] = []
  let slotDatesMajor: boolean[] = []
  let date = normalizedStart
  let majorUnit = computeMajorUnit(dateProfile, dateEnv)

  while (date < normalizedEnd) {
    if (isValidDate(date, tDateProfile, dateProfile, dateProfileGenerator)) {
      slotDates.push(date)
      slotDatesMajor.push(isMajorUnit(date, majorUnit, dateEnv))
    }
    date = dateEnv.add(date, tDateProfile.slotDuration)
  }

  tDateProfile.slotDates = slotDates
  tDateProfile.slotDatesMajor = slotDatesMajor

  // more...

  let snapIndex = -1
  let snapDiff = 0 // index of the diff :(
  const snapDiffToIndex = []
  const snapIndexToDiff = []

  date = normalizedStart
  while (date < normalizedEnd) {
    if (isValidDate(date, tDateProfile, dateProfile, dateProfileGenerator)) {
      snapIndex += 1
      snapDiffToIndex.push(snapIndex)
      snapIndexToDiff.push(snapDiff)
    } else {
      snapDiffToIndex.push(snapIndex + 0.5)
    }
    date = dateEnv.add(date, tDateProfile.snapDuration)
    snapDiff += 1
  }

  tDateProfile.snapDiffToIndex = snapDiffToIndex
  tDateProfile.snapIndexToDiff = snapIndexToDiff

  tDateProfile.snapCnt = snapIndex + 1 // is always one behind
  tDateProfile.slotCnt = tDateProfile.snapCnt / tDateProfile.snapsPerSlot

  // more...

  tDateProfile.cellRows = buildCellRows(tDateProfile, dateEnv, majorUnit)
  tDateProfile.slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

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
        end: dateEnv.startOf(range.end, tDateProfile.largeUnit),
      }

      // if date is partially through the interval, or is in the same interval as the start,
      // make the exclusive end be the *next* interval
      if (range.end.valueOf() !== dayRange.end.valueOf() || range.end <= range.start) {
        range = {
          start: range.start,
          end: dateEnv.add(range.end, tDateProfile.slotDuration),
        }
      }
    }
  }

  return range
}

export function isValidDate(
  date: DateMarker,
  tDateProfile: TimelineDateProfile,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
) {
  if (dateProfileGenerator.isHiddenDay(date)) {
    return false
  }

  if (tDateProfile.isTimeScale) {
    // determine if the time is within slotMinTime/slotMaxTime, which may have wacky values
    let day = startOfDay(date)
    let timeMs = date.valueOf() - day.valueOf()
    let ms = timeMs - asRoughMs(dateProfile.slotMinTime) // milliseconds since slotMinTime
    ms = ((ms % 86400000) + 86400000) % 86400000 // make negative values wrap to 24hr clock
    return ms < tDateProfile.timeWindowMs // before the slotMaxTime?
  }

  return true
}

function validateLabelAndSlot(tDateProfile: TimelineDateProfile, dateProfile: DateProfile, dateEnv: DateEnv) {
  const { currentRange } = dateProfile

  // make sure labelInterval doesn't exceed the max number of cells
  if (tDateProfile.labelInterval) {
    const labelCnt = dateEnv.countDurationsBetween(
      currentRange.start,
      currentRange.end,
      tDateProfile.labelInterval,
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
      tDateProfile.slotDuration,
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
          labelInterval,
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
        slotDuration,
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

function computeHeaderFormats(
  tDateProfile: TimelineDateProfile,
  dateProfile: DateProfile,
  dateEnv: DateEnv,
  allOptions: BaseOptionsRefined,
) {
  let format1
  let format2
  const { labelInterval } = tDateProfile
  const { currentRange } = dateProfile
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
      if (dateEnv.diffWholeYears(currentRange.start, currentRange.end) > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { month: 'short' } // 'Jan'
      break

    case 'week':
      if (dateEnv.diffWholeYears(currentRange.start, currentRange.end) > 1) {
        format0 = { year: 'numeric' } // '2015'
      }

      format1 = { week: 'narrow' } // 'Wk4'
      break

    case 'day':
      if (dateEnv.diffWholeYears(currentRange.start, currentRange.end) > 1) {
        format0 = { year: 'numeric', month: 'long' } // 'January 2014'
      } else if (dateEnv.diffWholeMonths(currentRange.start, currentRange.end) > 1) {
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

      if (diffWholeDays(currentRange.start, currentRange.end) > 1) {
        format1 = { weekday: 'short', day: 'numeric', month: 'numeric', omitCommas: true } // Sat 4/7
      }

      format2 = {
        hour: 'numeric',
        minute: '2-digit',
        omitZeroMinute: true,
        meridiem: 'short',
      }
      break

    case 'minute':
      // sufficiently large number of different minute cells?
      if ((asRoughMinutes(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = {
          hour: 'numeric',
          meridiem: 'short',
        }
        format1 = (params) => (
          ':' + padStart(params.date.minute, 2) // ':30'
        )
      } else {
        format0 = {
          hour: 'numeric',
          minute: 'numeric',
          meridiem: 'short',
        }
      }
      break

    case 'second':
      // sufficiently large number of different second cells?
      if ((asRoughSeconds(labelInterval) / 60) >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = { hour: 'numeric', minute: '2-digit', meridiem: 'lowercase' } // '8:30 PM'
        format1 = (params) => (
          ':' + padStart(params.date.second, 2) // ':30'
        )
      } else {
        format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit', meridiem: 'lowercase' } // '8:30:45 PM'
      }
      break

    case 'millisecond':
      format0 = { hour: 'numeric', minute: '2-digit', second: '2-digit', meridiem: 'lowercase' } // '8:30:45 PM'
      format1 = (params) => (
        '.' + padStart(params.millisecond, 3)
      )
      break
  }

  return [].concat(format0 || [], format1 || [], format2 || [])
}

function buildCellRows(
  tDateProfile: TimelineDateProfile,
  dateEnv: DateEnv,
  majorUnit: string,
) {
  let slotDates = tDateProfile.slotDates
  let formats = tDateProfile.headerFormats
  let cellRows = formats.map(() => []) // indexed by row,col
  let slotAsDays = asCleanDays(tDateProfile.slotDuration)
  let guessedSlotUnit =
    slotAsDays === 7 ? 'week' :
      slotAsDays === 1 ? 'day' :
        null

  // specifically for navclicks
  let rowUnitsFromFormats = formats.map(
    (format) => (format.getSmallestUnit ? format.getSmallestUnit() : null)
  )

  // builds cellRows and slotCells
  for (let i = 0; i < slotDates.length; i += 1) {
    let date = slotDates[i]

    for (let row = 0; row < formats.length; row += 1) {
      let format = formats[row]
      let rowCells = cellRows[row]
      let leadingCell = rowCells[rowCells.length - 1]
      let isLastRow = row === formats.length - 1
      let isSuperRow = formats.length > 1 && !isLastRow // more than one row and not the last
      let isMajor = isMajorUnit(date, majorUnit, dateEnv)
      let newCell = null
      let rowUnit = rowUnitsFromFormats[row] || (isLastRow ? guessedSlotUnit : null)

      if (isSuperRow) {
        let [text] = dateEnv.format(date, format)
        if (!leadingCell || (leadingCell.text !== text)) {
          newCell = buildCellObject(date, isMajor, text, rowUnit)
        } else {
          leadingCell.colspan += 1
        }
      } else if (
        !leadingCell ||
        isInt(dateEnv.countDurationsBetween(
          tDateProfile.normalizedRange.start,
          date,
          tDateProfile.labelInterval,
        ))
      ) {
        let [text] = dateEnv.format(date, format)
        newCell = buildCellObject(date, isMajor, text, rowUnit)
      } else {
        leadingCell.colspan += 1
      }

      if (newCell) {
        rowCells.push(newCell)
      }
    }
  }

  return cellRows
}

function buildCellObject(date: DateMarker, isMajor: boolean, text: string, rowUnit: string): TimelineHeaderCellData {
  return { date, isMajor, text, rowUnit, colspan: 1 } // colspan mutated later
}
