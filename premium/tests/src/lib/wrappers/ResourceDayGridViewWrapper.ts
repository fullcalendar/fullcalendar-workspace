import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceDayGridWrapper } from './ResourceDayGridWrapper.js'
import { ResourceDayHeaderWrapper } from './ResourceDayHeaderWrapper.js'

export class ResourceDayGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-resource-daygrid-view')
  }

  get header() {
    let headerEl = this.el.querySelector('.fcnew-daygrid-header') as HTMLElement
    return headerEl ? new ResourceDayHeaderWrapper(headerEl) : null
  }

  get dayGrid() {
    return new ResourceDayGridWrapper(this.el.querySelector('.fcnew-daygrid-body'))
  }
}
