import { memoizeRendering, DateProfile, DateMarker, wholeDivideDurations, isInt, Component, ComponentContext, startOfDay, greatestDurationDenominator, rangeContainsMarker, Duration, DateProfileGenerator } from '@fullcalendar/core'
import HeaderBodyLayout from './HeaderBodyLayout'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import { TimelineDateProfile, buildTimelineDateProfile } from './timeline-date-profile'
import TimelineNowIndicator from './TimelineNowIndicator'
import StickyScroller from './util/StickyScroller'

export interface TimeAxisProps {
  dateProfileGenerator: DateProfileGenerator
  dateProfile: DateProfile
}

export default class TimeAxis extends Component<TimeAxisProps> {

  // child components
  layout: HeaderBodyLayout
  header: TimelineHeader
  slats: TimelineSlats
  nowIndicator: TimelineNowIndicator
  headStickyScroller: StickyScroller
  bodyStickyScroller: StickyScroller

  // internal state
  tDateProfile: TimelineDateProfile

  private renderSkeleton = memoizeRendering(this._renderSkeleton, this._unrenderSkeleton)


  constructor(headerContainerEl, bodyContainerEl) {
    super()

    this.layout = new HeaderBodyLayout(
      headerContainerEl,
      bodyContainerEl,
      'auto'
    )
  }


  render(props: TimeAxisProps, context: ComponentContext) {

    let tDateProfile = this.tDateProfile =
      buildTimelineDateProfile(props.dateProfile, context.dateEnv, context.options, props.dateProfileGenerator) // TODO: cache

    this.renderSkeleton(context)

    this.header.receiveProps({
      dateProfile: props.dateProfile,
      tDateProfile
    }, context)

    this.slats.receiveProps({
      dateProfile: props.dateProfile,
      tDateProfile
    }, context)
  }


  destroy() {
    this.renderSkeleton.unrender()
    this.layout.destroy()

    super.destroy()
  }


  _renderSkeleton(context: ComponentContext) {
    let { layout } = this
    let headerEnhancedScroller = layout.headerScroller.enhancedScroll
    let bodyEnhancedScroller = layout.bodyScroller.enhancedScroll

    // needs to go after layout, which has ScrollJoiner
    this.headStickyScroller = new StickyScroller(headerEnhancedScroller, context.isRtl, false) // isVertical=false
    this.bodyStickyScroller = new StickyScroller(bodyEnhancedScroller, context.isRtl, false) // isVertical=false

    this.header = new TimelineHeader(
      headerEnhancedScroller.canvas.contentEl
    )

    this.slats = new TimelineSlats(
      bodyEnhancedScroller.canvas.bgEl
    )

    this.nowIndicator = new TimelineNowIndicator(
      headerEnhancedScroller.canvas.el,
      bodyEnhancedScroller.canvas.el
    )
  }


  _unrenderSkeleton() {
    this.header.destroy()
    this.slats.destroy()
    this.nowIndicator.unrender()
    this.headStickyScroller.destroy()
    this.bodyStickyScroller.destroy()
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
    let { context } = this

    // yuck
    let tDateProfile = this.tDateProfile =
      buildTimelineDateProfile(dateProfile, context.dateEnv, context.options, dateProfileGenerator) // TODO: cache

    if (tDateProfile.isTimeScale) {
      return greatestDurationDenominator(tDateProfile.slotDuration).unit
    }
  }


  // will only execute if isTimeScale
  renderNowIndicator(date) {
    if (rangeContainsMarker(this.tDateProfile.normalizedRange, date)) {
      this.nowIndicator.render(
        this.dateToCoord(date),
        this.context.isRtl
      )
    }
  }


  // will only execute if isTimeScale
  unrenderNowIndicator() {
    this.nowIndicator.unrender()
  }


  // Sizing
  // ------------------------------------------------------------------------------------------


  updateSize(isResize, totalHeight, isAuto) {

    this.applySlotWidth(
      this.computeSlotWidth()
    )

    // adjusts gutters. do after slot widths set
    this.layout.setHeight(totalHeight, isAuto)

    // pretty much just queries coords. do last
    this.slats.updateSize()
  }


