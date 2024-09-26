import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { TimelineGridWrapper } from './TimelineGridWrapper.js'
import { TimelineHeaderWrapper } from './TimelineHeaderWrapper.js'

export class TimelineViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-timeline-view')
  }

  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fcnew-timeline-header'))
  }

  get timelineGrid() {
    return new TimelineGridWrapper(
      this.el.querySelector('.fcnew-timeline-body'),
    )
  }

  getHeaderScrollEl() {
    return this.el.querySelector('.fcnew-timeline-header') // IS the scroller
  }

  getBodyScrollerEl() {
    return this.el.querySelector('.fcnew-timeline-body') // IS the scroller
  }

  hasNowIndicator() {
    let inHeader = this.header.hasNowIndicator()
    let inBody = this.timelineGrid.hasNowIndicator()

    if (inHeader !== inBody) {
      throw new Error('Inconsistent state for now indicator')
    } else {
      return inHeader
    }
  }
}
