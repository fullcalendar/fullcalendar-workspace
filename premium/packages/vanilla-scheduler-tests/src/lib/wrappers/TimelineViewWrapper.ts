import { Calendar } from '@fullcalendar/vanilla'
import internalClassNames from '@fullcalendar/vanilla/protected-styles'
import { ViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/ViewWrapper'
import { TimelineGridWrapper } from './TimelineGridWrapper.js'
import { TimelineHeaderWrapper } from './TimelineHeaderWrapper.js'

export class TimelineViewWrapper extends ViewWrapper {
  constructor(calendar: Calendar) {
    super(calendar, 'fc-timeline')
  }

  get header() {
    return new TimelineHeaderWrapper(this.el.querySelector('.fc-timeline-header'))
  }

  get timelineGrid() {
    return new TimelineGridWrapper(
      this.el.querySelector('.fc-timeline-body'),
    )
  }

  getHeaderScrollEl() {
    return this.el.querySelector(`.fc-timeline-header .${internalClassNames.internalScroller}`) as HTMLElement
  }

  getBodyScrollerEl() {
    return this.el.querySelector('.fc-timeline-body') as HTMLElement // IS the scroller
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
