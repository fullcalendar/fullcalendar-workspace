import { ensureDate, formatIsoDay } from 'standard-tests/src/lib/datelib-utils'
import TimeGridWrapper from 'standard-tests/src/lib/wrappers/TimeGridWrapper'


export default class ResourceDayGridWrapper {

  base: TimeGridWrapper


  constructor(private el: HTMLElement) {
    this.base = new TimeGridWrapper(el)
  }


  getDayEl(resourceId, date) {
    date = ensureDate(date)
    return this.el.querySelector(
      '.fc-day[data-date="' + formatIsoDay(date) + '"]' +
      '[data-resource-id="' + resourceId + '"]'
    )
  }


  getDowEls(dayAbbrev) {
    return this.base.getDowEls(dayAbbrev)
  }

}
