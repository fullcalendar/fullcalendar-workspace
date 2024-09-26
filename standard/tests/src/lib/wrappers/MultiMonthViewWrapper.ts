import { Calendar } from '@fullcalendar/core'
import { findElements } from '@fullcalendar/core/internal'
import { ViewWrapper } from './ViewWrapper.js'
import { DayGridWrapper } from './DayGridWrapper.js'

export class MultiMonthViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-multimonth-view')
  }

  getMonths() {
    const monthEls = findElements(this.el, '.fcnew-multimonth-month')

    return monthEls.map((monthEl) => ({
      el: monthEl,
      title: (monthEl.querySelector('.fcnew-multimonth-title') as HTMLElement).innerText,
      columnCnt: monthEl.querySelectorAll('.fcnew-multimonth-header-row .fcnew-cell').length,
    }))
  }

  getDayGrid(i) {
    const dayGridEls = findElements(this.el, '.fcnew-multimonth-month')
    return new DayGridWrapper(dayGridEls[i])
  }

  getEventEls() { // FG events
    return findElements(this.el, '.fcnew-daygrid-event')
  }

  getScrollerEl() {
    return this.el // the view itself
  }
}
