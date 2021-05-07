import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/ViewWrapper'
import { ResourceTimelineGridWrapper } from './ResourceTimelineGridWrapper'
import { ResourceDataGridWrapper } from './ResourceDataGridWrapper'
import { TimelineHeaderWrapper } from './TimelineHeaderWrapper'
import { ResourceDataHeaderWrapper } from './ResourceDataHeaderWrapper'

export class ResourceTimelineViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-resource-timeline')
  }

  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fc-timeline-header'))
  }

  get timelineGrid() {
    return new ResourceTimelineGridWrapper(
      this.el.querySelector('.fc-timeline-body'),
    )
  }

  get dataGrid() {
    return new ResourceDataGridWrapper(this.getDataGridEl())
  }

  get dataHeader() { // rename `header` now?
    // doesnt exist yet. also, delete one other one by mistake
    return new ResourceDataHeaderWrapper(this.el.querySelector('.fc-datagrid-header'))
  }

  getDataGridEl() {
    return this.el.querySelector('.fc-datagrid-body') as HTMLElement
  }

  getDataGridWidth() {
    return this.getDataGridEl().getBoundingClientRect().width
  }

  getDataScrollEl() {
    return this.el.querySelector('.fc-datagrid-body').parentElement // TODO: use closest with .fc-scroller
  }

  getTimeScrollEl() {
    return this.el.querySelector('.fc-timeline-body').parentElement // TODO: use closest with .fc-scroller
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

  getResourceCnt() { // TODO: use this in more places
    let dataResourceCnt = this.dataGrid.getResourceInfo().length
    let timeResourceCnt = this.timelineGrid.getResourceLaneEls().length

    if (dataResourceCnt !== timeResourceCnt) {
      throw new Error('Mismatch in number of rows')
    }

    return dataResourceCnt
  }
}
