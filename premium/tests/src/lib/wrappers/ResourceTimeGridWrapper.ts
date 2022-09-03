import { startOfDay, findElements } from '@fullcalendar/core'
import { ensureDate, formatIsoDay } from 'fullcalendar-tests/src/lib/datelib-utils'
import { getBoundingRect } from 'fullcalendar-tests/src/lib/dom-geom'
import { TimeGridWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridWrapper'
import { getRectCenter, addPoints } from 'fullcalendar-tests/src/lib/geom'
import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'

export class ResourceTimeGridWrapper {
  base: TimeGridWrapper

  constructor(private el: HTMLElement) {
    this.base = new TimeGridWrapper(el)
  }

  getRect(resourceId, start, end) {
    let { base } = this

    if (typeof resourceId === 'object') {
      const obj = resourceId;
      ({ resourceId } = obj);
      ({ start } = obj);
      ({ end } = obj)
    }

    start = ensureDate(start)
    end = ensureDate(end)

    const startDay = startOfDay(start)
    const startTimeMs = start.valueOf() - startDay.valueOf()
    const endDay = startOfDay(end)
    const endTimeMs =
      (startDay.valueOf() === endDay.valueOf())
        ? end.valueOf() - endDay.valueOf()
        : end < start
          ? startTimeMs
          : (1000 * 60 * 60 * 24) // 1 day

    const dayEls = this.getDayEls(resourceId, start)
    if (dayEls.length === 1) {
      const dayRect = getBoundingRect(dayEls[0])
      return {
        left: dayRect.left,
        right: dayRect.right,
        top: base.getTimeTop(startTimeMs),
        bottom: base.getTimeTop(endTimeMs),
      }
    }

    return null
  }

  getPoint(resourceId, date) {
    date = ensureDate(date)

    const day = startOfDay(date)
    const timeMs = date.valueOf() - day.valueOf()
    const dayEls = this.getDayEls(resourceId, date)

    if (dayEls.length === 1) {
      const dayRect = getBoundingRect(dayEls[0])

      return {
        left: (dayRect.left + dayRect.right) / 2,
        top: this.base.getTimeTop(timeMs),
      }
    }

    return null
  }

  getDayEls(resourceId, date) { // TODO: rename
    date = ensureDate(date)

    return findElements(
      this.el,
      '.fc-timegrid-body .fc-day[data-date="' + formatIsoDay(date) + '"]' +
      '[data-resource-id="' + resourceId + '"]',
    )
  }

  getAllDayEls() { // TODO: rename
    return findElements(this.el, '.fc-timegrid-body .fc-day[data-resource-id]')
  }

  getResourceIds() {
    return this.getAllDayEls().map((th) => th.getAttribute('data-resource-id'))
  }

  getDowEls(dayAbbrev) {
    return this.base.getDowEls(dayAbbrev)
  }

  getEventEls() { // FG events
    return findElements(this.el, '.fc-timegrid-event')
  }

  getFirstEventEl() {
    return this.el.querySelector('.fc-timegrid-event') as HTMLElement
  }

  getNonBusinessDayEls() {
    return this.base.getNonBusinessDayEls()
  }

  resizeEvent(eventEl: HTMLElement, resourceId, origEndDate, newEndDate) {
    return new Promise<void>((resolve) => {
      let resizerEl = $(eventEl).find('.' + CalendarWrapper.EVENT_RESIZER_CLASSNAME)
        .css('display', 'block')[0] // usually only displays on hover. force display

      let resizerPoint = getRectCenter(resizerEl.getBoundingClientRect())
      let origPoint = this.getPoint(resourceId, origEndDate)
      let yCorrect = resizerPoint.top - origPoint.top
      let destPoint = this.getPoint(resourceId, newEndDate)
      destPoint = addPoints(destPoint, { left: 0, top: yCorrect })

      $(resizerEl).simulate('drag', {
        end: destPoint,
        onRelease: () => resolve(),
      })
    })
  }

  hasNowIndicator() {
    return this.base.hasNowIndicator()
  }
}
