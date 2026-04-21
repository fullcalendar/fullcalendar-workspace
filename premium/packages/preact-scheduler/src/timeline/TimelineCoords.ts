import {
  DateEnv,
  DateMarker,
  isInt
} from '@fullcalendar/preact/protected-api'
import { TimelineDateProfile } from './timeline-date-profile'

/*
TODO: rename this file!
*/

/*
For WHOLE-DAY axes only. Timed axes use computeMsSlotCoverage instead.
Returned value is between 0 and the number of snaps.
*/
export function computeDateSnapCoverage(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): number {
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

/*
For TIMED axes only (tDateProfile.timeAxis must be populated).
Returned value is in SLOT units, between 0 and the number of visible slots.
Interpolates within each slot's real instant span, so slots keep their rendered width even
when a DST transition makes their real spans unequal. Instants between visible slots
(hidden times) collapse to the boundary coordinate.
*/
export function computeMsSlotCoverage(dateMs: number, tDateProfile: TimelineDateProfile): number {
  const { slotStartMs, slotEndMs } = tDateProfile.timeAxis

  if (!slotStartMs.length || dateMs <= slotStartMs[0]) {
    return 0
  }

  if (dateMs >= slotEndMs[slotEndMs.length - 1]) {
    return slotStartMs.length
  }

  const slotIndex = findLastSlotIndex(slotStartMs, dateMs)
  const clampedMs = Math.min(dateMs, slotEndMs[slotIndex])

  return slotIndex + (clampedMs - slotStartMs[slotIndex]) / (slotEndMs[slotIndex] - slotStartMs[slotIndex])
}

/*
Binary search for the largest index whose slot starts at-or-before dateMs.
Caller must ensure dateMs is within (slotStartMs[0], axis end).
*/
function findLastSlotIndex(slotStartMs: number[], dateMs: number): number {
  let lo = 0
  let hi = slotStartMs.length - 1

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (slotStartMs[mid] <= dateMs) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  return lo
}
