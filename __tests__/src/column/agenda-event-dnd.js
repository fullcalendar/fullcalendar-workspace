// TODO: test isRtl?

import { getResourceTimeGridPoint } from '../lib/time-grid'

describe('timeGrid-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    defaultView: 'resourceTimeGridWeek',
    scrollTime: '00:00'
  })

  describeTimeZones(function(tz) {

    describeOptions({
      'resources above dates': { datesAboveResources: false },
      'dates above resources': { datesAboveResources: true }
    }, function() {

      it('allows switching date and resource', function(done) {
        let dropSpy
        initCalendar({
          events: [
            { title: 'event0', className: 'event0', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }
          ],
          _eventsPositioned: oneCall(function() {
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
            (dropSpy = spyCall(function(arg) {
              expect(arg.event.start).toEqualDate(tz.parseDate('2015-12-01T05:00:00'))
              expect(arg.event.end).toEqualDate(tz.parseDate('2015-12-01T06:00:00'))

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            }))
        })
      })
    })
  })
})
