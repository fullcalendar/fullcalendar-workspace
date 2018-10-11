
import { View, wholeDivideDurations, DateMarker, isInt } from 'fullcalendar'
import { TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import ClippedScroller from '../util/ClippedScroller'

export default abstract class AbstractTimelineView extends View {

  tDateProfile: TimelineDateProfile

  headScroller: ClippedScroller
  bodyScroller: ClippedScroller

  header: TimelineHeader
  slats: TimelineSlats

  updateWidths() {
    let idealSlotWidth = this.opt('slotWidth') || ''

    if (idealSlotWidth === '' && this.renderedFlags.dates) {
      idealSlotWidth = this.computeDefaultSlotWidth()
    }

    this.applyWidths(idealSlotWidth)
  }

  computeDefaultSlotWidth() {
    let { tDateProfile } = this
    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this

    this.header.innerEls.forEach(function(innerEl, i) {
      maxInnerWidth = Math.max(maxInnerWidth, innerEl.offsetWidth)
    })

    let headerWidth = maxInnerWidth + 1 // assume no padding, and one pixel border

    // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
    // TODO: rename labelDuration?
    let slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

    let slotWidth = Math.ceil(headerWidth / slotsPerLabel)

    let minWidth: any = window.getComputedStyle(this.header.slatColEls[0]).minWidth
    if (minWidth) {
      minWidth = parseInt(minWidth, 10)
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth)
      }
    }

    return slotWidth
  }

  applyWidths(slotWidth: number | string) {
    let { tDateProfile } = this
    let containerWidth: number | string = ''
    let containerMinWidth: number | string = ''
    let nonLastSlotWidth: number | string = ''

    if (slotWidth !== '') {
      slotWidth = Math.round(slotWidth as number)

      containerWidth = slotWidth * tDateProfile.slotDates.length
      containerMinWidth = ''
      nonLastSlotWidth = slotWidth

      let availableWidth = this.bodyScroller.enhancedScroll.getClientWidth()

      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth
        containerWidth = ''
        nonLastSlotWidth = Math.floor(availableWidth / tDateProfile.slotDates.length)
      }
    }

    this.headScroller.enhancedScroll.canvas.setWidth(containerWidth)
    this.headScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)
    this.bodyScroller.enhancedScroll.canvas.setWidth(containerWidth)
    this.bodyScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)

    if (nonLastSlotWidth !== '') {
      this.header.slatColEls.slice(0, -1).concat(
        this.slats.slatColEls.slice(0, -1)
      ).forEach(function(el) {
        el.style.width = nonLastSlotWidth + 'px'
      })
    }
  }

  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date: DateMarker): number {
    let dateEnv = this.getDateEnv()
    let { tDateProfile } = this
    let snapDiff = dateEnv.countDurationsBetween(
      tDateProfile.normalizedStart,
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

  // for LTR, results range from 0 to width of area
  // for RTL, results range from negative width of area to 0
  dateToCoord(date) {
    let { tDateProfile } = this
    let snapCoverage = this.computeDateSnapCoverage(date)
    let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, tDateProfile.slotCnt - 1)
    let partial = slotCoverage - slotIndex
    let coordCache = this.slats.innerCoordCache

    if (this.isRtl) {
      return (
        coordCache.rights[slotIndex] -
        (coordCache.getWidth(slotIndex) * partial)
      ) - coordCache.originClientRect.width
    } else {
      return (
        coordCache.lefts[slotIndex] +
        (coordCache.getWidth(slotIndex) * partial)
      )
    }
  }

  rangeToCoords(range) {
    if (this.isRtl) {
      return { right: this.dateToCoord(range.start), left: this.dateToCoord(range.end) }
    } else {
      return { left: this.dateToCoord(range.start), right: this.dateToCoord(range.end) }
    }
  }

}
