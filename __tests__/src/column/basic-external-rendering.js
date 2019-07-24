// TODO: test isRtl?

import { Draggable } from '@fullcalendar/interaction'
import { getResourceDayGridDayEls } from '../lib/day-grid'

describe('dayGrid-view event drag-n-drop', function() {
  pushOptions({
    droppable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'resourceDayGridWeek'
  })

  describeTimeZones(function(tz) {

    describeOptions({
      'resources above dates': { datesAboveResources: false },
      'dates above resources': { datesAboveResources: true }
    }, function() {

      it('allows dropping onto a resource', function(done) {
        let dropSpy, receiveSpy
        let dragEl = $('<a' +
          ' class="external-event fc-event"' +
          ' style="width:100px"' +
          '>external</a>')
          .appendTo('body')

        new Draggable(dragEl[0], {
          eventData: {
            title: 'my external event',
            startTime: '05:00'
          }
        })

        initCalendar({
          _eventsPositioned: oneCall(function() {
            $('.external-event').simulate('drag', {
              localPoint: { left: '50%', top: 0 },
              end: getResourceDayGridDayEls('a', '2015-12-01').eq(0),
              callback() {
                expect(dropSpy).toHaveBeenCalled()
                expect(receiveSpy).toHaveBeenCalled()
                dragEl.remove()
                done()
              }
            })
          }),
          drop:
            (dropSpy = spyCall(function(date) {})),
          // TODO: fix buggy behavior
          // https://github.com/fullcalendar/fullcalendar/issues/2955
          // expect(date).toEqualDate('2015-12-01')
          eventReceive:
            (receiveSpy = spyCall(function(arg) {
              expect(arg.event.title).toBe('my external event')
              expect(arg.event.start).toEqualDate(tz.parseDate('2015-12-01T05:00:00'))
              expect(arg.event.end).toBe(null)

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            }))
        })
      })
    })
  })
})
