// TODO: test isRtl?

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

  describeTimeZones(function(tz) {

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
          _eventsPositioned: oneCall(function() {
            $('.event0').simulate('drag', {
              end: getResourceDayGridDayEls('a', '2015-12-01').eq(0),
              callback() {
                expect(dropSpy).toHaveBeenCalled()
                done()
              }
            })
          }),
          eventDrop:
            (dropSpy = spyCall(function(arg) {
              expect(arg.event.start).toEqualDate(tz.createDate('2015-12-01T12:00:00'))
              expect(arg.event.end).toBe(null)
              const resource = currentCalendar.getEventResource(arg.event)
              expect(resource.id).toBe('a')
            }))
        })
      })
    })
  })
})
