import {
  PositionCache, findDirectChildren,
  isInt, DateProfile,
  DateMarker, DateEnv, Duration, startOfDay, rangeContainsMarker
} from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export class TimelineCoords { // TODO: rename to "slat" coords?

  outerCoordCache: PositionCache
  innerCoordCache: PositionCache


  constructor(
    public slatRootEl: HTMLElement, // okay to expose?
    slatEls: HTMLElement[],
    private dateProfile: DateProfile,
    private tDateProfile: TimelineDateProfile,
    private dateEnv: DateEnv,
    public isRtl: boolean
  ) {
    this.outerCoordCache = new PositionCache(
      slatRootEl,
      slatEls,
      true, // isHorizontal
      false // isVertical
    )

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.innerCoordCache = new PositionCache(
      slatRootEl,
      findDirectChildren(slatEls, 'div'),
      true, // isHorizontal
      false // isVertical
    )
  }


  rangeToCoords(range) {
    if (this.isRtl) {
      return { right: this.dateToCoord(range.start), left: this.dateToCoord(range.end) }
    } else {
      return { left: this.dateToCoord(range.start), right: this.dateToCoord(range.end) }
    }
  }


  isDateInRange(date: DateMarker) {
    return rangeContainsMarker(this.dateProfile.currentRange, date)
  }


  // for LTR, results range from 0 to width of area
  // for RTL, results range from negative width of area to 0
  dateToCoord(date) {
    let { tDateProfile } = this
    let snapCoverage = this.computeDateSnapCoverage(date)
    let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, tDateProfile.slotCnt - 1)
    let partial = slotCoverage - slotIndex
    let { innerCoordCache, outerCoordCache } = this

    if (this.isRtl) {
      return (
        outerCoordCache.rights[slotIndex] -
        (innerCoordCache.getWidth(slotIndex) * partial)
      ) - outerCoordCache.originClientRect.width
    } else {
      return (
        outerCoordCache.lefts[slotIndex] +
        (innerCoordCache.getWidth(slotIndex) * partial)
      )
    }
  }


  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date: DateMarker): number {
    return computeDateSnapCoverage(date, this.tDateProfile, this.dateEnv)
  }


  computeDurationLeft(duration: Duration) {
    let { dateProfile, dateEnv, isRtl } = this
    let left = 0

    if (dateProfile) {
      left = this.dateToCoord(
        dateEnv.add(
          startOfDay(dateProfile.activeRange.start), // startOfDay needed?
          duration
        )
      )

      // hack to overcome the left borders of non-first slat
      if (!isRtl && left) {
        left += 1
      }
    }

    return left
  }

}


// returned value is between 0 and the number of snaps
export function computeDateSnapCoverage(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): number {
  let snapDiff = dateEnv.countDurationsBetween(
    tDateProfile.normalizedRange.start,
    date,
    tDateProfile.snapDuration
  )

  if (snapDiff < 0) {
    return 0
  } else if (snapDiff >= tDateProfile.snapDiffToIndex.length) {
    return tDateProfile.snapCnt
  } else {
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
}
