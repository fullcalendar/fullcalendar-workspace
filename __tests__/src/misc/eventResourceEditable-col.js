import { parseUtcDate } from 'package-tests/lib/date-parsing'
import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('eventResourceEditable in vertical resource view', function() {

  it('allows resource dragging while start-date-dragging is disabled', function(done) {
    let dropSpy

    initCalendar({
      defaultView: 'resourceTimeGridDay',
      now: '2019-08-01',
      scrollTime: '00:00',
      editable: true,
      eventStartEditable: false,
      eventResourceEditable: true,
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' }
      ],
      events: [
        { start: '2019-08-01T01:00:00', resourceId: 'a' }
      ],
      _eventsPositioned: oneCall(function() {
        $('.fc-event').simulate('drag', {
          localPoint: {
            top: 1, // fudge for IE10 :(
            left: '50%'
          },
          end: getResourceTimeGridPoint('b', '2019-08-01T05:00:00'),
          callback() {
            expect(dropSpy).toHaveBeenCalled()
            done()
          }
        })
      }),
      eventDrop: (dropSpy = spyCall(function(arg) {
        expect(arg.event.start).toEqualDate(parseUtcDate('2019-08-01T01:00:00'))
        expect(arg.event.end).toEqual(null)

        let resources = arg.event.getResources()
        expect(resources.length).toBe(1)
        expect(resources[0].id).toBe('b')
      }))
    })
  })

})
