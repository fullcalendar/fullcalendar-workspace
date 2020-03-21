import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import ResourceTimeGridWrapper from './ResourceTimeGridWrapper'
import ResourceDayHeaderWrapper from './ResourceDayHeaderWrapper'
import ResourceDayGridWrapper from './ResourceDayGridWrapper'


export default class ResourceTimeGridViewWrapper extends ViewWrapper {

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
    let dayGridEl = this.el.querySelector('.fc-day-grid') as HTMLElement
    return dayGridEl ? new ResourceDayGridWrapper(dayGridEl) : null
  }


  getScrollEl() {
    return this.el.querySelector('.fc-timegrid-body').parentElement // TODO: use closest
  }

}
