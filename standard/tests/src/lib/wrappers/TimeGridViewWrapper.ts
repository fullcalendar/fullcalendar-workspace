import { ViewWrapper } from './ViewWrapper.js'
import { TimeGridWrapper } from './TimeGridWrapper.js'
import { DayGridWrapper } from './DayGridWrapper.js'
import { DayHeaderWrapper } from './DayHeaderWrapper.js'

export class TimeGridViewWrapper extends ViewWrapper {
  constructor(calendar) {
    super(calendar, 'fcnew-timegrid-view')
  }

  get header() {
    let headerEl = this.el.querySelector('.fcnew-timegrid-header') as HTMLElement
    return headerEl ? new DayHeaderWrapper(headerEl) : null
  }

  get timeGrid() {
    return new TimeGridWrapper(this.el.querySelector('.fcnew-timegrid-body'))
  }

  get dayGrid() { // TODO: rename to allDaySection()
    let dayGridEl = this.el.querySelector('.fcnew-timegrid-allday') as HTMLElement
    return dayGridEl ? new DayGridWrapper(dayGridEl) : null
  }

  getScrollerEl() {
    return this.el.querySelector('.fcnew-timegrid-body') // it IS the scroller
  }

  getHeaderAxisEl() {
    return this.el.querySelector('.fcnew-timegrid-header .fcnew-timegrid-axis')
  }

  getHeaderWeekNumberLink() {
    return this.getHeaderAxisEl().querySelector('a')
  }

  getHeaderWeekText() { // the title
    return $(this.getHeaderWeekNumberLink()).text()
  }

  getAllDayAxisEl() {
    return this.el.querySelector('.fcnew-timegrid-allday .fcnew-timegrid-axis')
  }

  getAllDayAxisElText() {
    return $(this.getAllDayAxisEl()).text()
  }
}
