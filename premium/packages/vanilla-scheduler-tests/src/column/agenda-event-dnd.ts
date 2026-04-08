// TODO: test isRtl?

import { waitTimeout, ignoreResizeObserverLoops } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimeGridViewWrapper } from '../lib/wrappers/ResourceTimeGridViewWrapper'

describe('timeGrid-view event drag-n-drop', () => {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    initialView: 'resourceTimeGridWeek',
    scrollTime: '00:00',
  })

  describeTimeZones((tz) => {
    describeOptions({
      'resources above dates': { datesAboveResources: false },
      'dates above resources': { datesAboveResources: true },
    }, () => {
      it('allows switching date and resource', async () => {
        let dropSpy
        let calendar = initCalendar({
          events: [
            { title: 'event0', className: 'event0', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' },
          ],
          eventDrop:
            (dropSpy = spyCall((info) => {
              expect(info.event.start).toEqualDate(tz.parseDate('2015-12-01T05:00:00'))
              expect(info.event.end).toEqualDate(tz.parseDate('2015-12-01T06:00:00'))

              let resources = info.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            })),
        })
        let resourceTimeGridWrapper = new ResourceTimeGridViewWrapper(calendar).timeGrid

        await ignoreResizeObserverLoops(async () => {
          await waitTimeout()

          await new Promise<void>((resolve) => {
            $('.event0').simulate('drag', {
              localPoint: {
                top: 1, // fudge for IE10 :(
                left: '50%',
              },
              end: resourceTimeGridWrapper.getPoint('a', '2015-12-01T05:00:00'),
              callback() {
                resolve()
              },
            })
          })

          expect(dropSpy).toHaveBeenCalled()
        })
      })
    })
  })
})
