import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/ViewWrapper'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper'

export class ResourceDayGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-daygrid')
  }

  get header() {
    let headerEl = this.el.querySelector('.fc-col-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get dayGrid() {
    return new ResourceDayGridWrapper(this.el.querySelector('.fc-daygrid-body'))
  }
}
