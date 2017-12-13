import { dragResourceTimelineEvent } from '../lib/timeline'

describe('eventAllow', function() {
  pushOptions({
    now: '2016-09-04',
    defaultView: 'timelineWeek',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    events: [
      {
        title: 'event 1',
        start: '2016-09-04T01:00',
        resourceId: 'a'
      }
    ]
  })

  it('disallows dragging when returning false', function(done) { // and given correct params
    let isACalled = false
    let isBCalled = false

    initCalendar({
      eventAllow(dropInfo, event) {
        if (dropInfo.resourceId === 'a') {
          isACalled = true
        } else if (dropInfo.resourceId === 'b') {
          isBCalled = true
        }
        expect(typeof event).toBe('object')
        return false
      }
    })

    dragResourceTimelineEvent(
      $('.fc-event'),
      { date: '2016-09-04T03:00:00', resourceId: 'b' }
    ).then(function(modifiedEvent) {
      expect(modifiedEvent).toBeFalsy() // drop failure?
      expect(isACalled).toBe(true)
      expect(isBCalled).toBe(true)
      done()
    })
  })

  it('allows dragging when returning true', function(done) {
    let isCalled = false

    initCalendar({
      eventAllow(dropInfo, event) {
        isCalled = true
        return true
      }
    })

    dragResourceTimelineEvent(
      $('.fc-event'),
      { date: '2016-09-04T03:00:00', resourceId: 'b' }
    ).then(function(modifiedEvent) {
      expect(typeof modifiedEvent).toBe('object')
      expect(modifiedEvent.start.format()).toBe('2016-09-04T03:00:00')
      expect(modifiedEvent.resourceId).toBe('b')
      expect(isCalled).toBe(true)
      done()
    })
  })
})
