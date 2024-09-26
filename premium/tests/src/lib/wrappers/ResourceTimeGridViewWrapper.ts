import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceTimeGridWrapper } from './ResourceTimeGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'

export class ResourceTimeGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-timegrid-view')
  }

  get header() {
    let headerEl = this.el.querySelector('.fcnew-timegrid-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get timeGrid() {
    return new ResourceTimeGridWrapper(this.el.querySelector('.fcnew-timegrid-body'))
  }

  get dayGrid() {
    let dayGridEl = this.el.querySelector('.fcnew-daygrid-body') as HTMLElement
    return dayGridEl ? new ResourceDayGridWrapper(dayGridEl) : null
  }

  getScrollEl() {
    return this.el.querySelector('.fcnew-timegrid-body') // is also the scroller
  }

  getHeaderAxisCanvas() {
    return this.el.querySelector('.fcnew-timegrid-header .fcnew-timegrid-axis')
  }

  getAllDayAxisCanvas() {
    return this.el.querySelector('.fcnew-timegrid-allday .fcnew-timegrid-axis')
  }
}
