import { dragResourceTimelineEvent } from '../lib/timeline'

describe('eventConstraint', function() {
  pushOptions({
    now: '2016-09-04',
    defaultView: 'timelineWeek',
    scrollTime: '00:00',
    editable: true,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ],
    events: [
      {
        title: 'event 1',
        start: '2016-09-04T01:00',
        resourceId: 'b'
      }
    ]
  })

  // FYI: the fact that eventConstraint may be specified in Event Source and Event Objects
  // is covered by the core tests.

  describe('with one resourceId', function() {
    pushOptions({
      eventConstraint: {
        resourceId: 'b'
      }
    })

    it('allows dragging to the resource', function(done) {
      initCalendar()
      dragResourceTimelineEvent(
        $('.fc-event'),
        { date: '2016-09-04T03:00:00', resourceId: 'b' }
      ).then(function(modifiedEvent) {
        expect(modifiedEvent.start.format()).toBe('2016-09-04T03:00:00')
        done()
      })
    })

    it('disallows dragging to other resources', function(done) {
      initCalendar()
      dragResourceTimelineEvent(
        $('.fc-event'),
        { date: '2016-09-04T03:00:00', resourceId: 'c' }
      ).then(function(modifiedEvent) {
        expect(modifiedEvent).toBeFalsy() // failure
        done()
      })
    })
  })

  describe('with multiple resourceIds', function() {
    pushOptions({
      eventConstraint: {
        resourceIds: [ 'b', 'c' ]
      }
    })

    it('allows dragging to whitelisted resource', function(done) {
      initCalendar()
      dragResourceTimelineEvent(
        $('.fc-event'),
        { date: '2016-09-04T03:00:00', resourceId: 'c' }
      ).then(function(modifiedEvent) {
        expect(modifiedEvent.start.format()).toBe('2016-09-04T03:00:00')
        done()
      })
    })

    it('disallows dragging to non-whitelisted resources', function(done) {
      initCalendar()
      dragResourceTimelineEvent(
        $('.fc-event'),
        { date: '2016-09-04T03:00:00', resourceId: 'a' }
      ).then(function(modifiedEvent) {
        expect(modifiedEvent).toBeFalsy() // failure
        done()
      })
    })
  })
})
