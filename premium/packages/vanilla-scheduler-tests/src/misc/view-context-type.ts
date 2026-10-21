import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

// the built-in view classes read no context (no contextType): their bodies subscribe instead
describe('premium views without a contextType', () => {
  for (const initialView of ['resourceDayGridWeek', 'resourceTimeGridWeek', 'timelineWeek', 'resourceTimelineWeek']) {
    it(`update on an option change in ${initialView}`, async () => {
      let calendar = initCalendar({
        initialView,
        initialDate: '2024-01-04',
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ title: 'event', start: '2024-01-04T10:00:00', resourceId: 'a' }],
      })

      await waitTimeout()
      expect(calendar.el.querySelectorAll('.probe-class').length).toBe(0)

      calendar.setOption('eventClass', () => 'probe-class')
      await waitTimeout()

      expect(calendar.el.querySelectorAll('.probe-class').length).toBeGreaterThan(0)
    })
  }
})
