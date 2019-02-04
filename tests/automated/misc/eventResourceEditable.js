import { dragResourceTimelineEvent } from '../lib/timeline'

describe('eventResourceEditable', function() {
  pushOptions({
    now: '2016-09-04',
    defaultView: 'resourceTimelineWeek',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' }
    ]
  })

  function buildEvent(extra) {
    if (extra == null) { extra = {} }
    return $.extend({
      title: 'event 1',
      start: '2016-09-04T01:00:00',
      resourceId: 'b'
    }, extra)
  }

  describe('when dates ARE draggable but resource is NOT', function() {
    pushOptions({
      editable: true
    })

    describeOptions({
      'via master property': {
        eventResourceEditable: false,
        events: [ buildEvent() ]
      },
      'via event source property': {
        eventSources: [ {
          resourceEditable: false,
          events: [ buildEvent() ]
        } ]
      },
      'via event property': {
        events: [ buildEvent({ resourceEditable: false }) ]
      }
    }, function() {
      it('keeps within resource while dragging', function(done) {
        initCalendar()
        dragResourceTimelineEvent(
          $('.fc-event'),
          { date: '2016-09-04T03:00:00', resourceId: 'c' }
        ).then(function(modifiedEvent) {
          expect(modifiedEvent.start).toEqualDate('2016-09-04T03:00:00Z')
          expect(modifiedEvent.getResources().length).toBe(1)
          expect(modifiedEvent.getResources()[0].id).toBe('b')
          done()
        })
      })
    })
  })

  describe('when dates are NOT draggable but resource IS', function() {
    pushOptions({
      editable: false
    })

    describeOptions({
      'via master property': {
        eventResourceEditable: true,
        events: [ buildEvent() ]
      },
      'via event source property': {
        eventSources: [ {
          resourceEditable: true,
          events: [ buildEvent() ]
        } ]
      },
      'via event property': {
        events: [ buildEvent({ resourceEditable: true }) ]
      }
    }, function() {
      it('keeps within resource while dragging', function(done) {
        initCalendar()
        dragResourceTimelineEvent(
          $('.fc-event'),
          { date: '2016-09-04T03:00:00', resourceId: 'c' }
        ).then(function(modifiedEvent) {
          expect(modifiedEvent.start).toEqualDate('2016-09-04T01:00:00Z')
          expect(modifiedEvent.getResources().length).toBe(1)
          expect(modifiedEvent.getResources()[0].id).toBe('c')
          done()
        })
      })
    })
  })
})
