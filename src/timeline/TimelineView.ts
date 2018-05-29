import {
  View, UnzonedRange, ComponentFootprint, CoordCache,
  isInt, htmlEscape, greatestDurationDenominator,
  wholeDivideDurations, multiplyDuration, StandardInteractionsMixin,
  BusinessHourRenderer, createElement, findElements, findChildren,
  applyStyle, applyStyleProp, removeElement,
  DateMarker, isSingleDay, createDuration, startOfDay, addMs, addDays, asRoughMs, DateFormatter
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
  normalizedUnzonedRange: UnzonedRange // unzonedRange normalized and converted to Moments
  normalizedUnzonedStart: DateMarker // "
  normalizedUnzonedEnd: DateMarker // "
  slotDates: any // has stripped timezones
  slotCnt: any
  snapCnt: any
  snapsPerSlot: any
  snapDiffToIndex: any // maps number of snaps since the grid's start to the index
  snapIndexToDiff: any // inverse
  timeWindowMs: number
  slotDuration: any
  snapDuration: any
  duration: any
  labelInterval: any
  isTimeScale: any
  largeUnit: any // if the slots are > a day, the string name of the interval
  headerFormats: DateFormatter[]
  emphasizeWeeks: boolean

  // rendering
  timeHeadEl: HTMLElement
  timeHeadColEls: HTMLElement[]
  timeHeadScroller: ClippedScroller
  timeBodyEl: HTMLElement
  timeBodyScroller: ClippedScroller
  timeScrollJoiner: ScrollJoiner
  headDateFollower: ScrollFollower
  eventTitleFollower: ScrollFollower
  segContainerEl: HTMLElement
  segContainerHeight: any
  innerEl: HTMLElement // for TimelineHelperRenderer
  bgSegContainerEl: HTMLElement
  slatContainerEl: HTMLElement
  slatColEls: HTMLElement[]
  slatEls: HTMLElement[] // in DOM order
  slotWidth: number

  // coordinates
  timeBodyBoundCache: any
  slatCoordCache: any // used for hit detection
  slatInnerCoordCache: any

  nowIndicatorEls: HTMLElement[]
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
    const dateEnv = this.calendar.dateEnv
    let adjustedEnd
    let adjustedStart
    const { unzonedRange } = componentFootprint

    if (this.isTimeScale) {
      adjustedStart = this.normalizeGridDate(unzonedRange.start)
      adjustedEnd = this.normalizeGridDate(unzonedRange.end)
    } else {
      const dayRange = this.computeDayRange(unzonedRange)

      if (this.largeUnit) {
        adjustedStart = dateEnv.startOf(dayRange.start, this.largeUnit)
        adjustedEnd = dateEnv.startOf(dayRange.end, this.largeUnit)

        // if date is partially through the interval, or is in the same interval as the start,
        // make the exclusive end be the *next* interval
        if (adjustedEnd.valueOf() !== dayRange.end.valueOf() || adjustedEnd <= adjustedStart) {
          adjustedEnd = dateEnv.add(adjustedEnd, this.slotDuration)
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
    const footprintStart = footprint.unzonedRange.start
    const footprintEnd = footprint.unzonedRange.end
    const normalFootprint = this.normalizeComponentFootprint(footprint)
    const segs = []

    // protect against when the span is entirely in an invalid date region
    if (this.computeDateSnapCoverage(footprintStart) < this.computeDateSnapCoverage(footprintEnd)) {

      // intersect the footprint's range with the grid'd range
      const segRange = normalFootprint.unzonedRange.intersect(this.normalizedUnzonedRange)

      if (segRange) {
        const segStart = segRange.start
        const segEnd = segRange.end
        segs.push({
          start: segStart,
          end: segEnd,
          isStart: segRange.isStart && this.isValidDate(segStart),
          isEnd: segRange.isEnd && this.isValidDate(addMs(segEnd, -1))
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
  normalizeGridDate(date: DateMarker): DateMarker {
    const dateEnv = this.calendar.dateEnv
    let normalDate = date

    if (!this.isTimeScale) {
      normalDate = startOfDay(normalDate)

      if (this.largeUnit) {
        normalDate = dateEnv.startOf(normalDate, this.largeUnit)
      }
    }

    return normalDate
  }


  isValidDate(date: DateMarker) {
    if (this.isHiddenDay(date)) {
      return false
    } else if (this.isTimeScale) {
      // determine if the time is within minTime/maxTime, which may have wacky values
      let day = startOfDay(date)
      let timeMs = date.valueOf() - day.valueOf()
      let ms = timeMs - asRoughMs(this.dateProfile.minTime) // milliseconds since minTime
      ms = ((ms % 86400000) + 86400000) % 86400000 // make negative values wrap to 24hr clock
      return ms < this.timeWindowMs // before the maxTime?
    } else {
      return true
    }
  }


  updateGridDates() {
    const dateEnv = this.calendar.dateEnv
    let snapIndex = -1
    let snapDiff = 0 // index of the diff :(
    const snapDiffToIndex = []
    const snapIndexToDiff = []

    let date = this.normalizedUnzonedStart
    while (date < this.normalizedUnzonedEnd) {
      if (this.isValidDate(date)) {
        snapIndex++
        snapDiffToIndex.push(snapIndex)
        snapIndexToDiff.push(snapDiff)
      } else {
        snapDiffToIndex.push(snapIndex + 0.5)
      }
      date = dateEnv.add(date, this.snapDuration)
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
    this.el.classList.add('fc-timeline')

    if (this.opt('eventOverlap') === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.timeHeadEl = this.el.querySelector('thead .fc-time-area')
    this.timeBodyEl = this.el.querySelector('tbody .fc-time-area')

    this.timeHeadScroller = new ClippedScroller({
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    })
    this.timeHeadScroller.canvas = new ScrollerCanvas()
    this.timeHeadScroller.render()
    this.timeHeadEl.appendChild(this.timeHeadScroller.el)

    this.timeBodyScroller = new ClippedScroller()
    this.timeBodyScroller.canvas = new ScrollerCanvas()
    this.timeBodyScroller.render()
    this.timeBodyEl.appendChild(this.timeBodyScroller.el)

    this.isTimeBodyScrolled = false // because if the grid has been rerendered, it will get a zero scroll
    this.timeBodyScroller.on('scroll', this.handleTimeBodyScrolled.bind(this))

    this.timeBodyScroller.canvas.bgEl.appendChild(
      this.slatContainerEl = createElement('div', { className: 'fc-slats' })
    )
    this.innerEl = this.timeBodyScroller.canvas.contentEl // for TimelineHelperRenderer
    this.innerEl.appendChild(
      this.segContainerEl = createElement('div', { className: 'fc-event-container' })
    )
    this.bgSegContainerEl = this.timeBodyScroller.canvas.bgEl

    this.timeBodyBoundCache = new CoordCache({
      els: [ this.timeBodyScroller.canvas.el ], // better representative of bounding box, considering annoying negative margins
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
    const dateEnv = this.calendar.dateEnv

    initScaleProps(this)

    this.timeWindowMs = asRoughMs(dateProfile.maxTime) - asRoughMs(dateProfile.minTime)

    // makes sure zone is stripped
    this.normalizedUnzonedStart = this.normalizeGridDate(dateProfile.renderUnzonedRange.start)
    this.normalizedUnzonedEnd = this.normalizeGridDate(dateProfile.renderUnzonedRange.end)

    // apply minTime/maxTime
    // TODO: View should be responsible.
    if (this.isTimeScale) {
      this.normalizedUnzonedStart = dateEnv.add(this.normalizedUnzonedStart, dateProfile.minTime)
      this.normalizedUnzonedEnd = dateEnv.add(
        addDays(this.normalizedUnzonedEnd, -1),
        dateProfile.maxTime
      )
    }

    this.normalizedUnzonedRange = new UnzonedRange(this.normalizedUnzonedStart, this.normalizedUnzonedEnd)

    const slotDates = []
    let date = this.normalizedUnzonedStart
    while (date < this.normalizedUnzonedEnd) {
      if (this.isValidDate(date)) {
        slotDates.push(date)
      }
      date = dateEnv.add(date, this.slotDuration)
    }

    this.slotDates = slotDates
    this.updateGridDates()

    const slatHtmlRes = this.renderSlatHtml()
    this.timeHeadScroller.canvas.contentEl.innerHTML = slatHtmlRes.headHtml
    this.timeHeadColEls = findElements(this.timeHeadScroller.canvas.contentEl, 'col')
    this.slatContainerEl.innerHTML = slatHtmlRes.bodyHtml
    this.slatColEls = findElements(this.slatContainerEl, 'col')
    this.slatEls = findElements(this.slatContainerEl, 'td')

    this.slatCoordCache = new CoordCache({
      els: this.slatEls,
      isHorizontal: true
    })

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.slatInnerCoordCache = new CoordCache({
      els: findChildren(this.slatEls, 'div'),
      isHorizontal: true,
      // we use this coord cache for getPosition* for event rendering.
      // workaround for .fc-content's negative margins.
      offsetParent: this.timeBodyScroller.canvas.el
    })

    for (let i = 0; i < this.slotDates.length; i++) {
      date = this.slotDates[i]
      this.publiclyTrigger('dayRender', [
        {
          date: dateEnv.toDate(date),
          isAllDay: !this.isTimeScale,
          el: this.slatEls[i],
          view: this
        }
      ])
    }

    if (this.headDateFollower) {
      this.headDateFollower.setSpriteEls(
        findElements(this.timeHeadEl, 'tr:not(:last-child) .fc-cell-text')
      )
    }
  }


  unrenderDates() {
    if (this.headDateFollower) {
      this.headDateFollower.clearSprites()
    }

    this.timeHeadScroller.canvas.contentEl.innerHTML = ''
    this.slatContainerEl.innerHTML = ''

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
    const { theme, dateEnv } = this.calendar
    const { labelInterval } = this
    const formats = this.headerFormats
    const cellRows = formats.map((format) => []) // indexed by row,col
    let leadingCell = null
    let prevWeekNumber = null
    const { slotDates } = this
    const slotCells = [] // meta

    // specifically for navclicks
    const rowUnits = formats.map((format) => {
      return (format as any).getLargestUnit ? (format as any).getLargestUnit() : null
    })

    for (date of slotDates) {
      const weekNumber = dateEnv.computeWeekNumber(date)
      const isWeekStart = this.emphasizeWeeks && (prevWeekNumber !== null) && (prevWeekNumber !== weekNumber)

      for (let row = 0; row < formats.length; row++) {
        format = formats[row]
        rowCells = cellRows[row]
        leadingCell = rowCells[rowCells.length - 1]
        const isSuperRow = (formats.length > 1) && (row < (formats.length - 1)) // more than one row and not the last
        let newCell = null

        if (isSuperRow) {
          let text = dateEnv.format(date, format)
          if (!leadingCell || (leadingCell.text !== text)) {
            newCell = this.buildCellObject(date, text, rowUnits[row])
          } else {
            leadingCell.colspan += 1
          }
        } else {
          if (
            !leadingCell ||
            isInt(dateEnv.countDurationsBetween(
              this.normalizedUnzonedStart,
              date,
              labelInterval
            ))
          ) {
            let text = dateEnv.format(date, format)
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

    const isChrono = asRoughMs(labelInterval) > asRoughMs(this.slotDuration)
    const oneDay = isSingleDay(this.slotDuration)

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
        if (oneDay) {
          headerCellClassNames = headerCellClassNames.concat(
            this.getDayClasses(cell.date, true) // adds "today" class and other day-based classes
          )
        }

        html +=
          '<th class="' + headerCellClassNames.join(' ') + '"' +
            ' data-date="' + dateEnv.formatIso(cell.date, { omitTime: !this.isTimeScale, omitTimeZoneOffset: true }) + '"' +
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


  buildCellObject(date: DateMarker, text, rowUnit) {
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
    const { theme, dateEnv } = this.calendar

    if (this.isTimeScale) {
      classes = []
      classes.push(
        isInt(dateEnv.countDurationsBetween(
          this.normalizedUnzonedStart,
          date,
          this.labelInterval
        )) ?
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
      ' data-date="' + dateEnv.formatIso(date, { omitTime: !this.isTimeScale, omitTimeZoneOffset: true }) + '"' +
      '><div></div></td>'
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
      return greatestDurationDenominator(this.slotDuration).unit
    }
  }


  // will only execute if isTimeScale
  renderNowIndicator(date) {
    const nodes: HTMLElement[] = []
    date = this.normalizeGridDate(date)

    if (this.normalizedUnzonedRange.containsDate(date)) {
      const coord = this.dateToCoord(date)
      const styleProps = this.isRTL ?
        { right: -coord } :
        { left: coord }

      const arrowEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-arrow',
        style: styleProps
      })

      const lineEl = createElement('div', {
        className: 'fc-now-indicator fc-now-indicator-line',
        style: styleProps
      })

      this.timeHeadScroller.canvas.el.appendChild(arrowEl)
      this.timeBodyScroller.canvas.el.appendChild(lineEl)

      nodes.push(arrowEl)
      nodes.push(lineEl)
    }

    this.nowIndicatorEls = nodes
  }


  // will only execute if isTimeScale
  unrenderNowIndicator() {
    if (this.nowIndicatorEls) {
      this.nowIndicatorEls.forEach(removeElement)
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
      bodyHeight = totalHeight - this.getHeadHeight() - this.queryMiscHeight()
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
      this.timeHeadColEls.slice(0, -1).concat(
        this.slatColEls.slice(0, -1)
      ).forEach(function(el) {
        el.style.width = nonLastSlotWidth + 'px'
      })
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
    return this.el.offsetHeight -
      this.timeHeadScroller.el.offsetHeight -
      this.timeBodyScroller.el.offsetHeight
  }


  computeSlotWidth() { // compute the *default*
    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this
    const innerEls = findElements(this.timeHeadEl, 'tr:last-child th .fc-cell-text') // TODO: cache

    innerEls.forEach(function(innerEl, i) {
      maxInnerWidth = Math.max(maxInnerWidth, innerEl.offsetWidth)
    })

    const headerWidth = maxInnerWidth + 1 // assume no padding, and one pixel border

    // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
    // TODO: rename labelDuration?
    const slotsPerLabel = wholeDivideDurations(this.labelInterval, this.slotDuration)

    let slotWidth = Math.ceil(headerWidth / slotsPerLabel)

    let minWidth: any = window.getComputedStyle(this.timeHeadColEls[0]).minWidth
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
    const dateEnv = this.calendar.dateEnv
    const snapDiff = dateEnv.countDurationsBetween(
      this.normalizedUnzonedStart,
      date,
      this.snapDuration
    )

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


  getHeadHeight() {
    // TODO: cache <table>
    const table = this.timeHeadScroller.canvas.contentEl.querySelector('table')
    return table ? table.offsetHeight : 0 // why the check?
  }


  setHeadHeight(h: number | 'auto') {
    // TODO: cache <table>
    const table = this.timeHeadScroller.canvas.contentEl.querySelector('table')
    if (table) { // why?
      applyStyleProp(table, 'height', h)
    }
  }


  // this needs to be called if v scrollbars appear on body container. or zooming
  updateSegPositions() {
    const segs = [].concat(
      this.getEventSegs(),
      this.getBusinessHourSegs()
    )

    for (let seg of segs) {
      const coords = this.rangeToCoords(seg)
      applyStyle(seg.el, {
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
        this.el.classList.add('fc-scrolled')
      }
    } else {
      if (this.isTimeBodyScrolled) {
        this.isTimeBodyScrolled = false
        this.el.classList.add('fc-scrolled')
      }
    }
  }


  computeInitialDateScroll() {
    const dateEnv = this.calendar.dateEnv
    const unzonedRange = this.get('dateProfile').activeUnzonedRange
    let left = 0

    if (this.isTimeScale) {
      let scrollTime = this.opt('scrollTime')
      if (scrollTime) {
        scrollTime = createDuration(scrollTime)
        left = this.dateToCoord(
          dateEnv.add(
            startOfDay(unzonedRange.start), // needed?
            scrollTime
          )
        )
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


  getSnapUnzonedRange(snapIndex) {
    const dateEnv = this.calendar.dateEnv
    let start = this.normalizedUnzonedStart

    start = dateEnv.add(
      start,
      multiplyDuration(this.snapDuration, this.snapIndexToDiff[snapIndex])
    )

    let end = dateEnv.add(start, this.snapDuration)

    return new UnzonedRange(start, end)
  }


  getSnapEl(snapIndex) {
    return this.slatEls[Math.floor(snapIndex / this.snapsPerSlot)]
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
