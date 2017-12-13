// TODO: test isRTL?

import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('agenda-view event drag-n-drop', function() {
  pushOptions({
    droppable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'agendaWeek',
    scrollTime: '00:00'
  })

  describeTimezones(function(tz) {

    describeOptions({
      'resources above dates': { groupByResource: true },
      'dates above resources': { groupByDateAndResource: true }
    }, function() {

      it('allows dropping onto a resource', function(done) {
        let dropSpy, receiveSpy
        const dragEl = $('<a' +
          ' class="external-event fc-event"' +
          ' style="width:100px"' +
          ' data-event=\'{"title":"my external event"}\'' +
          '>external</a>')
          .appendTo('body')
          .draggable()

        initCalendar({
          eventAfterAllRender: oneCall(function() {
            $('.external-event').simulate('drag', {
              localPoint: { left: '50%', top: 0 },
              end: getResourceTimeGridPoint('a', '2015-12-01T05:00:00'),
              callback() {
                expect(dropSpy).toHaveBeenCalled()
                expect(receiveSpy).toHaveBeenCalled()
                dragEl.remove()
                done()
              }
            })
          }),
          drop:
            (dropSpy = spyCall(function(date) {
              return expect(date).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
            })),
          eventReceive:
            (receiveSpy = spyCall(function(event) {
              expect(event.title).toBe('my external event')
              expect(event.start).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
              expect(event.end).toBe(null)
              const resource = currentCalendar.getEventResource(event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })
  })
})
