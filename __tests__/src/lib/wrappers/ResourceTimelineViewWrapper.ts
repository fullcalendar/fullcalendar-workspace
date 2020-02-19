import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import ResourceTimelineGridWrapper from './ResourceTimelineGridWrapper'
import ResourceDataGridWrapper from './ResourceDataGridWrapper'

export default class ResourceTimelineViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeline')
  }

  get timelineGrid() {
    return new ResourceTimelineGridWrapper(
      this.el.querySelector('.fc-timeline-grid')
    )
  }

  get dataGrid() {
    return new ResourceDataGridWrapper(
      this.el.querySelector('.fc-body .fc-resource-area .fc-scroller > table')
    )
  }

}
