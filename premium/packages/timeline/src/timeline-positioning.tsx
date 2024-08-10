import { DateEnv, DateMarker, DateProfile, isInt, startOfDay } from '@fullcalendar/core/internal';
import { TimelineDateProfile } from './timeline-date-profile.js'
import { Duration } from '@fullcalendar/core'

export interface CoordRange { // TODO: DRY. repeat data structures
  start: number
  size: number
}

export function createVerticalStyle(
  props: { start: number; size: number; } | undefined,
): { top: number, height: number } | undefined {
  if (props) {
    return {
      top: props.start,
      height: props.size,
    };
  }
}

export function createHorizontalStyle(
  props: { start: number; size: number; } | undefined,
  isRtl: boolean
): { left: number, width: number } | { right: number, width: number } | undefined {
  if (props) {
    return {
      [isRtl ? 'right' : 'left']: props.start,
      width: props.size,
    } as any
  }
}

// Timeline-specific
// -------------------------------------------------------------------------------------------------

/*
TODO: DRY with computeSlatHeight?
*/
export function computeSlotWidth(
  slatCnt: number,
  slatMinWidth: number | undefined,
  slatInnerWidth: number | undefined,
  scrollerHeight: number | undefined,
): [
  canvasWidth: number | undefined,
  slatWidth: number | undefined,
  slatLiquid: boolean,
] {
  if (!slatInnerWidth || !scrollerHeight) {
    return [undefined, undefined, false]
  }

  slatMinWidth = Math.max(slatMinWidth || 0, slatInnerWidth + 1)
  const slatTryWidth = scrollerHeight / slatCnt
  let slatLiquid: boolean
  let slatWidth: number

  if (slatTryWidth >= slatMinWidth) {
    slatLiquid = true
    slatWidth = slatTryWidth
  } else {
    slatLiquid = false
    slatWidth = Math.max(slatMinWidth, slatTryWidth)
  }

  return [slatWidth * slatCnt, slatWidth, slatLiquid]
}

export function timeToCoord( // pixels
  time: Duration,
  dateEnv: DateEnv,
  dateProfile: DateProfile,
  tDateProfile: TimelineDateProfile,
  slowWidth: number,
): number {
  let date = dateEnv.add(dateProfile.activeRange.start, time)

  if (!tDateProfile.isTimeScale) {
    date = startOfDay(date)
  }

  return dateToCoord(date, dateEnv, tDateProfile, slowWidth)
}

export function dateToCoord( // pixels
  date: DateMarker,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  let snapCoverage = computeDateSnapCoverage(date, tDateProfile, dateEnv)
  let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
  return slotCoverage * slotWidth
}

/*
returned value is between 0 and the number of snaps
*/
function computeDateSnapCoverage(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): number {
  let snapDiff = dateEnv.countDurationsBetween(
    tDateProfile.normalizedRange.start,
    date,
    tDateProfile.snapDuration,
  )

  if (snapDiff < 0) {
    return 0
  }

  if (snapDiff >= tDateProfile.snapDiffToIndex.length) {
    return tDateProfile.snapCnt
  }

  let snapDiffInt = Math.floor(snapDiff)
  let snapCoverage = tDateProfile.snapDiffToIndex[snapDiffInt]

  if (isInt(snapCoverage)) { // not an in-between value
    snapCoverage += snapDiff - snapDiffInt // add the remainder
  } else {
    // a fractional value, meaning the date is not visible
    // always round up in this case. works for start AND end dates in a range.
    snapCoverage = Math.ceil(snapCoverage)
  }

  return snapCoverage
}
