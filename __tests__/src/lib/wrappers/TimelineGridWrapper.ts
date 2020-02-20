import { findElements } from '@fullcalendar/core'
import { ensureDate, formatIsoWithoutTz } from 'standard-tests/src/lib/datelib-utils'
import { getBoundingRect } from 'standard-tests/src/lib/dom-geom'


export default class TimelineGridWrapper {

  constructor(private el: HTMLElement) {
  }


  clickDate(date) { // not JUST a date. a resource too
    return new Promise((resolve) => {
      $.simulateByPoint('drag', {
        point: this.getPoint(date),
        onRelease: () => resolve()
      })
    })
  }


  getEventEls() { // FG events
    return findElements(this.el, '.fc-event')
  }


  getFirstEventEl() {
    return this.el.querySelector('.fc-event') as HTMLElement
  }


  getMirrorEventEls() {
    return findElements(this.el, '.fc-mirror')
  }


  getSlatEls() {
    return findElements(this.el, '.fc-slats td')
  }


  getSlatElByDate(dateOrStr) { // prefers string. we do this because all-day doesnt have 00:00:00
    if (typeof dateOrStr !== 'string') {
      dateOrStr = formatIsoWithoutTz(ensureDate(dateOrStr))
    }
    return this.el.querySelector('.fc-slats td[data-date="' + dateOrStr + '"]')
  }


  getRect(start, end) {
    let coord0 = this.getLeft(start)
    let coord1 = this.getLeft(end)
    let canvasRect = getBoundingRect($('.fc-body .fc-time-area .fc-timeline-grid'))

    return {
      left: Math.min(coord0, coord1),
      right: Math.max(coord0, coord1),
      top: canvasRect.top,
      bottom: canvasRect.bottom
    }
  }


  getLine(date) {
    let contentRect = getBoundingRect(this.el)
    let left = this.getLeft(date)

    return {
      left,
      right: left,
      top: contentRect.top,
      bottom: contentRect.bottom
    }
  }


  getPoint(date) {
    let contentRect = getBoundingRect(this.el)
    let left = this.getLeft(date)

    return {
      top: (contentRect.top + contentRect.bottom) / 2,
      left
    }
  }


  getLeft(targetDate) {
    targetDate = ensureDate(targetDate)

    let slatCoord
    let isRtl = $(this.el).css('direction') === 'rtl'
    let borderWidth = 1
    let slatEl = this.getSlatElByDate(targetDate)

    const getLeadingEdge = function(cellEl) {
      let $cellEl = $(cellEl)

      if (isRtl) {
        return ($cellEl.offset().left + $cellEl.outerWidth()) - borderWidth
      } else {
        return $cellEl.offset().left + borderWidth
      }
    }

    const getTrailingEdge = function(cellEl) {
      let $cellEl = $(cellEl)

      if (isRtl) {
        return $cellEl.offset().left - borderWidth
      } else {
        return $cellEl.offset().left + borderWidth + $cellEl.outerWidth()
      }
    }

    if (slatEl) {
      return getLeadingEdge(slatEl)
    }

    let slatEls = this.getSlatEls()
    let slatDate = null
    let prevSlatDate = null

    for (let i = 0; i < slatEls.length; i++) { // traverse earlier to later
      slatEl = slatEls[i]

      prevSlatDate = slatDate
      slatDate = ensureDate(slatEl.getAttribute('data-date'))

      // is target time between start of previous slat but before this one?
      if (targetDate < slatDate) {
        // before first slat
        if (!prevSlatDate) {
          return getLeadingEdge(slatEl)
        } else {
          const prevSlatEl = slatEls[i - 1]
          const prevSlatCoord = getLeadingEdge(prevSlatEl)
          slatCoord = getLeadingEdge(slatEl)
          return prevSlatCoord +
            ((slatCoord - prevSlatCoord) *
            ((targetDate - prevSlatDate.valueOf()) / (slatDate.valueOf() - prevSlatDate.valueOf())))
        }
      }
    }

    // target date must be after start date of last slat
    // `slatDate` is set to the start date of the last slat

    // guess the duration of the last slot, based on previous duration
    const slatMsDuration = slatDate.valueOf() - prevSlatDate.valueOf()

    slatCoord = getLeadingEdge(slatEl)
    const slatEndCoord = getTrailingEdge(slatEl)

    return slatCoord + // last slat's starting edge
      ((slatEndCoord - slatCoord) *
      Math.min(1, (targetDate - slatDate.valueOf()) / slatMsDuration)) // don't go past the last slat
  }


  hasNowIndicator() {
    return Boolean(this.getNowIndicatorEl())
  }


  getNowIndicatorEl() {
    return this.el.querySelector('.fc-now-indicator-line')
  }


  getBgEventEls() {
    return findElements(this.el, '.fc-bgevent')
  }

}
