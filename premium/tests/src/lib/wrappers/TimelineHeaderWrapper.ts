import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
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
    return this.el.querySelectorAll('[role=row]').length
  }

  getDateEls(dateRow = 0) {
    return findElements(this.el, `[role=row]:nth-child(${dateRow + 1}) > [role=gridcell][data-date]`)
  }

  getDateElByDate(dateStr, dateRow = 0) {
    return this.el.querySelector(`[role=row]:nth-child(${dateRow + 1}) > [role=gridcell][data-date="${dateStr}"]`)
  }

  getCellInfo(dateRow = 0) {
    return this.getDateEls(dateRow).map((cell) => {
      let { classList } = cell

      return {
        date: parseUtcDate(cell.getAttribute('data-date')),
        isDisabled: classList.contains('fc-slot-disabled')
          || classList.contains('fc-day-disabled'),
        hasNavLink: !!cell.querySelector('[data-navlink]'),
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
