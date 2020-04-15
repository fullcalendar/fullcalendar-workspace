// TODO: test isRtl?

import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('dayGrid-view event drag-n-drop', function() {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' }
    ],
    initialView: 'resourceDayGridWeek'
  })

  describeTimeZones(function(tz) {

    describeOptions({
      'resources above dates': { datesAboveResources: false },
      'dates above resources': { datesAboveResources: true }
    }, function() {

      it('allows switching date and resource', function(done) {
        let dropSpy
        let calendar = initCalendar({
          events: [
            { title: 'event0', className: 'event0', start: '2015-11-30T12:00:00', resourceId: 'b' }
          ],
          eventDrop:
            (dropSpy = spyCall(function(arg) {
              expect(arg.event.start).toEqualDate(tz.parseDate('2015-12-01T12:00:00'))
              expect(arg.event.end).toBe(null)

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            }))
        })

        let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid

        $('.event0').simulate('drag', {
          end: resourceDayGridWrapper.getDayEl('a', '2015-12-01'),
          callback() {
            expect(dropSpy).toHaveBeenCalled()
            done()
          }
        })
      })
    })
  })
})