  updateStickyScrollers() {
    this.headStickyScroller.updateSize()
    this.bodyStickyScroller.updateSize()
  }


  computeSlotWidth() {
    let slotWidth = this.context.options.slotWidth || ''

    if (slotWidth === '') {
      slotWidth = this.computeDefaultSlotWidth(this.tDateProfile)
    }

    return slotWidth
  }


  computeDefaultSlotWidth(tDateProfile) {
    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this

    this.header.innerEls.forEach(function(innerEl, i) {
      maxInnerWidth = Math.max(maxInnerWidth, innerEl.getBoundingClientRect().width)
    })

    let headingCellWidth = Math.ceil(maxInnerWidth) + 1 // assume no padding, and one pixel border

    // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
    // TODO: rename labelDuration?
    let slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

    let slotWidth = Math.ceil(headingCellWidth / slotsPerLabel)

    let minWidth: any = window.getComputedStyle(this.header.slatColEls[0]).minWidth
    if (minWidth) {
      minWidth = parseInt(minWidth, 10)
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth)
      }
    }

    return slotWidth
  }


  applySlotWidth(slotWidth: number | string) {
    let { layout, tDateProfile } = this
    let containerWidth: number | string = ''
    let containerMinWidth: number | string = ''
    let nonLastSlotWidth: number | string = ''

    if (slotWidth !== '') {
      slotWidth = Math.round(slotWidth as number)

      containerWidth = slotWidth * tDateProfile.slotDates.length
      containerMinWidth = ''
      nonLastSlotWidth = slotWidth

      let availableWidth = layout.bodyScroller.enhancedScroll.getClientWidth()

      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth
        containerWidth = ''
        nonLastSlotWidth = Math.floor(availableWidth / tDateProfile.slotDates.length)
      }
    }

    layout.headerScroller.enhancedScroll.canvas.setWidth(containerWidth)
    layout.headerScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)
    layout.bodyScroller.enhancedScroll.canvas.setWidth(containerWidth)
    layout.bodyScroller.enhancedScroll.canvas.setMinWidth(containerMinWidth)

    if (nonLastSlotWidth !== '') {
      this.header.slatColEls.slice(0, -1).concat(
        this.slats.slatColEls.slice(0, -1)
      ).forEach(function(el) {
        el.style.width = nonLastSlotWidth + 'px'
        el.style.minWidth = '0' // prevent the browser from using the actual min-width (issue #6338)
      })
    }
  }


  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date: DateMarker): number {
    let { tDateProfile } = this
    let { dateEnv } = this.context
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


  // for LTR, results range from 0 to width of area
  // for RTL, results range from negative width of area to 0
  dateToCoord(date) {
    let { tDateProfile } = this
    let snapCoverage = this.computeDateSnapCoverage(date)
    let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, tDateProfile.slotCnt - 1)
    let partial = slotCoverage - slotIndex
    let { innerCoordCache, outerCoordCache } = this.slats

    if (this.context.isRtl) {
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


  rangeToCoords(range) {
    if (this.context.isRtl) {
      return { right: this.dateToCoord(range.start), left: this.dateToCoord(range.end) }
    } else {
      return { left: this.dateToCoord(range.start), right: this.dateToCoord(range.end) }
    }
  }


  // Scrolling
  // ------------------------------------------------------------------------------------------


  computeDateScroll(duration: Duration) {
    let { dateEnv, isRtl } = this.context
    let { dateProfile } = this.props
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

    return { left }
  }


  queryDateScroll() {
    let { enhancedScroll } = this.layout.bodyScroller

    return {
      left: enhancedScroll.getScrollLeft()
    }
  }


  applyDateScroll(scroll) {
    // TODO: lame we have to update both. use the scrolljoiner instead maybe
    this.layout.bodyScroller.enhancedScroll.setScrollLeft(scroll.left || 0)
    this.layout.headerScroller.enhancedScroll.setScrollLeft(scroll.left || 0)
  }

}
