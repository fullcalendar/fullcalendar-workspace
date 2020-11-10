// TODO: test isRtl?

import { Draggable } from '@fullcalendar/interaction'
import { CalendarWrapper } from 'fullcalendar-tests/src/lib/wrappers/CalendarWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

describe('dayGrid-view event drag-n-drop', () => {
  pushOptions({
    droppable: true,
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
      it('allows dropping onto a resource', (done) => {
        let dropSpy
        let receiveSpy
        let dragEl = $('<a' +
          ` class="external-event ${CalendarWrapper.EVENT_CLASSNAME}"` +
          ' style="width:100px"' +
          '>external</a>')
          .appendTo('body')

        new Draggable(dragEl[0], { // eslint-disable-line no-new
          eventData: {
            title: 'my external event',
            startTime: '05:00',
          },
        })

        let calendar = initCalendar({
          drop:
            (dropSpy = spyCall((date) => {})),
          // TODO: fix buggy behavior
          // https://github.com/fullcalendar/fullcalendar/issues/2955
          // expect(date).toEqualDate('2015-12-01')
          eventReceive:
            (receiveSpy = spyCall((arg) => {
              expect(arg.event.title).toBe('my external event')
              expect(arg.event.start).toEqualDate(tz.parseDate('2015-12-01T05:00:00'))
              expect(arg.event.end).toBe(null)

              let resources = arg.event.getResources()
              expect(resources.length).toBe(1)
              expect(resources[0].id).toBe('a')
            })),
        })

        let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid

        $('.external-event').simulate('drag', {
          localPoint: { left: '50%', top: 0 },
          end: dayGridWrapper.getDayEl('a', '2015-12-01'),
          callback() {
            expect(dropSpy).toHaveBeenCalled()
            expect(receiveSpy).toHaveBeenCalled()
            dragEl.remove()
            done()
          },
        })
      })
    })
  })
})
