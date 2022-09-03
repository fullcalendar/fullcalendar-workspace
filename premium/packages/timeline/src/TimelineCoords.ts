import {
  PositionCache, findDirectChildren,
  isInt, DateProfile,
  DateMarker, DateEnv, Duration, startOfDay, rangeContainsMarker, CssDimValue, DateRange, SegSpan,
} from '@fullcalendar/common'
import { TimelineDateProfile } from './timeline-date-profile'

export class TimelineCoords { // TODO: rename to "slat" coords?
  outerCoordCache: PositionCache
  innerCoordCache: PositionCache

  constructor(
    public slatRootEl: HTMLElement, // okay to expose?
    slatEls: HTMLElement[],
    public dateProfile: DateProfile,
    private tDateProfile: TimelineDateProfile,
    private dateEnv: DateEnv,
    public isRtl: boolean,
  ) {
    this.outerCoordCache = new PositionCache(
      slatRootEl,
      slatEls,
      true, // isHorizontal
      false, // isVertical
    )

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.innerCoordCache = new PositionCache(
      slatRootEl,
      findDirectChildren(slatEls, 'div'),
      true, // isHorizontal
      false, // isVertical
    )
  }

  isDateInRange(date: DateMarker) {
    return rangeContainsMarker(this.dateProfile.currentRange, date)
  }

  // results range from negative width of area to 0
  dateToCoord(date: DateMarker): number {
    let { tDateProfile } = this
    let snapCoverage = this.computeDateSnapCoverage(date)
    let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, tDateProfile.slotCnt - 1)
    let partial = slotCoverage - slotIndex
    let { innerCoordCache, outerCoordCache } = this

    if (this.isRtl) {
      return outerCoordCache.originClientRect.width - (
        outerCoordCache.rights[slotIndex] -
        (innerCoordCache.getWidth(slotIndex) * partial)
      )
    }

    return (
      outerCoordCache.lefts[slotIndex] +
      (innerCoordCache.getWidth(slotIndex) * partial)
    )
  }

  rangeToCoords(range: DateRange): SegSpan {
    return {
      start: this.dateToCoord(range.start),
      end: this.dateToCoord(range.end),
    }
  }

  durationToCoord(duration: Duration): number {
    let { dateProfile, tDateProfile, dateEnv, isRtl } = this
    let coord = 0

    if (dateProfile) {
      let date = dateEnv.add(dateProfile.activeRange.start, duration)

      if (!tDateProfile.isTimeScale) {
        date = startOfDay(date)
      }

      coord = this.dateToCoord(date)

      // hack to overcome the left borders of non-first slat
      if (!isRtl && coord) {
        coord += 1
      }
    }

    return coord
  }

  coordFromLeft(coord: number) {
    if (this.isRtl) {
      return this.outerCoordCache.originClientRect.width - coord
    }
    return coord
  }

  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date: DateMarker): number {
    return computeDateSnapCoverage(date, this.tDateProfile, this.dateEnv)
  }
}

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
