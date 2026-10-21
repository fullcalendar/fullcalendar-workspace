/*
The date profile's steps, as functions of the generator they run for (`gen`), called through it: every step
reaches its siblings as `gen.step(...)`, so a custom dateProfileGeneratorClass's overrides of any step apply
wherever it's reached (open recursion). DateProfileGenerator's methods delegate here.
See planning/phase-10-date-profile.md
*/
import {
  DateMarker,
  startOfDay,
  addDays,
  Duration,
  createDuration,
  asRoughDays,
  asRoughMs,
  greatestDurationDenominator,
  DateRange,
  OpenDateRange,
  constrainMarkerToRange,
  intersectRanges,
  rangeContainsMarker,
  rangesIntersect,
  parseRange,
  DateRangeInput,
} from '@full-ui/headless-calendar'
import { computeVisibleDayRange } from '../util/date'
import type { DateProfile, DateProfileGenerator } from './DateProfileGenerator'

/* Date Range Computation
------------------------------------------------------------------------------------------------------------------*/

/*
What each built profile was built from, so a new day can rebuild it the same way when a now-dependent
validRange changes (the store's stage 4). Kept beside the profile, not on it, so profiles keep their shape
*/
export interface DateProfileAnchor {
  date: DateMarker
  direction: number | undefined
  forceToValid: boolean
}

const dateProfileAnchors = new WeakMap<DateProfile, DateProfileAnchor>()

export function getDateProfileAnchor(dateProfile: DateProfile): DateProfileAnchor | undefined {
  return dateProfileAnchors.get(dateProfile)
}

// Builds a structure with info about what the dates/ranges will be for the "prev" view.
export function buildPrev(gen: DateProfileGenerator, currentDateProfile: DateProfile, currentDate: DateMarker, nowDate: DateMarker, forceToValid?: boolean): DateProfile {
  let { dateEnv } = gen.props

  let prevDate = dateEnv.subtract(
    dateEnv.startOf(currentDate, currentDateProfile.currentRangeUnit), // important for start-of-month
    currentDateProfile.dateIncrement,
  )

  return gen.build(prevDate, nowDate, -1, forceToValid)
}

// Builds a structure with info about what the dates/ranges will be for the "next" view.
export function buildNext(gen: DateProfileGenerator, currentDateProfile: DateProfile, currentDate: DateMarker, nowDate: DateMarker, forceToValid?: boolean): DateProfile {
  let { dateEnv } = gen.props

  let nextDate = dateEnv.add(
    dateEnv.startOf(currentDate, currentDateProfile.currentRangeUnit), // important for start-of-month
    currentDateProfile.dateIncrement,
  )

  return gen.build(nextDate, nowDate, 1, forceToValid)
}

// Builds a structure holding dates/ranges for rendering around the given date.
// Optional direction param indicates whether the date is being incremented/decremented
// from its previous value. decremented = -1, incremented = 1 (default).
// `untrimmedValidRange`: buildValidRange's result, already computed (the store's new-day probe)
export function build(
  gen: DateProfileGenerator,
  currentDate: DateMarker,
  nowDate: DateMarker,
  direction?,
  forceToValid = true,
  untrimmedValidRange?: OpenDateRange,
): DateProfile {
  let { props } = gen
  let anchor: DateProfileAnchor = { date: currentDate, direction, forceToValid }
  let validRange: DateRange
  let currentInfo
  let isRangeAllDay
  let renderRange: DateRange
  let activeRange: DateRange
  let isValid

  validRange = untrimmedValidRange !== undefined ? untrimmedValidRange : gen.buildValidRange(nowDate)
  validRange = gen.trimHiddenDays(validRange)

  if (forceToValid) {
    currentDate = constrainMarkerToRange(currentDate, validRange)
  }

  currentInfo = gen.buildCurrentRangeInfo(currentDate, direction)
  isRangeAllDay = /^(year|month|week|day)$/.test(currentInfo.unit)
  renderRange = gen.buildRenderRange(
    gen.trimHiddenDays(currentInfo.range),
    currentInfo.unit,
    isRangeAllDay,
  )
  renderRange = gen.trimHiddenDays(renderRange)
  activeRange = renderRange

  if (!props.showNonCurrentDates) {
    activeRange = intersectRanges(activeRange, currentInfo.range)
  }

  activeRange = gen.adjustActiveRange(activeRange)
  activeRange = intersectRanges(activeRange, validRange) // might return null

  // it's invalid if the originally requested date is not contained,
  // or if the range is completely outside of the valid range.
  isValid = rangesIntersect(currentInfo.range, validRange)

  // HACK: constrain to render-range so `currentDate` is more useful to view rendering
  if (!rangeContainsMarker(renderRange, currentDate)) {
    currentDate = renderRange.start
  }

  let dateProfile: DateProfile = {
    currentDate,

    // constraint for where prev/next operations can go and where events can be dragged/resized to.
    // an object with optional start and end properties.
    validRange,

    // range the view is formally responsible for.
    // for example, a month view might have 1st-31st, excluding padded dates
    currentRange: currentInfo.range,

    // name of largest unit being displayed, like "month" or "week"
    currentRangeUnit: currentInfo.unit,

    isRangeAllDay,

    // dates that display events and accept drag-n-drop
    // will be `null` if no dates accept events
    activeRange,

    // date range with a rendered skeleton
    // includes not-active days that need some sort of DOM
    renderRange,

    // Duration object that denotes the first visible time of any given day
    slotMinTime: props.slotMinTime,

    // Duration object that denotes the exclusive visible end time of any given day
    slotMaxTime: props.slotMaxTime,

    isValid,

    // how far the current date will move for a prev/next operation
    dateIncrement: gen.buildDateIncrement(currentInfo.duration),
    // pass a fallback (might be null) ^
  }

  dateProfileAnchors.set(dateProfile, anchor)

  return dateProfile
}

