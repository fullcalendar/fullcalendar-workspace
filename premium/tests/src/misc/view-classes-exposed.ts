import { TimelineView } from '@fullcalendar/timeline/internal'
import { ResourceTimelineView } from '@fullcalendar/resource-timeline/internal'
import { ResourceDayTimeColsView } from '@fullcalendar/resource-timegrid/internal'
import { ResourceDayTableView } from '@fullcalendar/resource-daygrid/internal'

describe('internal View classes', () => {
  it('are exposed', () => {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceDayTimeColsView).toBe('function')
    expect(typeof ResourceDayTableView).toBe('function')
  })
})
