import {
  DateMarker,
  startOfDay,
  diffWholeWeeks,
  diffWholeDays,
  Duration,
  DateRange,
  OpenDateRange,
  DateRangeInput,
  DateEnv,
} from '@full-ui/headless-calendar'
import * as dp from './structs/date-profile'
import { HiddenDays } from './structs/hidden-days'
import { CalendarApiImpl } from './api/CalendarApiImpl'

export interface DateProfile {
  currentDate: DateMarker
  isValid: boolean
  validRange: OpenDateRange // dates in past/present/future the user can interact with
  renderRange: DateRange // dates that get rendered (even if they're completely blank)
  activeRange: DateRange | null // dates where content is rendered
  currentRange: DateRange // dates for current interval (TODO: include slotMinTime/slotMaxTime?)
  currentRangeUnit: string
  isRangeAllDay: boolean
  dateIncrement: Duration
  slotMinTime: Duration
  slotMaxTime: Duration
}

export interface DateProfileGeneratorProps extends DateProfileOptions {
  dateProfileGeneratorClass: DateProfileGeneratorClass // not used by DateProfileGenerator itself
  renderRange?: RenderRangeBuilder // the view's (dateProfileRenderRange), for the base class only
  duration: Duration
  durationUnit: string
  usesMinMaxTime: boolean
  dateEnv: DateEnv
  calendarApi: CalendarApiImpl
}

export interface DateProfileOptions {
  slotMinTime: Duration
  slotMaxTime: Duration
  showNonCurrentDates?: boolean
  dayCount?: number
  dateAlignment?: string
  dateIncrement?: Duration
  hiddenDays?: number[]
  weekends?: boolean
  validRangeInput?: DateRangeInput | ((this: CalendarApiImpl, nowDate: Date) => DateRangeInput)
  visibleRangeInput?: DateRangeInput | ((this: CalendarApiImpl, nowDate: Date) => DateRangeInput)
  fixedWeekCount?: boolean
}

// computes the range rendered for a current range (the table views snap to weeks)
export type RenderRangeBuilder = (
  currentRange: DateRange,
  currentRangeUnit: string,
  isRangeAllDay: boolean,
  props: DateProfileGeneratorProps,
) => DateRange

export type DateProfileGeneratorClass = {
  new(props: DateProfileGeneratorProps): DateProfileGenerator
}

/*
Builds a view's date profile. Its methods are steps that a custom class (the internal
dateProfileGeneratorClass view option, set by a plugin's view) may override; each delegates to
structs/date-profile.ts with `this`, which calls the other steps through it, so overrides apply.
Views supply their render range with the dateProfileRenderRange view option (see the daygrid's table
range), which reaches the base class as `props.renderRange`.
*/
export class DateProfileGenerator { // also used for isHiddenDay
  isHiddenDayHash: boolean[]
  private hiddenDaysObj: HiddenDays | undefined

  constructor(public props: DateProfileGeneratorProps) {
    this.initHiddenDays()
  }

  // the hidden days as a value object, through this generator's methods (so a custom class's overrides
  // apply). for consumers migrating off isHiddenDay/skipHiddenDays (phase 7b, phase 11)
  get hiddenDays(): HiddenDays {
    return this.hiddenDaysObj || (this.hiddenDaysObj = {
      isHidden: (dayOrDate) => this.isHiddenDay(dayOrDate),
      skip: (date, inc, isExclusive) => this.skipHiddenDays(date, inc, isExclusive),
      trim: (range) => this.trimHiddenDays(range),
    })
  }

  /* Date Range Computation
  ------------------------------------------------------------------------------------------------------------------*/

  // Builds a structure with info about what the dates/ranges will be for the "prev" view.
  buildPrev(currentDateProfile: DateProfile, currentDate: DateMarker, nowDate: DateMarker, forceToValid?: boolean): DateProfile {
    return dp.buildPrev(this, currentDateProfile, currentDate, nowDate, forceToValid)
  }

  // Builds a structure with info about what the dates/ranges will be for the "next" view.
  buildNext(currentDateProfile: DateProfile, currentDate: DateMarker, nowDate: DateMarker, forceToValid?: boolean): DateProfile {
    return dp.buildNext(this, currentDateProfile, currentDate, nowDate, forceToValid)
  }

  // Builds a structure holding dates/ranges for rendering around the given date.
  // Optional direction param indicates whether the date is being incremented/decremented
  // from its previous value. decremented = -1, incremented = 1 (default).
  build(currentDate: DateMarker, nowDate: DateMarker, direction?, forceToValid = true): DateProfile {
    return dp.build(this, currentDate, nowDate, direction, forceToValid)
  }

  // Builds an object with optional start/end properties.
  // Indicates the minimum/maximum dates to display.
  // not responsible for trimming hidden days.
  buildValidRange(nowDate: DateMarker): OpenDateRange {
    return dp.buildValidRange(this, nowDate)
  }

