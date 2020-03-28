import { findElements } from '@fullcalendar/core'
import { parseIsoAsUtc } from 'standard-tests/src/lib/datelib-utils'
import { parseUtcDate } from 'standard-tests/src/lib/date-parsing'


export default class TimelineHeaderWrapper {

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
    return this.getDateEls(dateRow).map((cell) => ({
      date: parseUtcDate(cell.getAttribute('data-date')),
      isDisabled: cell.classList.contains('fc-day-disabled')
    }))
  }


  hasNowIndicator() {
    return Boolean(this.getNowIndicatorEl())
  }


  getNowIndicatorEl() {
    return this.el.querySelector('.fc-timeline-now-indicator-arrow')
  }

}
