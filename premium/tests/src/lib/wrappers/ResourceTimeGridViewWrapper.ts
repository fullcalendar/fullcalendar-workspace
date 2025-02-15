import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
import { ResourceTimeGridWrapper } from './ResourceTimeGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'

export class ResourceTimeGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-resource-timegrid-view')
  }

  get header() { // just for DayGrid purposes. does not have timegrid axis
    let headerEl = this.el.querySelector('.fc-timegrid-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get timeGrid() {
    return new ResourceTimeGridWrapper(this.el.querySelector('.fc-timegrid-body'))
  }

  get dayGrid() {
    let dayGridEl = this.el.querySelector('.fc-timegrid-allday') as HTMLElement
    return dayGridEl ? new ResourceDayGridWrapper(dayGridEl) : null
  }

  getScrollEl() {
    return this.el.querySelector('.fc-timegrid-body') // is also the scroller
  }

  /*
  TODO: DRY with TimeGridViewWrapper
  */
  getHeaderRowsGroupByRowIndex() {
    const rowEls = findElements(this.el, '.fc-timegrid-header [role=row][aria-rowindex]')
    const byRowIndex = {}

    for (const rowEl of rowEls) {
      const rowIndex = rowEl.getAttribute('aria-rowindex')

      if (!byRowIndex[rowIndex]) {
        byRowIndex[rowIndex] = []
      }

      byRowIndex[rowIndex].push(rowEl)
    }

    return byRowIndex
  }
}