// Builds an object with optional start/end properties.
// Indicates the minimum/maximum dates to display.
// not responsible for trimming hidden days.
export function buildValidRange(gen: DateProfileGenerator, nowDate: DateMarker): OpenDateRange {
  let input = gen.props.validRangeInput
  let simpleInput = typeof input === 'function'
    ? input.call(gen.props.calendarApi, gen.props.dateEnv.toDate(nowDate))
    : input

  return gen.refineRange(simpleInput) ||
    { start: null, end: null } // completely open-ended
}

// Builds a structure with info about the "current" range, the range that is
// highlighted as being the current month for example.
// See build() for a description of `direction`.
// Guaranteed to have `range` and `unit` properties. `duration` is optional.
export function buildCurrentRangeInfo(gen: DateProfileGenerator, date: DateMarker, direction) {
  let { props } = gen
  let duration = null
  let unit = null
  let range = null
  let dayCount

  if (props.duration) {
    duration = props.duration
    unit = props.durationUnit
    range = gen.buildRangeFromDuration(date, direction, duration, unit)
  } else if ((dayCount = gen.props.dayCount)) {
    unit = 'day'
    range = gen.buildRangeFromDayCount(date, direction, dayCount)
  } else if ((range = gen.buildCustomVisibleRange(date))) {
    unit = props.dateEnv.greatestWholeUnit(range.start, range.end).unit
  } else {
    duration = gen.getFallbackDuration()
    unit = greatestDurationDenominator(duration).unit
    range = gen.buildRangeFromDuration(date, direction, duration, unit)
  }

  return { duration, unit, range }
}

export function getFallbackDuration(gen: DateProfileGenerator): Duration {
  return createDuration({ day: 1 })
}

// Returns a new activeRange to have time values (un-ambiguate)
// slotMinTime or slotMaxTime causes the range to expand.
export function adjustActiveRange(gen: DateProfileGenerator, range: DateRange) {
  let { dateEnv, usesMinMaxTime, slotMinTime, slotMaxTime } = gen.props
  let { start, end } = range

  if (usesMinMaxTime) {
    // expand active range if slotMinTime is negative (why not when positive?)
    if (asRoughDays(slotMinTime) < 0) {
      start = startOfDay(start) // necessary?
      start = dateEnv.add(start, slotMinTime)
    }

    // expand active range if slotMaxTime is beyond one day (why not when negative?)
    if (asRoughDays(slotMaxTime) > 1) {
      end = startOfDay(end) // necessary?
      end = addDays(end, -1)
      end = dateEnv.add(end, slotMaxTime)
    }
  }

  return { start, end }
}

// Builds the "current" range when it is specified as an explicit duration.
// `unit` is the already-computed greatestDurationDenominator unit of duration.
export function buildRangeFromDuration(gen: DateProfileGenerator, date: DateMarker, direction, duration: Duration, unit) {
  let { dateEnv, dateAlignment } = gen.props
  let start: DateMarker
  let end: DateMarker
  let res

  // compute what the alignment should be
  if (!dateAlignment) {
    let { dateIncrement } = gen.props

    if (dateIncrement) {
      // use the smaller of the two units
      if (asRoughMs(dateIncrement) < asRoughMs(duration)) {
        dateAlignment = greatestDurationDenominator(dateIncrement).unit
      } else {
        dateAlignment = unit
      }
    } else {
      dateAlignment = unit
    }
  }

  function computeRes() {
    start = dateEnv.startOf(date, dateAlignment)
    end = dateEnv.add(start, duration)
    res = { start, end }
  }

  computeRes()

  // if range is completely enveloped by hidden days, go past the hidden days
  if (!gen.trimHiddenDays(res)) {
    date = gen.skipHiddenDays(date, direction)
    computeRes()

    // aligning can snap back onto the same hidden days (a day view with dateAlignment 'week' and
    // weekends hidden), so start at the aligned period's first visible day instead
    if (!gen.trimHiddenDays(res)) {
      start = gen.skipHiddenDays(start)
      end = dateEnv.add(start, duration)
      res = { start, end }
    }
  }

  return res
}

