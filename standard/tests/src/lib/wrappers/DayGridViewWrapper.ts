import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from './ViewWrapper.js'
import { DayGridWrapper } from './DayGridWrapper.js'
import { DayHeaderWrapper } from './DayHeaderWrapper.js'

export class DayGridViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-daygrid-view')
  }

  get header() {
    let headerEl = this.el.querySelector('.fcnew-daygrid-header') as HTMLElement
    return headerEl ? new DayHeaderWrapper(headerEl) : null
  }

  get dayGrid() { // TODO: rename to body()
    return new DayGridWrapper(this.el.querySelector('.fcnew-daygrid-body'))
  }

  getScrollerEl() {
    return this.el.querySelector('.fcnew-daygrid-body') // is also the scroller
  }
}
