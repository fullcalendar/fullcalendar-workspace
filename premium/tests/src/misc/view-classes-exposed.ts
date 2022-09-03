import { TimelineView } from '@fullcalendar/timeline'
import { ResourceTimelineView } from '@fullcalendar/resource-timeline'
import { ResourceDayTimeColsView } from '@fullcalendar/resource-timegrid'
import { ResourceDayTableView } from '@fullcalendar/resource-daygrid'

describe('internal View classes', () => {
  it('are exposed', () => {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceDayTimeColsView).toBe('function')
    expect(typeof ResourceDayTableView).toBe('function')
  })
})
