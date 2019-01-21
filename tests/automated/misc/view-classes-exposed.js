import { TimelineView, ResourceTimelineView } from 'fullcalendar-timeline'
import { ResourceAgendaView, ResourceBasicView } from 'fullcalendar-resourcecolumns'

describe('internal View classes', function() {

  it('are exposed', function() {
    expect(typeof TimelineView).toBe('function')
    expect(typeof ResourceTimelineView).toBe('function')
    expect(typeof ResourceAgendaView).toBe('function')
    expect(typeof ResourceBasicView).toBe('function')
  })
})
