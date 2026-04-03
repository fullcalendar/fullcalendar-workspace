import { Calendar } from 'fullcalendar'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { ResourceTimelineGridWrapper } from './ResourceTimelineGridWrapper'
import { ResourceDataGridWrapper } from './ResourceDataGridWrapper'
import { TimelineHeaderWrapper } from './TimelineHeaderWrapper'
import { ResourceDataHeaderWrapper } from './ResourceDataHeaderWrapper'

export class ResourceTimelineViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-resource-timeline')
  }

  /*
  the RIGHT area's header
  I think MUST be same-name as TimelineViewWrapper.header
  */
  get header() {
    return new TimelineHeaderWrapper(this.getTimeHeaderEl())
  }

  /*
  I think MUST be same-name as TimelineViewWrapper.timelineGrid
  */
  get timelineGrid() {
    return new ResourceTimelineGridWrapper(this.getTimeBodyEl())
  }

  get dataHeader() {
    return new ResourceDataHeaderWrapper(this.getDataGridHeaderEl())
  }

  get dataGrid() {
    return new ResourceDataGridWrapper(this.getDataGridBodyEl())
  }

  getDataGridAreaEl() {
    return this.el.querySelector('.fc-datagrid-divider').previousElementSibling as HTMLElement
  }

  getDataGridWidth() {
    return this.getDataGridAreaEl().getBoundingClientRect().width
  }

  getDataGridHeaderEl() {
    return this.getDataGridAreaEl().querySelector('.fc-timeline-header') as HTMLElement
  }

  /*
  the data grid BODY
  IS the scroller
  */
  getDataGridBodyEl() {
    return this.getDataGridAreaEl().querySelector('.fc-timeline-body') as HTMLElement
  }

  getTimeAreaEl() {
    return this.el.querySelector('.fc-datagrid-divider').nextElementSibling as HTMLElement
  }

  getTimeHeaderEl() {
    return this.getTimeAreaEl().querySelector('.fc-timeline-header') as HTMLElement
  }

  /*
  IS the scroller
  */
  getTimeBodyEl() {
    return this.getTimeAreaEl().querySelector('.fc-timeline-body') as HTMLElement
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
