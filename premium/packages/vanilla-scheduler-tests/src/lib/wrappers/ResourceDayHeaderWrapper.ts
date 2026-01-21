import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
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

    return findElements(this.el, '[role=columnheader].fc-resource[data-resource-id="' + resourceId + '"]' + datePart)
  }

  /*
  INCLUDES date cells below resources
  */
  private getAllResourceEls() {
    return findElements(this.el, '[role=columnheader].fc-resource[data-resource-id]')
  }

  getResourceIds() {
    return this.getAllResourceEls().map((resourceEl) => (
      resourceEl.getAttribute('data-resource-id')
    ))
  }

  // TODO: make new func to query a specific resource
  // some places are abusing this via getResourceInfo()[0]
  getResourceInfo() {
    return this.getAllResourceEls().map((resourceEl) => ({
      id: resourceEl.getAttribute('data-resource-id'),
      text: $(resourceEl).text(),
    }))
  }

  getDowEls(dayAbbrev) {
    return findElements(this.el, `[role=columnheader].fc-day-${dayAbbrev}`)
  }

  getWeekNumberStrings() {
    return findElements(this.el, '[role=row]').map((trEl) => {
      let cushionEl = trEl.querySelector('.fc-timegrid-axis-inner')
      return $(cushionEl).text()
    })
  }
}
