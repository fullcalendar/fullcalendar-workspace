import { startOfDay, findElements } from '@fullcalendar/core'
import { ensureDate, formatIsoDay } from 'standard-tests/src/lib/datelib-utils'
import { getBoundingRect } from 'standard-tests/src/lib/dom-geom'
import TimeGridWrapper from 'standard-tests/src/lib/wrappers/TimeGridWrapper'


export default class ResourceTimeGridWrapper {

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
        bottom: base.getTimeTop(endTimeMs)
      }
    }
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
        top: this.base.getTimeTop(timeMs)
      }
    } else {
      return null
    }
  }


  getDayEls(resourceId, date) { // TODO: rename
    date = ensureDate(date)

    return findElements(
      this.el,
      '.fc-time-grid .fc-day[data-date="' + formatIsoDay(date) + '"]' +
      '[data-resource-id="' + resourceId + '"]'
    )
  }


  getAllDayEls() { // TODO: rename
    return findElements(this.el, '.fc-time-grid .fc-day[data-resource-id]')
  }


  getResourceIds() {
    return this.getAllDayEls().map((th) => {
      return th.getAttribute('data-resource-id')
    })
  }


  getDowEls(dayAbbrev) {
    return this.base.getDowEls(dayAbbrev)
  }

}
