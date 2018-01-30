import { getTimeGridPoint } from 'fullcalendar/tests/automated/lib/time-grid'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('column event dragging with constraint', function() {
  pushOptions({
    now: '2016-02-14',
    defaultView: 'agendaDay',
    scrollTime: '00:00',
    editable: true,
    eventOverlap: false,
    resources: [
      { id: 'a', title: 'Resource A', eventColor: 'green' },
      { id: 'b', title: 'Resource B', eventColor: 'red' }
    ],
    views: {
      agendaNoResource: {
        type: 'agenda',
        resources: false
      }
    }
  })

  describe('when distinct resource columns', function() {

    describeOptions('defaultView', {
      'when resource columns': 'agendaDay',
      'when no resource columns': 'agendaNoResource'
    }, function(val) {

      it('allows drop on same time, different resource', function(done) {
        expectDropToBe(true, [
          { id: '1',
            resourceId: 'a',
            title: 'Event 1',
            className: 'event1',
            start: '2016-02-14T01:00:00',
            end: '2016-02-14T03:00:00' },
          { id: '2',
            resourceId: 'b',
            title: 'Event 2',
            className: 'event2',
            start: '2016-02-14T04:00:00',
            end: '2016-02-14T06:00:00' }
        ], done)
      })

      it('disallows drop on same time, same resource', function(done) {
        expectDropToBe(false, [
          { id: '1',
            resourceId: 'a',
            title: 'Event 1',
            className: 'event1',
            start: '2016-02-14T01:00:00',
            end: '2016-02-14T03:00:00' },
          { id: '2',
            resourceId: 'a',
            title: 'Event 2',
            className: 'event2',
            start: '2016-02-14T04:00:00',
            end: '2016-02-14T06:00:00' }
        ], done)
      })

      it('disallows drop on same time, same resource, when multiple', function(done) {
        expectDropToBe(false, [
          { id: '1',
            resourceId: 'a',
            title: 'Event 1',
            className: 'event1',
            start: '2016-02-14T01:00:00',
            end: '2016-02-14T03:00:00' },
          { id: '2',
            resourceIds: ['a', 'b'],
            title: 'Event 2',
            className: 'event2',
            start: '2016-02-14T04:00:00',
            end: '2016-02-14T06:00:00' }
        ], done)
      })

      it('disallows drop on same time, non-resource peer', function(done) {
        expectDropToBe(false, [
          { id: '1',
            resourceId: 'a',
            title: 'Event 1',
            className: 'event1',
            start: '2016-02-14T01:00:00',
            end: '2016-02-14T03:00:00' },
          { id: '2',
            rendering: 'background',
            title: 'Event 2',
            className: 'event2',
            start: '2016-02-14T04:00:00',
            end: '2016-02-14T06:00:00' }
        ], done)
      })

      // util
      function expectDropToBe(bool, events, done) {
        let dropped = false
        initCalendar({
          events,
          eventAfterAllRender:
            oneCall(function() {
              $('.event1').simulate('drag', {
                localPoint: { left: '50%', top: 0 },
                end: val === 'agendaDay'
                  ? getResourceTimeGridPoint('a', '2016-02-14T04:00:00')
                  : getTimeGridPoint('2016-02-14T04:00:00')
              })
            }),
          eventDrop() {
            dropped = true
          },
          eventDragStop() {
            setTimeout(function() { // will call after the drop
              expect(dropped).toBe(bool)
              done()
            })
          }
        })
      };
    })
  })
})
