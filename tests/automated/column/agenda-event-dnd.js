// TODO: test isRTL?

import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('agenda-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
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

      it('allows switching date and resource', function(done) {
        let dropSpy
        initCalendar({
          events: [
            { title: 'event0', className: 'event0', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
          ],
          eventAfterAllRender: oneCall(function() {
            $('.event0').simulate('drag', {
              localPoint: {
                top: 1, // fudge for IE10 :(
                left: '50%'
              },
              end: getResourceTimeGridPoint('a', '2015-12-01T05:00:00'),
              callback() {
                expect(dropSpy).toHaveBeenCalled()
                done()
              }
            })
          }),
          eventDrop:
            (dropSpy = spyCall(function(event) {
              expect(event.start).toEqualMoment(tz.moment('2015-12-01T05:00:00'))
              expect(event.end).toEqualMoment(tz.moment('2015-12-01T06:00:00'))
              const resource = currentCalendar.getEventResource(event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })
  })
})
