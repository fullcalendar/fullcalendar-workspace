import { findElements } from '@fullcalendar/core'
import { parseIsoAsUtc } from 'fullcalendar-tests/lib/datelib-utils'
import { parseUtcDate } from 'fullcalendar-tests/lib/date-parsing'


export class TimelineHeaderWrapper {

  constructor(private el: HTMLElement) {
  }


  getDates(dateRow = 0) {
    return this.getDateEls(dateRow).map((th) => (
      parseIsoAsUtc(th.getAttribute('data-date'))
    ))
  }


  getDateEls(dateRow = 0) {
    return findElements(this.el, `tr:nth-child(${dateRow + 1}) > th[data-date]`)
  }


  getDateElByDate(dateStr, dateRow = 0) {
    return this.el.querySelector(`tr:nth-child(${dateRow + 1}) > th[data-date="${dateStr}"]`)
  }


  getCellInfo(dateRow = 0) {
    return this.getDateEls(dateRow).map((cell) => {
      let { classList } = cell

      return {
        date: parseUtcDate(cell.getAttribute('data-date')),
        isDisabled: classList.contains('fc-slot-disabled')
          || classList.contains('fc-day-disabled')
      }
    })
  }


  hasNowIndicator() {
    return Boolean(this.getNowIndicatorEl())
  }


  getNowIndicatorEl() {
    return this.el.querySelector('.fc-timeline-now-indicator-arrow')
  }

}
