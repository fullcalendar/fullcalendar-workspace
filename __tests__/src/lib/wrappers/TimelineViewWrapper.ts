import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import TimelineGridWrapper from './TimelineGridWrapper'

export default class TimelineViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeline')
  }

  get timelineGrid() {
    return new TimelineGridWrapper(
      this.el.querySelector('.fc-timeline-grid')
    )
  }

}
