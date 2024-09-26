import { Calendar } from '@fullcalendar/core'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceTimelineGridWrapper } from './ResourceTimelineGridWrapper.js'
import { ResourceDataGridWrapper } from './ResourceDataGridWrapper.js'
import { TimelineHeaderWrapper } from './TimelineHeaderWrapper.js'
import { ResourceDataHeaderWrapper } from './ResourceDataHeaderWrapper.js'

export class ResourceTimelineViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fcnew-resource-timeline-view')
  }

  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fcnew-timeline-header'))
  }

  get timelineGrid() {
    return new ResourceTimelineGridWrapper(
      this.el.querySelector('.fcnew-timeline-body'),
    )
  }

  get dataGrid() {
    return new ResourceDataGridWrapper(this.getDataGridEl())
  }

  get dataHeader() { // rename `header` now?
    // doesnt exist yet. also, delete one other one by mistake
    return new ResourceDataHeaderWrapper(this.el.querySelector('.fcnew-datagrid-header'))
  }

  getDataGridEl() {
    return this.el.querySelector('.fcnew-datagrid-body') as HTMLElement
  }

  getDataGridWidth() {
    return this.getDataGridEl().getBoundingClientRect().width
  }

  getDataScrollEl() {
    return this.el.querySelector('.fcnew-datagrid-body') // IS the scroll element
  }

  getTimeScrollEl() {
    return this.el.querySelector('.fcnew-timeline-body') // IS the scroll element
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
