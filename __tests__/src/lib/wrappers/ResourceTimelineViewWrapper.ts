import { Calendar } from '@fullcalendar/core'
import ViewWrapper from 'standard-tests/src/lib/wrappers/ViewWrapper'
import ResourceTimelineGridWrapper from './ResourceTimelineGridWrapper'
import ResourceDataGridWrapper from './ResourceDataGridWrapper'
import TimelineHeaderWrapper from './TimelineHeaderWrapper'
import ResourceDataHeaderWrapper from './ResourceDataHeaderWrapper'

export default class ResourceTimelineViewWrapper extends ViewWrapper {

  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeline')
  }


  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fc-timeline-header'))
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


  get dataHeader() { // rename `header` now?
    return new ResourceDataHeaderWrapper(this.el.querySelector('.fc-head .fc-resource-area'))
  }


  getDataScrollEl() {
    return this.el.querySelector('.fc-resource-area .fc-scroller')
  }


  getTimeScrollEl() {
    return this.el.querySelector('.fc-time-area .fc-scroller')
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
