import * as $ from 'jquery'
import * as moment from 'moment'
import {
  View, UnzonedRange, ComponentFootprint,
  proxy, CoordCache, queryMostGranularFormatUnit,
  isInt, divideRangeByDuration, htmlEscape, computeGreatestUnit,
  divideDurationByDuration, multiplyDuration, StandardInteractionsMixin,
  BusinessHourRenderer
} from 'fullcalendar'
import ClippedScroller from '../util/ClippedScroller'
import ScrollerCanvas from '../util/ScrollerCanvas'
import ScrollJoiner from '../util/ScrollJoiner'
import ScrollFollower from '../util/ScrollFollower'
import TimelineEventRenderer from './renderers/TimelineEventRenderer'
import TimelineFillRenderer from './renderers/TimelineFillRenderer'
import TimelineHelperRenderer from './renderers/TimelineHelperRenderer'
import TimelineEventDragging from './interactions/TimelineEventDragging'
import TimelineEventResizing from './interactions/TimelineEventResizing'
import { initScaleProps } from './TimelineView.defaults'

export default class TimelineView extends View {

  // date computation
  normalizedUnzonedRange: any // unzonedRange normalized and converted to Moments
  normalizedUnzonedStart: any // "
  normalizedUnzonedEnd: any // "
  slotDates: any // has stripped timezones
  slotCnt: any
  snapCnt: any
  snapsPerSlot: any
  snapDiffToIndex: any // maps number of snaps since the grid's start to the index
  snapIndexToDiff: any // inverse
  timeWindowMs: any
  slotDuration: any
  snapDuration: any
  duration: any
  labelInterval: any
  isTimeScale: any
  largeUnit: any // if the slots are > a day, the string name of the interval
  headerFormats: any
  emphasizeWeeks: boolean

  // rendering
  timeHeadEl: any
  timeHeadColEls: any
  timeHeadScroller: any
  timeBodyEl: any
  timeBodyScroller: any
  timeScrollJoiner: any
  headDateFollower: any
  eventTitleFollower: any
  segContainerEl: any
  segContainerHeight: any
  bgSegContainerEl: any
  slatContainerEl: any
  slatColEls: any
  slatEls: any // in DOM order
  slotWidth: number

  // coordinates
  timeBodyBoundCache: any
  slatCoordCache: any // used for hit detection
  slatInnerCoordCache: any

