import { findElements } from '@fullcalendar/core/internal'
import { formatIsoDay } from '@fullcalendar-tests/standard/lib/datelib-utils'

export class ResourceDayHeaderWrapper {
  constructor(private el: HTMLElement) {
  }

  getCanvasEl() {
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

    return findElements(this.el, '.fcnew-cell.fcnew-resource[data-resource-id="' + resourceId + '"]' + datePart)
  }

  getAllResourceEls() {
    return findElements(this.el, '.fcnew-cell.fcnew-resource')
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
    return findElements(this.el, `.fcnew-cell.fcnew-day-${dayAbbrev}`)
  }

  getWeekNumberStrings() {
    return findElements(this.el, '.fcnew-row').map((trEl) => {
      let cushionEl = trEl.querySelector('.fcnew-timegrid-axis-inner')
      return $(cushionEl).text()
    })
  }
}
