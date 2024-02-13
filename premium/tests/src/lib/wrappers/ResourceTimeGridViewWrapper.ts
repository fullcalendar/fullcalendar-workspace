import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceTimeGridWrapper } from './ResourceTimeGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'

export class ResourceTimeGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-timegrid')
  }

  get header() {
    let headerEl = this.el.querySelector('.fc-col-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get timeGrid() {
    return new ResourceTimeGridWrapper(this.el.querySelector('.fc-timegrid-body'))
  }

  get dayGrid() {
    let dayGridEl = this.el.querySelector('.fc-daygrid-body') as HTMLElement
    return dayGridEl ? new ResourceDayGridWrapper(dayGridEl) : null
  }

  getScrollEl() {
    return this.el.querySelector('.fc-timegrid-body').parentElement // TODO: use closest
  }

  getHeaderAxisTable() {
    return this.el.querySelectorAll('.fc-timegrid-axis')[0].closest('table')
  }

  getAllDayAxisTable() {
    return this.el.querySelectorAll('.fc-timegrid-axis')[1].closest('table')
  }
}
