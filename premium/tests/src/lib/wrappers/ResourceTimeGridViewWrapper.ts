import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceTimeGridWrapper } from './ResourceTimeGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'

export class ResourceTimeGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-resource-timegrid-view')
  }

  get header() {
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

  getHeaderAxisCanvas() {
    return this.el.querySelector('.fc-timegrid-header .fc-timegrid-axis') as HTMLElement
  }

  getAllDayAxisCanvas() {
    return this.el.querySelector('.fc-timegrid-allday .fc-timegrid-axis') as HTMLElement
  }
}
