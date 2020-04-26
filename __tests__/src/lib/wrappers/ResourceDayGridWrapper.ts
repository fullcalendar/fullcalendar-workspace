import { ensureDate, formatIsoDay } from 'standard-tests/src/lib/datelib-utils'
import { DayGridWrapper } from 'standard-tests/src/lib/wrappers/DayGridWrapper'
import { CalendarWrapper } from 'standard-tests/src/lib/wrappers/CalendarWrapper'
import { getRectCenter } from '@fullcalendar/preact'
import { subtractPoints, addPoints } from 'standard-tests/src/lib/geom'


export class ResourceDayGridWrapper {

  base: DayGridWrapper


  constructor(private el: HTMLElement) {
    this.base = new DayGridWrapper(el)
  }


  getDayEl(resourceId, date) {
    date = ensureDate(date)
    return this.el.querySelector(
      '.fc-day[data-date="' + formatIsoDay(date) + '"]' +
      '[data-resource-id="' + resourceId + '"]'
    )
  }


  getDowEls(dayAbbrev) {
    return this.base.getDowEls(dayAbbrev)
  }


  getNonBusinessDayEls() {
    return this.base.getNonBusinessDayEls()
  }


  getRowEls() {
    return this.base.getRowEls()
  }


  resizeEvent(eventEl: HTMLElement, origEndInfo, newEndInfo, fromStart?) {
    return new Promise((resolve) => {
      let rect0 = this.getDayEl(origEndInfo.resourceId, origEndInfo.date).getBoundingClientRect()
      let rect1 = this.getDayEl(newEndInfo.resourceId, newEndInfo.date).getBoundingClientRect()

      $(eventEl).simulate('mouseover') // so that resize handle is revealed

      var resizerEl = eventEl.querySelector(
        '.' + (fromStart ? CalendarWrapper.EVENT_START_RESIZER_CLASSNAME : CalendarWrapper.EVENT_END_RESIZER_CLASSNAME)
      )
      var resizerRect = resizerEl.getBoundingClientRect()
      var resizerCenter = getRectCenter(resizerRect)

      var vector = subtractPoints(resizerCenter, rect0)
      var endPoint = addPoints(rect1, vector)

      $(resizerEl).simulate('drag', {
        point: resizerCenter,
        end: endPoint,
        onRelease: () => resolve()
      })
    })
  }

}
