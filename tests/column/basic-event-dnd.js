// TODO: test isRTL?

import { getResourceDayGridDayEls } from '../lib/day-grid'

describe('basic-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'basicWeek'
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
            { title: 'event0', className: 'event0', start: '2015-11-30T12:00:00', resourceId: 'b' }
          ],
          eventAfterAllRender: oneCall(function() {
            $('.event0').simulate('drag', {
              end: getResourceDayGridDayEls('a', '2015-12-01').eq(0),
              callback() {
                expect(dropSpy).toHaveBeenCalled()
                done()
              }
            })
          }),
          eventDrop:
            (dropSpy = spyCall(function(event) {
              expect(event.start).toEqualMoment(tz.moment('2015-12-01T12:00:00'))
              expect(event.end).toBe(null)
              const resource = currentCalendar.getEventResource(event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })
  })
})
