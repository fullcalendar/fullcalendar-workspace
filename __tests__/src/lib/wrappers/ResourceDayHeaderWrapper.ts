import { findElements } from '@fullcalendar/core'
import { formatIsoDay } from 'standard-tests/src/lib/datelib-utils'


export default class ResourceDayHeaderWrapper {

  constructor(private el: HTMLElement) {
  }


  getResourceEls(resourceId, date?) {
    let datePart = ''

    if (date) {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      datePart = '[data-date="' + formatIsoDay(date) + '"]'
    }

    return findElements(this.el, '.fc-col-header-cell[data-resource-id="' + resourceId + '"]' + datePart)
  }


  getAllResourceEls() {
    return findElements(this.el, '.fc-col-header-cell[data-resource-id]')
  }


  getResourceIds() {
    return this.getAllResourceEls().map((th) => (
      th.getAttribute('data-resource-id')
    ))
  }


  getResourceInfo() {
    return this.getAllResourceEls().map((th) => ({
      id: th.getAttribute('data-resource-id'),
      title: $(th).text()
    }))
  }


  getDowEls(dayAbbrev) {
    return findElements(this.el, `.fc-col-header-cell.fc-${dayAbbrev}`)
  }

}
