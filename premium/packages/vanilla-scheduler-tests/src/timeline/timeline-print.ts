import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

describe('timeline print', () => {
  for (let viewType of ['resourceTimelineDay', 'timelineDay']) {
    describe(`with ${viewType}`, () => {
      // the view's first render happens in print mode, before any screen layout has mounted
      it('renders when first shown while printing', async () => {
        let calendar = initCalendar({
          initialView: 'dayGridMonth',
          initialDate: '2020-08-09',
          resources: [{ id: 'a', title: 'Resource A' }],
          events: [{ title: 'Event A', start: '2020-08-09T06:00:00', resourceId: 'a' }],
        })

        try {
          calendar.trigger('_beforeprint')
          calendar.changeView(viewType)
          await waitTimeout()

          expect(calendar.el.textContent).toContain('Event A')
        } finally {
          calendar.trigger('_afterprint')
        }
      })
    })
  }
})
