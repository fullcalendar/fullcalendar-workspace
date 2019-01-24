import { TimelineView } from '@fullcalendar/timeline'
import { ResourceTimelineView } from '@fullcalendar/resource-timeline'
import { ResourceAgendaView } from '@fullcalendar/resource-timegrid'
import { ResourceBasicView } from '@fullcalendar/resource-daygrid'

describe('internal View classes', function() {

  it('are exposed', function() {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceAgendaView).toBe('function')
    expect(typeof ResourceBasicView).toBe('function')
  })
})
