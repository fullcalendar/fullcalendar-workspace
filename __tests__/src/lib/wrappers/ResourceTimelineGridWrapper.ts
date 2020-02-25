import TimelineGridWrapper from './TimelineGridWrapper'
import { getBoundingRect } from 'standard-tests/src/lib/dom-geom'
import { findElements } from '@fullcalendar/core'
import { getRectCenter, addPoints } from 'standard-tests/src/lib/geom'


export default class ResourceTimelineGridWrapper {

  base: TimelineGridWrapper


  constructor(public el: HTMLElement) {
    this.base = new TimelineGridWrapper(el)
  }


  click(resourceId: string, date) { // not JUST a date. a resource too
    let point = this.getPoint(resourceId, date)

    if ($(this.el).css('direction') === 'ltr') {
      point.left += 1
    } else {
      point.left -= 1
    }

    return new Promise((resolve) => {
      $.simulateByPoint('drag', {
        point,
        onRelease: () => resolve()
      })
    })
  }


  dragEventTo(eventEl: HTMLElement, resourceId: string, date) {
    const MOVEOVER = 2
    let moveover = $(eventEl).css('direction') === 'ltr' ? MOVEOVER : -MOVEOVER
    let point = this.getPoint(resourceId, date)

    point.left += moveover

    return new Promise((resolve) => {
      $(eventEl).simulate('drag', {
        localPoint: { left: moveover, top: '50%' }, // 2 for zoom
        end: point,
        onRelease: () => resolve()
      })
    })
  }


  resizeEvent(eventEl: HTMLElement, newResourceId, newEndDate, fromStart?) {
    return new Promise((resolve) => {
      let $eventEl = $(eventEl)
      $eventEl.simulate('mouseover') // resizer only shows on hover

      let eventRect = eventEl.getBoundingClientRect()
      let isRtl = $eventEl.css('direction') === 'rtl'
      let resizerEl = eventEl.querySelector(fromStart ? '.fc-start-resizer' : '.fc-end-resizer')
      let resizerPoint = getRectCenter(resizerEl.getBoundingClientRect())
      let xCorrect = resizerPoint.left - (isRtl ? eventRect.left : eventRect.right)
      let destPoint = this.getPoint(newResourceId, newEndDate)
      destPoint = addPoints(destPoint, { left: xCorrect, top: 0 })

      $(resizerEl).simulate('drag', {
        end: destPoint,
        onRelease: () => resolve()
      })
    })
  }


  // TODO: util for selecting NOT on resource (mousedown on the slats underneath)
  selectDates(startInfo, inclusiveEndInfo) {
    let point0 = this.getPoint(startInfo.resourceId, startInfo.date)
    let point1 = this.getPoint(inclusiveEndInfo.resourceId, inclusiveEndInfo.date)

    if ($(this.el).css('direction') === 'rtl') {
      point0.left -= 2
      point1.left += 2
    } else {
      point0.left += 2
      point1.left -= 2
    }

    return new Promise((resolve) => {
      $.simulateByPoint('drag', {
        point: point0,
        end: point1,
        onRelease: () => resolve()
      })
    })
  }


  getRect(resourceId, start, end) {
    let coord0 = this.base.getLeft(start)
    let coord1 = this.base.getLeft(end)
    let rowRect = getBoundingRect(this.getResourceRowEl(resourceId))

    return {
      left: Math.min(coord0, coord1),
      right: Math.max(coord0, coord1),
      top: rowRect.top,
      bottom: rowRect.bottom
    }
  }


  getPoint(resourceId, date) {
    let rowRect = getBoundingRect(this.getResourceRowEl(resourceId))

    return {
      left: this.base.getLeft(date),
      top: (rowRect.top + rowRect.bottom) / 2
    }
  }


  getResourceIds() {
    return this.getResourceRowEls().map((rowEl) => (
      rowEl.getAttribute('data-resource-id')
    ))
  }


  getResourceRowEl(resourceId) {
    return this.el.querySelector(`tr[data-resource-id="${resourceId}"]`) as HTMLElement
  }


  getResourceRowEls() {
    return findElements(this.el, 'tr[data-resource-id]')
  }


  getLeft(targetDate) {
    return this.base.getLeft(targetDate)
  }


  getSlatElByDate(date) {
    return this.base.getSlatElByDate(date)
  }


  getEventEls() { // FG events
    return this.base.getEventEls()
  }


  getFirstEventEl() {
    return this.base.getFirstEventEl()
  }


  getHGroupCnt() {
    return this.el.querySelectorAll('.fc-divider').length
  }


  hasNowIndicator() {
    return this.base.hasNowIndicator()
  }


  getBgEventEls() {
    return this.base.getBgEventEls()
  }


  getMirrorEventEls() {
    return this.base.getMirrorEventEls()
  }


  getNonBusinessDayEls() {
    return this.base.getNonBusinessDayEls()
  }


  getHighlightEls() {
    return this.base.getHighlightEls()
  }

}
