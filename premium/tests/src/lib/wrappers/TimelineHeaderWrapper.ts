import { findElements } from '@fullcalendar/core/internal'
import { parseIsoAsUtc } from '@fullcalendar-tests/standard/lib/datelib-utils'
import { parseUtcDate } from '@fullcalendar-tests/standard/lib/date-parsing'

export class TimelineHeaderWrapper {
  constructor(private el: HTMLElement) {
  }

  getDates(dateRow = 0) {
    return this.getDateEls(dateRow).map((th) => (
      parseIsoAsUtc(th.getAttribute('data-date'))
    ))
  }

  getDateRowCnt() {
    return this.el.querySelectorAll('.fc-row').length
  }

  getDateEls(dateRow = 0) {
    return findElements(this.el, `.fc-row:nth-child(${dateRow + 1}) > .fc-cell[data-date]`)
  }

  getDateElByDate(dateStr, dateRow = 0) {
    return this.el.querySelector(`.fc-row:nth-child(${dateRow + 1}) > .fc-cell[data-date="${dateStr}"]`)
  }

  getCellInfo(dateRow = 0) {
    return this.getDateEls(dateRow).map((cell) => {
      let { classList } = cell

      return {
        date: parseUtcDate(cell.getAttribute('data-date')),
        isDisabled: classList.contains('fc-slot-disabled')
          || classList.contains('fc-day-disabled'),
        hasNavLink: !!cell.querySelector('a[data-navlink]'),
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
