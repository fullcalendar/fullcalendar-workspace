import { TimelineView } from '@fullcalendar/timeline/internal'
import { ResourceTimelineView } from '@fullcalendar/resource-timeline/internal'
import { ResourceTimeGridView } from '@fullcalendar/resource-timegrid/internal'
import { ResourceDayGridView } from '@fullcalendar/resource-daygrid/internal'

describe('internal View classes', () => {
  it('are exposed', () => {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceTimeGridView).toBe('function')
    expect(typeof ResourceDayGridView).toBe('function')
  })
})
