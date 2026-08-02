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
  const { slots } = tDateProfile.timeAxis

  if (!slots.length || dateMs <= slots[0].startMs) {
    return 0
  }

  if (dateMs >= slots[slots.length - 1].endMs) {
    return slots.length
  }

  const slotIndex = findLastSlotIndex(slots, dateMs)
  const slot = slots[slotIndex]
  const clampedMs = Math.min(dateMs, slot.endMs)

  return slotIndex + (clampedMs - slot.startMs) / (slot.endMs - slot.startMs)
}

/*
Binary search for the largest index whose slot starts at-or-before dateMs.
Caller must ensure dateMs is within (slots[0].startMs, axis end).
*/
function findLastSlotIndex(slots: { startMs: number }[], dateMs: number): number {
  let lo = 0
  let hi = slots.length - 1

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (slots[mid].startMs <= dateMs) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  return lo
}
