import { DateEnv, DateMarker, DateProfile, isInt, startOfDay } from '@fullcalendar/core/internal';
import { TimelineDateProfile } from './timeline-date-profile.js'
import { Duration } from '@fullcalendar/core'

// Timeline-specific
// -------------------------------------------------------------------------------------------------

const MIN_SLOT_WIDTH = 30 // for real

/*
TODO: DRY with computeSlatHeight?
*/
export function computeSlotWidth(
  slatCnt: number,
  slatsPerLabel: number,
  slatMinWidth: number | undefined,
  labelInnerWidth: number | undefined,
  viewportWidth: number | undefined,
): [
  canvasWidth: number | undefined,
  slatWidth: number | undefined,
  slatLiquid: boolean, // unused. TODO: kill this or have good reason to revive
] {
  if (labelInnerWidth == null || viewportWidth == null) {
    return [undefined, undefined, false]
  }

  slatMinWidth = Math.max(
    slatMinWidth || 0,
    (labelInnerWidth + 1) / slatsPerLabel,
    MIN_SLOT_WIDTH,
  )
  const slatTryWidth = viewportWidth / slatCnt
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
