import { ensureDate, formatIsoDay } from 'fullcalendar-tests/lib/datelib-utils'
import { DayGridWrapper } from 'fullcalendar-tests/lib/wrappers/DayGridWrapper'
import { CalendarWrapper } from 'fullcalendar-tests/lib/wrappers/CalendarWrapper'
import { getRectCenter } from '@fullcalendar/core'
import { subtractPoints, addPoints } from 'fullcalendar-tests/lib/geom'


export class ResourceDayGridWrapper {

  base: DayGridWrapper


  constructor(private el: HTMLElement) {
    this.base = new DayGridWrapper(el)
  }


  getRootTableEl() {
    return this.base.getRootTableEl()
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

      var resizerEl = $(eventEl).find(
        '.' + (fromStart ? CalendarWrapper.EVENT_START_RESIZER_CLASSNAME : CalendarWrapper.EVENT_END_RESIZER_CLASSNAME)
      ).css('display', 'block')[0] // usually only displays on hover. force display

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
