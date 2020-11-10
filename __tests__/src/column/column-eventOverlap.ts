import { TimeGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/TimeGridViewWrapper'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('column event dragging with constraint', () => {
  pushOptions({
    now: '2016-02-14',
    initialView: 'resourceTimeGridDay',
    scrollTime: '00:00',
    editable: true,
    eventOverlap: false,
    resources: [
      { id: 'a', title: 'Resource A', eventColor: 'green' },
      { id: 'b', title: 'Resource B', eventColor: 'red' },
    ],
  })

  describe('when distinct resource columns', () => {
    describeOptions('initialView', {
      'when resource columns': 'resourceTimeGridDay',
      'when no resource columns': 'timeGrid',
    }, (val) => {
      it('allows drop on same time, different resource', (done) => {
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
            end: '2016-02-14T06:00:00' },
        ], done)
      })

      it('disallows drop on same time, same resource', (done) => {
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
            end: '2016-02-14T06:00:00' },
        ], done)
      })

      it('disallows drop on same time, same resource, when multiple', (done) => {
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
            end: '2016-02-14T06:00:00' },
        ], done)
      })

      it('disallows drop on same time, non-resource peer', (done) => {
        expectDropToBe(false, [
          { id: '1',
            resourceId: 'a',
            title: 'Event 1',
            className: 'event1',
            start: '2016-02-14T01:00:00',
            end: '2016-02-14T03:00:00' },
          { id: '2',
            display: 'background',
            title: 'Event 2',
            className: 'event2',
            start: '2016-02-14T04:00:00',
            end: '2016-02-14T06:00:00' },
        ], done)
      })

      // util
      function expectDropToBe(bool, events, done) {
        let dropped = false

        let calendar = initCalendar({
          events,
          eventDrop() {
            dropped = true
          },
          eventDragStop() {
            setTimeout(() => { // will call after the drop
              expect(dropped).toBe(bool)
              done()
            })
          },
        })

        $('.event1').simulate('drag', {
          localPoint: { left: '50%', top: 0 },
          end: val === 'resourceTimeGridDay' // otherwise 'timeGrid'
            ? new ResourceTimeGridViewWrapper(calendar).timeGrid.getPoint('a', '2016-02-14T04:00:00')
            : new TimeGridViewWrapper(calendar).timeGrid.getPoint('2016-02-14T04:00:00'),
        })
      }
    })
  })
})
