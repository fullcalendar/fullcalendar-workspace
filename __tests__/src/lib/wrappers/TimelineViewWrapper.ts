import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import TimelineGridWrapper from './TimelineGridWrapper'
import TimelineHeaderWrapper from './TimelineHeaderWrapper'

export default class TimelineViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeline')
  }


  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fc-timeline-header'))
  }


  get timelineGrid() {
    return new TimelineGridWrapper(
      this.el.querySelector('.fc-timeline-grid')
    )
  }


  getHeaderScrollEl() {
    return this.el.querySelector('.fc-body .fc-time-area .fc-scroller')
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
