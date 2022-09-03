import { findElements } from '@fullcalendar/core'
import { formatIsoDay } from 'fullcalendar-tests/src/lib/datelib-utils'

export class ResourceDayHeaderWrapper {
  constructor(private el: HTMLElement) {
  }

  getRootTableEl() {
    return this.el // it is the root el
  }

  getResourceEls(resourceId, date?) {
    let datePart = ''

    if (date) {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      datePart = '[data-date="' + formatIsoDay(date) + '"]'
    }

    return findElements(this.el, '.fc-col-header-cell.fc-resource[data-resource-id="' + resourceId + '"]' + datePart)
  }

  getAllResourceEls() {
    return findElements(this.el, '.fc-col-header-cell.fc-resource')
  }

  getResourceIds() {
    return this.getAllResourceEls().map((th) => (
      th.getAttribute('data-resource-id')
    ))
  }

  // TODO: make new func to query a specific resource
  // some places are abusing this via getResourceInfo()[0]
  getResourceInfo() {
    return this.getAllResourceEls().map((th) => ({
      id: th.getAttribute('data-resource-id'),
      text: $(th).text(),
    }))
  }

  getDowEls(dayAbbrev) {
    return findElements(this.el, `.fc-col-header-cell.fc-day-${dayAbbrev}`)
  }

  getWeekNumberStrings() {
    return findElements(this.el, 'tr').map((trEl) => {
      let cushionEl = trEl.querySelector('.fc-timegrid-axis-cushion')
      return $(cushionEl).text()
    })
  }
}
