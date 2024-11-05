import { Calendar } from '@fullcalendar/core'
import { findElements } from '../../lib/dom-misc.js'
import { ViewWrapper } from './ViewWrapper.js'
import { DayGridWrapper } from './DayGridWrapper.js'

export class MultiMonthViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-multimonth-view')
  }

  getMonths() {
    const monthEls = findElements(this.el, '.fc-multimonth-month')

    return monthEls.map((monthEl) => ({
      el: monthEl,
      title: (monthEl.querySelector('.fc-multimonth-title') as HTMLElement).innerText,
      columnCnt: monthEl.querySelectorAll('.fc-multimonth-header-row [role=gridcell]').length,
    }))
  }

  getDayGrid(i) {
    const dayGridEls = findElements(this.el, '.fc-multimonth-month')
    return new DayGridWrapper(dayGridEls[i])
  }

  getEventEls() { // FG events
    return findElements(this.el, '.fc-daygrid-event')
  }

  getScrollerEl() {
    return this.el // the view itself
  }
}
