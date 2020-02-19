import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import ResourceDayGridWrapper from './ResourceDayGridWrapper'
import ResourceDayHeaderWrapper from './ResourceDayHeaderWrapper'


export default class ResourceDayGridViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-dayGrid-view')
  }


  get header() {
    let headerEl = this.el.querySelector('.fc-head .fc-scroller > table') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }


  get dayGrid() {
    return new ResourceDayGridWrapper(this.el.querySelector('.fc-day-grid'))
  }

}