  nowIndicatorEls: any
  isTimeBodyScrolled: boolean


  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)
    this.emphasizeWeeks = false
    this.isTimeBodyScrolled = false
    this.slotWidth = this.opt('slotWidth')
  }


  // Footprints
  // ------------------------------------------------------------------------------------------------------------------


  /*
  TODO: avoid using Moments. use slat system somehow
  THEN, can have componentFootprintToSegs handle this on its own
  */
  normalizeComponentFootprint(componentFootprint) {
    let adjustedEnd
    let adjustedStart
    const { unzonedRange } = componentFootprint

    if (this.isTimeScale) {
      adjustedStart = this.normalizeGridDate(unzonedRange.getStart())
      adjustedEnd = this.normalizeGridDate(unzonedRange.getEnd())
    } else {
      const dayRange = this.computeDayRange(unzonedRange)

      if (this.largeUnit) {
        adjustedStart = dayRange.start.clone().startOf(this.largeUnit)
        adjustedEnd = dayRange.end.clone().startOf(this.largeUnit)

        // if date is partially through the interval, or is in the same interval as the start,
        // make the exclusive end be the *next* interval
        if (!adjustedEnd.isSame(dayRange.end) || !adjustedEnd.isAfter(adjustedStart)) {
          adjustedEnd.add(this.slotDuration)
        }

      } else {
        adjustedStart = dayRange.start
        adjustedEnd = dayRange.end
      }
    }

    return new ComponentFootprint(
      new UnzonedRange(adjustedStart, adjustedEnd),
      !this.isTimeScale // isAllDay
    )
  }


  componentFootprintToSegs(footprint) {
    const footprintStart = footprint.unzonedRange.getStart()
    const footprintEnd = footprint.unzonedRange.getEnd()
    const normalFootprint = this.normalizeComponentFootprint(footprint)
    const segs = []

    // protect against when the span is entirely in an invalid date region
    if (this.computeDateSnapCoverage(footprintStart) < this.computeDateSnapCoverage(footprintEnd)) {

      // intersect the footprint's range with the grid'd range
      const segRange = normalFootprint.unzonedRange.intersect(this.normalizedUnzonedRange)

      if (segRange) {
        const segStart = segRange.getStart()
        const segEnd = segRange.getEnd()
        segs.push({
          start: segStart,
          end: segEnd,
          isStart: segRange.isStart && this.isValidDate(segStart),
          isEnd: segRange.isEnd && this.isValidDate(segEnd.clone().subtract(1))
        })
      }
    }

    // TODO: what if month slots? should round it to nearest month
    // TODO: dragging/resizing in this situation? deltas for dragging/resizing breaks down

    return segs
  }


  // Date Computation
  // ------------------------------------------------------------------------------------------------------------------


  /*
  Makes the given date consistent with isTimeScale/largeUnit,
  so, either removes the times, ensures a time, or makes it the startOf largeUnit.
  Strips all timezones. Returns new copy.
  TODO: should maybe be called "normalizeRangeDate".
  */
  normalizeGridDate(date) {
    let normalDate = date.clone()
    this.calendar.localizeMoment(normalDate) // mostly for startOf

    if (this.isTimeScale) {
      if (!normalDate.hasTime()) {
        normalDate.time(0)
      }
    } else {
      normalDate = normalDate.clone().stripTime()
      if (this.largeUnit) {
        normalDate.startOf(this.largeUnit)
      }
    }

    return normalDate
  }


  isValidDate(date) {
    if (this.isHiddenDay(date)) {
      return false
    } else if (this.isTimeScale) {
      // determine if the time is within minTime/maxTime, which may have wacky values
      let ms = date.time() - this.dateProfile.minTime // milliseconds since minTime
      ms = ((ms % 86400000) + 86400000) % 86400000 // make negative values wrap to 24hr clock
      return ms < this.timeWindowMs // before the maxTime?
    } else {
      return true
    }
  }


  updateGridDates() {
    let snapIndex = -1
    let snapDiff = 0 // index of the diff :(
    const snapDiffToIndex = []
    const snapIndexToDiff = []

    const date = this.normalizedUnzonedStart.clone()
    while (date < this.normalizedUnzonedEnd) {
      if (this.isValidDate(date)) {
        snapIndex++
        snapDiffToIndex.push(snapIndex)
        snapIndexToDiff.push(snapDiff)
      } else {
        snapDiffToIndex.push(snapIndex + 0.5)
      }
      date.add(this.snapDuration)
      snapDiff++
    }

    this.snapDiffToIndex = snapDiffToIndex
    this.snapIndexToDiff = snapIndexToDiff

    this.snapCnt = snapIndex + 1 // is always one behind
    this.slotCnt = this.snapCnt / this.snapsPerSlot
  }


  // Skeleton Rendering
  // ------------------------------------------------------------------------------------------------------------------


  renderSkeleton() {
    this.el.addClass('fc-timeline')

    if (this.opt('eventOverlap') === false) {
      this.el.addClass('fc-no-overlap')
    }

    this.el.html(this.renderSkeletonHtml())

    this.timeHeadEl = this.el.find('thead .fc-time-area')
    this.timeBodyEl = this.el.find('tbody .fc-time-area')

    this.timeHeadScroller = new ClippedScroller({
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    })
    this.timeHeadScroller.canvas = new ScrollerCanvas()
    this.timeHeadScroller.render()
    this.timeHeadScroller.el.appendTo(this.timeHeadEl)

    this.timeBodyScroller = new ClippedScroller()
    this.timeBodyScroller.canvas = new ScrollerCanvas()
    this.timeBodyScroller.render()
    this.timeBodyScroller.el.appendTo(this.timeBodyEl)

    this.isTimeBodyScrolled = false // because if the grid has been rerendered, it will get a zero scroll
    this.timeBodyScroller.on('scroll', proxy(this, 'handleTimeBodyScrolled'))

    this.slatContainerEl = $('<div class="fc-slats"/>').appendTo(this.timeBodyScroller.canvas.bgEl)
    this.segContainerEl = $('<div class="fc-event-container"/>').appendTo(this.timeBodyScroller.canvas.contentEl)
    this.bgSegContainerEl = this.timeBodyScroller.canvas.bgEl

    this.timeBodyBoundCache = new CoordCache({
      els: this.timeBodyScroller.canvas.el, // better representative of bounding box, considering annoying negative margins
      isHorizontal: true, // we use the left/right for adjusting RTL coordinates
      isVertical: true
    })

    this.timeScrollJoiner = new ScrollJoiner('horizontal', [ this.timeHeadScroller, this.timeBodyScroller ])

    // the date/time text on the top axis that stays put while scrolling happens
    this.headDateFollower = new ScrollFollower(this.timeHeadScroller, true) // allowPointerEvents=true

    // the event titles that stay put while scrolling happens
    this.eventTitleFollower = new ScrollFollower(this.timeBodyScroller)
    this.eventTitleFollower.minTravel = 50
    //
    if (this.isRTL) {
      this.eventTitleFollower.containOnNaturalRight = true
    } else {
      this.eventTitleFollower.containOnNaturalLeft = true
    }

    super.renderSkeleton()
  }


  renderSkeletonHtml() {
    const { theme } = this.calendar

    return `<table class="` + theme.getClass('tableGrid') + `"> \
<thead class="fc-head"> \
<tr> \
<td class="fc-time-area ` + theme.getClass('widgetHeader') + `"></td> \
</tr> \
</thead> \
<tbody class="fc-body"> \
<tr> \
<td class="fc-time-area ` + theme.getClass('widgetContent') + `"></td> \
</tr> \
</tbody> \
</table>`
  }


  unrenderSkeleton() {
    this.handleTimeBodyScrolled(0)
    super.unrenderSkeleton()
  }


  // Date Rendering
  // ------------------------------------------------------------------------------------------------------------------


  renderDates(dateProfile) {
    initScaleProps(this)

    this.timeWindowMs = dateProfile.maxTime - dateProfile.minTime

    // makes sure zone is stripped
    this.normalizedUnzonedStart = this.normalizeGridDate(dateProfile.renderUnzonedRange.getStart())
    this.normalizedUnzonedEnd = this.normalizeGridDate(dateProfile.renderUnzonedRange.getEnd())

    // apply minTime/maxTime
    // TODO: move towards .time(), but didn't play well with negatives.
    // TODO: View should be responsible.
    if (this.isTimeScale) {
      this.normalizedUnzonedStart.add(dateProfile.minTime)
      this.normalizedUnzonedEnd.subtract(1, 'day').add(dateProfile.maxTime)
    }

    this.normalizedUnzonedRange = new UnzonedRange(this.normalizedUnzonedStart, this.normalizedUnzonedEnd)

    const slotDates = []
    let date = this.normalizedUnzonedStart.clone()
    this.calendar.localizeMoment(date)
    while (date < this.normalizedUnzonedEnd) {
      if (this.isValidDate(date)) {
        slotDates.push(date.clone())
      }
      date.add(this.slotDuration)
    }

    this.slotDates = slotDates
    this.updateGridDates()

    const slatHtmlRes = this.renderSlatHtml()
    this.timeHeadScroller.canvas.contentEl.html(slatHtmlRes.headHtml)
    this.timeHeadColEls = this.timeHeadScroller.canvas.contentEl.find('col')
    this.slatContainerEl.html(slatHtmlRes.bodyHtml)
    this.slatColEls = this.slatContainerEl.find('col')
    this.slatEls = this.slatContainerEl.find('td')

    this.slatCoordCache = new CoordCache({
      els: this.slatEls,
      isHorizontal: true
    })

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.slatInnerCoordCache = new CoordCache({
      els: this.slatEls.find('> div'),
      isHorizontal: true,
      // we use this coord cache for getPosition* for event rendering.
      // workaround for .fc-content's negative margins.
      offsetParent: this.timeBodyScroller.canvas.el
    })

    for (let i = 0; i < this.slotDates.length; i++) {
      date = this.slotDates[i]
      this.publiclyTrigger('dayRender', {
        context: this,
        args: [ date, this.slatEls.eq(i), this ]
      })
    }

    if (this.headDateFollower) {
      this.headDateFollower.setSpriteEls(this.timeHeadEl.find('tr:not(:last-child) .fc-cell-text'))
    }
  }


  unrenderDates() {
    if (this.headDateFollower) {
      this.headDateFollower.clearSprites()
    }

    this.timeHeadScroller.canvas.contentEl.empty()
    this.slatContainerEl.empty()

    // clear the widths,
    // for no jupiness when navigating
    this.timeHeadScroller.canvas.clearWidth()
    this.timeBodyScroller.canvas.clearWidth()
  }


  renderSlatHtml() {
    let cell
    let date
    let rowCells
    let format
    const { theme } = this.calendar
    const { labelInterval } = this
    const formats = this.headerFormats
    const cellRows = formats.map((format) => []) // indexed by row,col
    let leadingCell = null
    let prevWeekNumber = null
    const { slotDates } = this
    const slotCells = [] // meta

    const rowUnits = formats.map((format) => (
      queryMostGranularFormatUnit(format)
    ))

    for (date of slotDates) {
      const weekNumber = date.week()
      const isWeekStart = this.emphasizeWeeks && (prevWeekNumber !== null) && (prevWeekNumber !== weekNumber)

      for (let row = 0; row < formats.length; row++) {
        format = formats[row]
        rowCells = cellRows[row]
        leadingCell = rowCells[rowCells.length - 1]
        const isSuperRow = (formats.length > 1) && (row < (formats.length - 1)) // more than one row and not the last
        let newCell = null

        if (isSuperRow) {
          let text = date.format(format)
          if (!leadingCell || (leadingCell.text !== text)) {
            newCell = this.buildCellObject(date, text, rowUnits[row])
          } else {
            leadingCell.colspan += 1
          }
        } else {
          if (!leadingCell || isInt(divideRangeByDuration(this.normalizedUnzonedStart, date, labelInterval))) {
            let text = date.format(format)
            newCell = this.buildCellObject(date, text, rowUnits[row])
          } else {
            leadingCell.colspan += 1
          }
        }

        if (newCell) {
          newCell.weekStart = isWeekStart
          rowCells.push(newCell)
        }
      }

      slotCells.push({ weekStart: isWeekStart })
      prevWeekNumber = weekNumber
    }

    const isChrono = labelInterval > this.slotDuration
    const isSingleDay = this.slotDuration.as('days') === 1

    let html = '<table class="' + theme.getClass('tableGrid') + '">'
    html += '<colgroup>'
    for (date of slotDates) {
      html += '<col/>'
    }
    html += '</colgroup>'
    html += '<tbody>'
    for (let i = 0; i < cellRows.length; i++) {
      rowCells = cellRows[i]
      const isLast = i === (cellRows.length - 1)
      html += '<tr' + (isChrono && isLast ? ' class="fc-chrono"' : '') + '>'

      for (cell of rowCells) {
        let headerCellClassNames = [ theme.getClass('widgetHeader') ]

        if (cell.weekStart) {
          headerCellClassNames.push('fc-em-cell')
        }
        if (isSingleDay) {
          headerCellClassNames = headerCellClassNames.concat(
            this.getDayClasses(cell.date, true) // adds "today" class and other day-based classes
          )
        }

        html +=
          '<th class="' + headerCellClassNames.join(' ') + '"' +
            ' data-date="' + cell.date.format() + '"' +
            (cell.colspan > 1 ? ' colspan="' + cell.colspan + '"' : '') +
          '>' +
            '<div class="fc-cell-content">' +
              cell.spanHtml +
            '</div>' +
          '</th>'
      }

      html += '</tr>'
    }
    html += '</tbody></table>'

    let slatHtml = '<table class="' + theme.getClass('tableGrid') + '">'
    slatHtml += '<colgroup>'
    for (cell of slotCells) {
      slatHtml += '<col/>'
    }
    slatHtml += '</colgroup>'
    slatHtml += '<tbody><tr>'
    for (let i = 0; i < slotCells.length; i++) {
      cell = slotCells[i]
      date = slotDates[i]
      slatHtml += this.slatCellHtml(date, cell.weekStart)
    }
    slatHtml += '</tr></tbody></table>'

    return { headHtml: html, bodyHtml: slatHtml }
  }


  buildCellObject(date, text, rowUnit) {
    date = date.clone() // ensure our own reference
    const spanHtml = this.buildGotoAnchorHtml(
      {
        date,
        type: rowUnit,
        forceOff: !rowUnit
      },
      {
        'class': 'fc-cell-text'
      },
      htmlEscape(text)
    )
    return { text, spanHtml, date, colspan: 1 }
  }


  slatCellHtml(date, isEm) {
    let classes
    const { theme } = this.calendar

    if (this.isTimeScale) {
      classes = []
      classes.push(
        isInt(divideRangeByDuration(this.normalizedUnzonedStart, date, this.labelInterval)) ?
          'fc-major' :
          'fc-minor'
      )
    } else {
      classes = this.getDayClasses(date)
      classes.push('fc-day')
    }

    classes.unshift(theme.getClass('widgetContent'))

    if (isEm) {
      classes.push('fc-em-cell')
    }

    return '<td class="' + classes.join(' ') + '"' +
      ' data-date="' + date.format() + '"' +
      '><div /></td>'
  }


  // Business Hours
  // ------------------------------------------------------------------------------------------------------------------


  renderBusinessHours(businessHourPayload) {
    if (!this.largeUnit) {
      return super.renderBusinessHours(businessHourPayload)
    }
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    // TODO: converge with largeUnit. precompute
    if (this.isTimeScale) {
      return computeGreatestUnit(this.slotDuration)
    }
  }


  // will only execute if isTimeScale
  renderNowIndicator(date) {
    const nodes = []
    date = this.normalizeGridDate(date)

    if (this.normalizedUnzonedRange.containsDate(date)) {
      const coord = this.dateToCoord(date)
      const css = this.isRTL ?
        { right: -coord } :
        { left: coord }

      nodes.push($("<div class='fc-now-indicator fc-now-indicator-arrow'></div>")
        .css(css)
        .appendTo(this.timeHeadScroller.canvas.el)[0])

      nodes.push($("<div class='fc-now-indicator fc-now-indicator-line'></div>")
        .css(css)
        .appendTo(this.timeBodyScroller.canvas.el)[0])
    }

    this.nowIndicatorEls = $(nodes)
  }


  // will only execute if isTimeScale
  unrenderNowIndicator() {
    if (this.nowIndicatorEls) {
      this.nowIndicatorEls.remove()
      this.nowIndicatorEls = null
    }
  }


  // Sizing
  // ------------------------------------------------------------------------------------------------------------------


  updateSize(totalHeight, isAuto, isResize) {
    let bodyHeight
    let containerMinWidth
    let containerWidth
    let nonLastSlotWidth

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.headHeight() - this.queryMiscHeight()
    }

    this.timeBodyScroller.setHeight(bodyHeight)

    // reason for this complicated method is that things went wrong when:
    //  slots/headers didn't fill content area and needed to be stretched
    //  cells wouldn't align (rounding issues with available width calculated
    //  differently because of padding VS scrollbar trick)

    const isDatesRendered = this.timeHeadColEls // TODO: refactor use of this

    if (isDatesRendered) {
      const slotWidth = Math.round(this.slotWidth || (this.slotWidth = this.computeSlotWidth()))
      containerWidth = slotWidth * this.slotDates.length
      containerMinWidth = ''
      nonLastSlotWidth = slotWidth

      const availableWidth = this.timeBodyScroller.getClientWidth()
      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth
        containerWidth = ''
        nonLastSlotWidth = Math.floor(availableWidth / this.slotDates.length)
      }
    } else {
      containerWidth = ''
      containerMinWidth = ''
    }

    this.timeHeadScroller.canvas.setWidth(containerWidth)
    this.timeHeadScroller.canvas.setMinWidth(containerMinWidth)
    this.timeBodyScroller.canvas.setWidth(containerWidth)
    this.timeBodyScroller.canvas.setMinWidth(containerMinWidth)

    if (isDatesRendered) {
      this.timeHeadColEls.slice(0, -1).add(this.slatColEls.slice(0, -1))
        .css('width', nonLastSlotWidth)
    }

    this.timeHeadScroller.updateSize()
    this.timeBodyScroller.updateSize()
    this.timeScrollJoiner.update()

    if (isDatesRendered) {
      this.buildCoords()

      // TODO: left/right CSS assignment also happens earlier in renderFgSegs
      this.updateSegPositions()

      // this updateSize method is triggered by callers who don't always subsequently call updateNowIndicator,
      // and updateSize always has the risk of changing horizontal spacing which will affect nowIndicator positioning,
      // so always call it here too. will often rerender twice unfortunately.
      // TODO: more closely integrate updateSize with updateNowIndicator
      this.updateNowIndicator()
    }

    if (this.headDateFollower) {
      this.headDateFollower.update()
    }

    if (this.eventTitleFollower) {
      this.eventTitleFollower.update()
    }
  }


  queryMiscHeight() {
    return this.el.outerHeight() -
      this.timeHeadScroller.el.outerHeight() -
      this.timeBodyScroller.el.outerHeight()
  }


  computeSlotWidth() { // compute the *default*
    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this
    const innerEls = this.timeHeadEl.find('tr:last-child th .fc-cell-text') // TODO: cache

    innerEls.each(function(i, node) {
      const innerWidth = $(node).outerWidth()
      return maxInnerWidth = Math.max(maxInnerWidth, innerWidth)
    })

    const headerWidth = maxInnerWidth + 1 // assume no padding, and one pixel border
    const slotsPerLabel = divideDurationByDuration(this.labelInterval, this.slotDuration) // TODO: rename labelDuration?
    let slotWidth = Math.ceil(headerWidth / slotsPerLabel)

    let minWidth = this.timeHeadColEls.eq(0).css('min-width')
    if (minWidth) {
      minWidth = parseInt(minWidth, 10)
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth)
      }
    }

    return slotWidth
  }


  // Coordinates
  // ------------------------------------------------------------------------------------------------------------------


  buildCoords() {
    this.timeBodyBoundCache.build()
    this.slatCoordCache.build()
    this.slatInnerCoordCache.build()
  }


  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date) {
    const snapDiff = divideRangeByDuration(this.normalizedUnzonedStart, date, this.snapDuration)

    if (snapDiff < 0) {
      return 0
    } else if (snapDiff >= this.snapDiffToIndex.length) {
      return this.snapCnt
    } else {
      const snapDiffInt = Math.floor(snapDiff)
      let snapCoverage = this.snapDiffToIndex[snapDiffInt]

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
    const snapCoverage = this.computeDateSnapCoverage(date)
    const slotCoverage = snapCoverage / this.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, this.slotCnt - 1)
    const partial = slotCoverage - slotIndex
    const coordCache = this.slatInnerCoordCache

    if (this.isRTL) {
      return (
        coordCache.getRightPosition(slotIndex) -
        (coordCache.getWidth(slotIndex) * partial)
      ) - this.timeBodyBoundCache.getWidth(0)
    } else {
      return (
        coordCache.getLeftPosition(slotIndex) +
        (coordCache.getWidth(slotIndex) * partial)
      )
    }
  }


  rangeToCoords(range) {
    if (this.isRTL) {
      return { right: this.dateToCoord(range.start), left: this.dateToCoord(range.end) }
    } else {
      return { left: this.dateToCoord(range.start), right: this.dateToCoord(range.end) }
    }
  }


  // a getter / setter
  headHeight(...args) {
    const table = this.timeHeadScroller.canvas.contentEl.find('table')
    return table.height.apply(table, args)
  }


  // this needs to be called if v scrollbars appear on body container. or zooming
  updateSegPositions() {
    const segs = [].concat(
      this.getEventSegs(),
      this.getBusinessHourSegs()
    )

    for (let seg of segs) {
      const coords = this.rangeToCoords(seg)
      seg.el.css({
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })
    }
  }


  // Scrolling
  // ---------------------------------------------------------------------------------


  handleTimeBodyScrolled(top) {
    if (top) {
      if (!this.isTimeBodyScrolled) {
        this.isTimeBodyScrolled = true
        this.el.addClass('fc-scrolled')
      }
    } else {
      if (this.isTimeBodyScrolled) {
        this.isTimeBodyScrolled = false
        this.el.removeClass('fc-scrolled')
      }
    }
  }


  computeInitialDateScroll() {
    const unzonedRange = this.get('dateProfile').activeUnzonedRange
    let left = 0

    if (this.isTimeScale) {
      let scrollTime = this.opt('scrollTime')
      if (scrollTime) {
        scrollTime = moment.duration(scrollTime)
        left = this.dateToCoord(unzonedRange.getStart().time(scrollTime)) // TODO: fix this for RTL
      }
    }

    return { left }
  }


  queryDateScroll() {
    return { left: this.timeBodyScroller.getScrollLeft() }
  }


  applyDateScroll(scroll) {
    if (scroll.left != null) {
      // TODO: workaround for FF. the ScrollJoiner sibling won't react fast enough
      // to override the native initial crappy scroll that FF applies.
      // TODO: have the ScrollJoiner handle this
      // Similar code in ResourceTimelineView::setScroll
      this.timeHeadScroller.setScrollLeft(scroll.left)
      this.timeBodyScroller.setScrollLeft(scroll.left)
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------------------------------


  prepareHits() {
    this.buildCoords()
  }


  // FYI: we don't want to clear the slatCoordCache in releaseHits()
  // because those coordinates are needed for dateToCoord()


  queryHit(leftOffset, topOffset): any {
    const { snapsPerSlot } = this
    const { slatCoordCache } = this
    const { timeBodyBoundCache } = this

    // within scroll container's content rectangle?
    if (timeBodyBoundCache.isPointInBounds(leftOffset, topOffset)) {

      const slatIndex = slatCoordCache.getHorizontalIndex(leftOffset)
      if (slatIndex != null) {
        let localSnapIndex
        let partial
        let snapIndex
        let snapLeft
        let snapRight
        const slatWidth = slatCoordCache.getWidth(slatIndex)

        if (this.isRTL) {
          const slatRight = slatCoordCache.getRightOffset(slatIndex)
          partial = (slatRight - leftOffset) / slatWidth
          localSnapIndex = Math.floor(partial * snapsPerSlot)
          snapIndex = (slatIndex * snapsPerSlot) + localSnapIndex
          snapRight = slatRight - ((localSnapIndex / snapsPerSlot) * slatWidth)
          snapLeft = snapRight - (((localSnapIndex + 1) / snapsPerSlot) * slatWidth)
        } else {
          const slatLeft = slatCoordCache.getLeftOffset(slatIndex)
          partial = (leftOffset - slatLeft) / slatWidth
          localSnapIndex = Math.floor(partial * snapsPerSlot)
          snapIndex = (slatIndex * snapsPerSlot) + localSnapIndex
          snapLeft = slatLeft + ((localSnapIndex / snapsPerSlot) * slatWidth)
          snapRight = slatLeft + (((localSnapIndex + 1) / snapsPerSlot) * slatWidth)
        }

        return {
          snap: snapIndex,
          component: this, // needed unfortunately
          left: snapLeft,
          right: snapRight,
          top: timeBodyBoundCache.getTopOffset(0),
          bottom: timeBodyBoundCache.getBottomOffset(0)
        }
      }
    }
  }


  getHitFootprint(hit) {
    return new ComponentFootprint(
      this.getSnapUnzonedRange(hit.snap),
      !this.isTimeScale // isAllDay
    )
  }


  getHitEl(hit) {
    return this.getSnapEl(hit.snap) // TODO: write a test for this
  }


  /*
  TODO: avoid using moments
  */
  getSnapUnzonedRange(snapIndex) {
    const start = this.normalizedUnzonedStart.clone()
    start.add(multiplyDuration(this.snapDuration, this.snapIndexToDiff[snapIndex]))
    const end = start.clone().add(this.snapDuration)
    return new UnzonedRange(start, end)
  }


  getSnapEl(snapIndex) {
    return this.slatEls.eq(Math.floor(snapIndex / this.snapsPerSlot))
  }


  // Event Resizing
  // ------------------------------------------------------------------------------------------------------------------


  // Renders a visual indication of an event being resized
  renderEventResize(eventFootprints, seg, isTouch) {
    for (let eventFootprint of eventFootprints) {
      this.renderHighlight(eventFootprint.componentFootprint)
    }

    return this.helperRenderer.renderEventResizingFootprints(eventFootprints, seg, isTouch)
  }


  // Unrenders a visual indication of an event being resized
  unrenderEventResize() {
    this.unrenderHighlight()
    return this.helperRenderer.unrender()
  }


  // DnD
  // ------------------------------------------------------------------------------------------------------------------


  // TODO: different technique based on scale.
  //  when dragging, middle of event is the drop.
  //  should be the edges when isTimeScale.
  renderDrag(eventFootprints, seg, isTouch) {
    if (seg) {
      this.helperRenderer.renderEventDraggingFootprints(eventFootprints, seg, isTouch)
      return true // signal helper rendered
    } else {
      for (let eventFootprint of eventFootprints) {
        this.renderHighlight(eventFootprint.componentFootprint)
      }
      return false // signal helper not rendered
    }
  }


  unrenderDrag() {
    this.helperRenderer.unrender()
    return this.unrenderHighlight()
  }
}

// config
TimelineView.prototype.usesMinMaxTime = true // for View. indicates that minTime/maxTime affects rendering

// TODO: rename these
TimelineView.prototype.eventRendererClass = TimelineEventRenderer
TimelineView.prototype.fillRendererClass = TimelineFillRenderer
TimelineView.prototype.businessHourRendererClass = BusinessHourRenderer
TimelineView.prototype.helperRendererClass = TimelineHelperRenderer
TimelineView.prototype.eventDraggingClass = TimelineEventDragging
TimelineView.prototype.eventResizingClass = TimelineEventResizing

StandardInteractionsMixin.mixInto(TimelineView)
