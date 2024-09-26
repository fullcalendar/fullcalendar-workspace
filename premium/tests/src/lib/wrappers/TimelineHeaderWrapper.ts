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
    return this.el.querySelectorAll('.fcnew-row').length
  }

  getDateEls(dateRow = 0) {
    return findElements(this.el, `.fcnew-row:nth-child(${dateRow + 1}) > .fcnew-cell[data-date]`)
  }

  getDateElByDate(dateStr, dateRow = 0) {
    return this.el.querySelector(`.fcnew-row:nth-child(${dateRow + 1}) > .fcnew-cell[data-date="${dateStr}"]`)
  }

  getCellInfo(dateRow = 0) {
    return this.getDateEls(dateRow).map((cell) => {
      let { classList } = cell

      return {
        date: parseUtcDate(cell.getAttribute('data-date')),
        isDisabled: classList.contains('fcnew-slot-disabled')
          || classList.contains('fcnew-day-disabled'),
        hasNavLink: !!cell.querySelector('a[data-navlink]'),
      }
    })
  }

  hasNowIndicator() {
    return Boolean(this.getNowIndicatorEl())
  }

  getNowIndicatorEl() {
    return this.el.querySelector('.fcnew-timeline-now-indicator-arrow')
  }
}
