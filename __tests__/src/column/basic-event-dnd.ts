// TODO: test isRtl?

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
      it('allows switching date and resource', (done) => {
        let dropSpy
        let calendar = initCalendar({
          events: [
            { title: 'event0', className: 'event0', start: '2015-11-30T12:00:00', resourceId: 'b' },
          ],
          eventDrop:
            (dropSpy = spyCall((arg) => {
              expect(arg.event.start).toEqualDate(tz.parseDate('2015-12-01T12:00:00'))
              expect(arg.event.end).toBe(null)

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            })),
        })

        let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid

        $('.event0').simulate('drag', {
          end: resourceDayGridWrapper.getDayEl('a', '2015-12-01'),
          callback() {
            expect(dropSpy).toHaveBeenCalled()
            done()
          },
        })
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5593
  it('can drag from +more link to a different resource', (done) => {
    let dropSpy
    let calendar = initCalendar({
      initialView: 'resourceDayGridMonth',
      dayMaxEvents: 0,
      events: [
        { title: 'event0', start: '2015-11-10', resourceId: 'a' },
      ],
      eventDrop:
        (dropSpy = spyCall((arg) => {
          let { event } = arg
          let resources = event.getResources()

          expect(event.start).toEqualDate('2015-11-18')
          expect(resources.length).toBe(1)
          expect(resources[0].id).toBe('b')
        })),
    })

    let resourceDayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
    let moreEl = resourceDayGridWrapper.getMoreEl()

    $(moreEl).simulate('click')
    setTimeout(() => {
      let eventEl = resourceDayGridWrapper.getMorePopoverEventEls()[0]

      $(eventEl).simulate('drag', {
        end: resourceDayGridWrapper.getDayEl('b', '2015-11-18'),
        callback() {
          expect(dropSpy).toHaveBeenCalled()
          done()
        },
      })
    }, 100)
  })
})