// Builds the "current" range when a dayCount is specified.
export function buildRangeFromDayCount(gen: DateProfileGenerator, date: DateMarker, direction, dayCount) {
  let { dateEnv, dateAlignment } = gen.props
  let runningCount = 0
  let start: DateMarker = date
  let end: DateMarker

  if (dateAlignment) {
    start = dateEnv.startOf(start, dateAlignment)
  }

  start = startOfDay(start)
  start = gen.skipHiddenDays(start, direction)

  end = start
  do {
    end = addDays(end, 1)
    if (!gen.isHiddenDay(end)) {
      runningCount += 1
    }
  } while (runningCount < dayCount)

  return { start, end }
}

// Builds a normalized range object for the "visible" range,
// which is a way to define the currentRange and activeRange at the same time.
export function buildCustomVisibleRange(gen: DateProfileGenerator, date: DateMarker) {
  let { props } = gen
  let input = props.visibleRangeInput
  let simpleInput = typeof input === 'function'
    ? input.call(props.calendarApi, props.dateEnv.toDate(date))
    : input

  let range = gen.refineRange(simpleInput)

  if (range && (range.start == null || range.end == null)) {
    return null
  }

  return range
}

// Computes the range that will represent the element/cells for *rendering*,
// but which may have voided days/times.
// not responsible for trimming hidden days.
export function buildRenderRange(gen: DateProfileGenerator, currentRange: DateRange, currentRangeUnit, isRangeAllDay) {
  return gen.props.renderRange
    ? gen.props.renderRange(currentRange, currentRangeUnit, isRangeAllDay, gen.props)
    : currentRange
}

// Compute the duration value that should be added/substracted to the current date
// when a prev/next operation happens.
export function buildDateIncrement(gen: DateProfileGenerator, fallback): Duration {
  let { dateIncrement } = gen.props
  let customAlignment

  if (dateIncrement) {
    return dateIncrement
  }

  if ((customAlignment = gen.props.dateAlignment)) {
    return createDuration(1, customAlignment)
  }

  if (fallback) {
    return fallback
  }

  return createDuration({ days: 1 })
}

export function refineRange(gen: DateProfileGenerator, rangeInput: DateRangeInput | undefined): DateRange | null {
  if (rangeInput) {
    let range = parseRange(rangeInput, gen.props.dateEnv)

    if (range) {
      range = computeVisibleDayRange(range)
    }

    return range
  }

  return null
}

/* Hidden Days
------------------------------------------------------------------------------------------------------------------*/
// Initializes internal variables related to calculating hidden days-of-week
export function initHiddenDays(gen: DateProfileGenerator) {
  let hiddenDays = gen.props.hiddenDays || [] // array of day-of-week indices that are hidden
  let isHiddenDayHash = [] // is the day-of-week hidden? (hash with day-of-week-index -> bool)
  let dayCnt = 0
  let i

  if (gen.props.weekends === false) {
    // copy. mutating the user's array would make it unequal to their next equal-but-new array (#7069)
    hiddenDays = hiddenDays.concat([0, 6]) // 0=sunday, 6=saturday
  }

  for (i = 0; i < 7; i += 1) {
    if (
      !(isHiddenDayHash[i] = hiddenDays.indexOf(i) !== -1)
    ) {
      dayCnt += 1
    }
  }

  if (!dayCnt) {
    throw new Error('invalid hiddenDays') // all days were hidden? bad.
  }

  gen.isHiddenDayHash = isHiddenDayHash
}

// Remove days from the beginning and end of the range that are computed as hidden.
// If the whole range is trimmed off, returns null
export function trimHiddenDays(gen: DateProfileGenerator, range: DateRange): DateRange | null {
  let { start, end } = range

  if (start) {
    start = gen.skipHiddenDays(start)
  }

  if (end) {
    end = gen.skipHiddenDays(end, -1, true)
  }

  if (start == null || end == null || start < end) {
    return { start, end }
  }

  return null
}

// Is the current day hidden?
// `day` is a day-of-week index (0-6), or a Date (used for UTC)
export function isHiddenDay(gen: DateProfileGenerator, day) {
  if (day instanceof Date) {
    day = day.getUTCDay()
  }
  return gen.isHiddenDayHash[day]
}

// Incrementing the current day until it is no longer a hidden day, returning a copy.
// DOES NOT CONSIDER validRange!
// If the initial value of `date` is not a hidden day, don't do anything.
// Pass `isExclusive` as `true` if you are dealing with an end date.
// `inc` defaults to `1` (increment one day forward each time)
export function skipHiddenDays(gen: DateProfileGenerator, date: DateMarker, inc = 1, isExclusive = false) {
  while (
    gen.isHiddenDayHash[(date.getUTCDay() + (isExclusive ? inc : 0) + 7) % 7]
  ) {
    date = addDays(date, inc)
  }
  return date
}
