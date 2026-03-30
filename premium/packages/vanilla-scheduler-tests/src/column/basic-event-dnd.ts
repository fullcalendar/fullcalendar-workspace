// TODO: test isRtl?

import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('dayGrid-view event drag-n-drop', () => {
  pushOptions({
    editable: true,
    now: '2015-11-29',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    initialView: 'resourceDayGridWeek',
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
            { title: 'event0', className: 'event0', start: '2015-11-30T12:00:00', resourceId: 'b' },
          ],
          eventDrop:
            (dropSpy = spyCall((data) => {
              expect(data.event.start).toEqualDate(tz.parseDate('2015-12-01T12:00:00'))
              expect(data.event.end).toBe(null)

              let resources = data.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            })),
        })

        let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid

        await waitTimeout()

        await new Promise<void>((resolve) => {
          $('.event0').simulate('drag', {
            end: resourceDayGridWrapper.getDayEl('a', '2015-12-01'),
            callback() {
              resolve()
            },
          })
        })

        expect(dropSpy).toHaveBeenCalled()
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5593
  it('can drag from +more link to a different resource', async () => {
    let dropSpy
    let calendar = initCalendar({
      initialView: 'resourceDayGridMonth',
      dayMaxEvents: 0,
      events: [
        { title: 'event0', start: '2015-11-10', resourceId: 'a' },
      ],
      eventDrop:
        (dropSpy = spyCall((data) => {
          let { event } = data
          let resources = event.getResources()

          expect(event.start).toEqualDate('2015-11-18')
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        })),
    })

    let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
    await waitTimeout()
    let moreEl = resourceDayGridWrapper.getMoreEl()

    $(moreEl).simulate('click')
    await waitTimeout()
    let eventEl = resourceDayGridWrapper.getMorePopoverEventEls()[0]

    await new Promise<void>((resolve) => {
      $(eventEl).simulate('drag', {
        end: resourceDayGridWrapper.getDayEl('b', '2015-11-18'),
        callback() {
          resolve()
        },
      })
    })

    expect(dropSpy).toHaveBeenCalled()
  })
})
