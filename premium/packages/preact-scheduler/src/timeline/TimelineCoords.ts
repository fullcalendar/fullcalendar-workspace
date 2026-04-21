import {
  DateEnv,
  DateMarker,
  isInt
} from '@fullcalendar/preact/protected-api'
import { TimelineDateProfile } from './timeline-date-profile'

/*
TODO: rename this file!
*/

// returned value is between 0 and the number of snaps
export function computeDateSnapCoverage(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): number {
  if (tDateProfile.isTimeScale && tDateProfile.timeAxis) {
    return computeTimedDateSnapCoverageFromMs(dateEnv.toDate(date).valueOf(), tDateProfile)
  }

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

export function computeDateSnapCoverageFromMs(dateMs: number, tDateProfile: TimelineDateProfile): number {
  if (tDateProfile.isTimeScale && tDateProfile.timeAxis) {
    return computeTimedDateSnapCoverageFromMs(dateMs, tDateProfile)
  }

  return 0
}

function computeTimedDateSnapCoverageFromMs(dateMs: number, tDateProfile: TimelineDateProfile): number {
  const { timeAxis } = tDateProfile
  const { snapBoundaryMs, snapDiffToIndex } = timeAxis

  if (!snapDiffToIndex.length) {
    return 0
  }

  if (dateMs <= snapBoundaryMs[0]) {
    return 0
  }

  if (dateMs >= snapBoundaryMs[snapBoundaryMs.length - 1]) {
    return tDateProfile.snapCnt
  }

  const nextBoundaryIndex = findNextBoundaryIndex(snapBoundaryMs, dateMs)
  const snapDiffInt = nextBoundaryIndex - 1
  let snapCoverage = snapDiffToIndex[snapDiffInt]

  if (isInt(snapCoverage)) {
    const startMs = snapBoundaryMs[snapDiffInt]
    const endMs = snapBoundaryMs[snapDiffInt + 1]
    const spanMs = endMs - startMs

    if (spanMs > 0) {
      snapCoverage += (dateMs - startMs) / spanMs
    }
  } else {
    snapCoverage = Math.ceil(snapCoverage)
  }

  return snapCoverage
}

function findNextBoundaryIndex(boundaryMs: number[], dateMs: number): number {
  for (let i = 1; i < boundaryMs.length; i += 1) {
    if (dateMs < boundaryMs[i]) {
      return i
    }
  }

  return boundaryMs.length - 1
}
