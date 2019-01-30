import { TimelineView } from '@fullcalendar/timeline'
import { ResourceTimelineView } from '@fullcalendar/resource-timeline'
import { ResourceTimeGridView } from '@fullcalendar/resource-timegrid'
import { ResourceDayGridView } from '@fullcalendar/resource-daygrid'

describe('internal View classes', function() {

  it('are exposed', function() {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceTimeGridView).toBe('function')
    expect(typeof ResourceDayGridView).toBe('function')
  })
})
