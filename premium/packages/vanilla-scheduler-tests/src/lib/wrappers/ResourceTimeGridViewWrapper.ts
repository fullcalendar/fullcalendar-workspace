import { Calendar } from '@fullcalendar/vanilla'
import internalClassNames from '@fullcalendar/vanilla/protected-styles'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { findElements } from '@fullcalendar-tests/standard/lib/dom-misc'
import { ResourceTimeGridWrapper } from './ResourceTimeGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'

export class ResourceTimeGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-resource-timegrid')
  }

  get header() { // just for DayGrid purposes. does not have timegrid axis
    let headerEl = this.el.querySelector('.fc-timegrid-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get timeGrid() {
    return new ResourceTimeGridWrapper(this.getScrollEl())
  }

  get dayGrid() {
    let allDayHeaderEl = this.el.querySelector('.fc-timegrid-allday-header') as HTMLElement
    return allDayHeaderEl ? new ResourceDayGridWrapper(allDayHeaderEl.parentElement) : null
  }

  getScrollEl(): HTMLElement {
    return this.el.querySelector(`.fc-timegrid-body .${internalClassNames.internalScroller}`)
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
