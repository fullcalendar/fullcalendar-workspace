import { CssDimValue } from '@fullcalendar/core'
import {
  DateEnv,
  DateMarker,
  SegSpan,
  isInt
} from '@fullcalendar/core/internal'
import { TimelineSegHorizontals } from './event-placement.js'
import { TimelineDateProfile } from './timeline-date-profile.js'

/*
TODO: rename this file!
*/

// returned value is between 0 and the number of snaps
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
TODO: audit!!!
*/
export function coordToCss(
  hcoord: number | null,
  isRtl: boolean,
): { left: CssDimValue, right: CssDimValue } {
  if (hcoord === null) {
    return { left: '', right: '' }
  }
  if (isRtl) {
    return { right: hcoord, left: '' }
  }
  return { left: hcoord, right: '' }
}

/*
TODO: audit!!!
*/
export function coordsToCss(
  hcoords: SegSpan | null,
  isRtl: boolean,
): { left: CssDimValue, right: CssDimValue } {
  if (!hcoords) {
    return { left: '', right: '' }
  }
  if (isRtl) {
    return { right: hcoords.start, left: -hcoords.end }
  }
  return { left: hcoords.start, right: -hcoords.end }
}

/*
TODO: DRY up with elsewhere?
*/
export function horizontalsToCss(
  hcoord: TimelineSegHorizontals | null,
  isRtl: boolean,
): { left?: CssDimValue, right?: CssDimValue, width?: CssDimValue } {
  if (!hcoord) {
    return {}
  }
  if (isRtl) {
    return { right: hcoord.start, width: hcoord.size }
  } else {
    return { left: hcoord.start, width: hcoord.size }
  }
}

export function horizontalCoordToCss(
  start: number,
  isRtl: boolean,
): { left?: CssDimValue, right?: CssDimValue } {
  if (isRtl) {
    return { right: start }
  } else {
    return { left: start }
  }
}