  // Builds a structure with info about the "current" range, the range that is
  // highlighted as being the current month for example.
  // See build() for a description of `direction`.
  // Guaranteed to have `range` and `unit` properties. `duration` is optional.
  buildCurrentRangeInfo(date: DateMarker, direction) {
    return dp.buildCurrentRangeInfo(this, date, direction)
  }

  getFallbackDuration(): Duration {
    return dp.getFallbackDuration(this)
  }

  // Returns a new activeRange to have time values (un-ambiguate)
  // slotMinTime or slotMaxTime causes the range to expand.
  adjustActiveRange(range: DateRange) {
    return dp.adjustActiveRange(this, range)
  }

  // Builds the "current" range when it is specified as an explicit duration.
  // `unit` is the already-computed greatestDurationDenominator unit of duration.
  buildRangeFromDuration(date: DateMarker, direction, duration: Duration, unit) {
    return dp.buildRangeFromDuration(this, date, direction, duration, unit)
  }

  // Builds the "current" range when a dayCount is specified.
  buildRangeFromDayCount(date: DateMarker, direction, dayCount) {
    return dp.buildRangeFromDayCount(this, date, direction, dayCount)
  }

  // Builds a normalized range object for the "visible" range,
  // which is a way to define the currentRange and activeRange at the same time.
  buildCustomVisibleRange(date: DateMarker) {
    return dp.buildCustomVisibleRange(this, date)
  }

  // Computes the range that will represent the element/cells for *rendering*,
  // but which may have voided days/times.
  // not responsible for trimming hidden days.
  buildRenderRange(currentRange: DateRange, currentRangeUnit, isRangeAllDay) {
    return dp.buildRenderRange(this, currentRange, currentRangeUnit, isRangeAllDay)
  }

  // Compute the duration value that should be added/substracted to the current date
  // when a prev/next operation happens.
  buildDateIncrement(fallback): Duration {
    return dp.buildDateIncrement(this, fallback)
  }

  refineRange(rangeInput: DateRangeInput | undefined): DateRange | null {
    return dp.refineRange(this, rangeInput)
  }

  /* Hidden Days
  ------------------------------------------------------------------------------------------------------------------*/

  // Initializes internal variables related to calculating hidden days-of-week
  initHiddenDays() {
    return dp.initHiddenDays(this)
  }

  // Remove days from the beginning and end of the range that are computed as hidden.
  // If the whole range is trimmed off, returns null
  trimHiddenDays(range: DateRange): DateRange | null {
    return dp.trimHiddenDays(this, range)
  }

  // Is the current day hidden?
  // `day` is a day-of-week index (0-6), or a Date (used for UTC)
  isHiddenDay(day) {
    return dp.isHiddenDay(this, day)
  }

  // Incrementing the current day until it is no longer a hidden day, returning a copy.
  // DOES NOT CONSIDER validRange!
  // If the initial value of `date` is not a hidden day, don't do anything.
  // Pass `isExclusive` as `true` if you are dealing with an end date.
  // `inc` defaults to `1` (increment one day forward each time)
  skipHiddenDays(date: DateMarker, inc = 1, isExclusive = false) {
    return dp.skipHiddenDays(this, date, inc, isExclusive)
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

export function computeMajorUnit(dateProfile: DateProfile, dateEnv: DateEnv): string | undefined {
  const { currentRange } = dateProfile

  if (dateProfile.currentRangeUnit === 'year') {
    if (dateEnv.diffWholeYears(currentRange.start, currentRange.end) > 1) {
      return 'year'
    } else {
      return 'month'
    }
  } else if (dateProfile.currentRangeUnit === 'month') {
    if (dateEnv.diffWholeMonths(currentRange.start, currentRange.end) > 1) {
      return 'month'
    }
  } else if (dateProfile.currentRangeUnit === 'week') {
    if (diffWholeWeeks(currentRange.start, currentRange.end) > 1) {
      return 'week'
    }
  } else if (dateProfile.currentRangeUnit === 'day') {
    if (diffWholeDays(currentRange.start, currentRange.end) > 1) {
      return 'day'
    }
  }
}

export function isMajorUnit(dateMarker: DateMarker, majorUnit: string, dateEnv: DateEnv): boolean {
  const isStartOfDay = dateMarker.valueOf() === startOfDay(dateMarker).valueOf()

  if (isStartOfDay) {
    if (majorUnit === 'year') {
      return !dateEnv.getMonth(dateMarker) && dateEnv.getDay(dateMarker) === 1
    } else if (majorUnit === 'month') {
      return dateEnv.getDay(dateMarker) === 1
    } else if (majorUnit === 'week') {
      return dateMarker.getUTCDay() === dateEnv.weekDow
    } else if (majorUnit === 'day') {
      return true
    }
  }

  return false
}
