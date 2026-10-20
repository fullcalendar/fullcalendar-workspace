import { describe, expect, it } from 'vitest'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

/*
Rerendering in resource timeline only calls the render hooks of what changed.
*/
describe('rerender counts in resource timeline', () => {
  it('calls render hooks only for what changed', async () => {
    const counts = {
      slotHeaderDidMount: 0,
      slotHeaderContent: 0,
      slotLaneDidMount: 0,
      resourceCellContent: 0,
      resourceLaneDidMount: 0,
      eventContent: 0,
    }
    function resetCounts() {
      for (const key in counts) {
        counts[key as keyof typeof counts] = 0
      }
    }
    function expectCounts(expected: typeof counts) {
      const scaled = Object.fromEntries(Object.entries(expected).map(([key, count]) => [key, count * strictModeFactor]))
      expect(counts).toEqual(scaled)
    }

    const calendar = initCalendar({
      initialDate: '2017-10-04',
      initialView: 'resourceTimelineDay',
      resources: [{ id: 'a', title: 'Resource A' }],
      events: [{ title: 'event 0', start: '2017-10-04', resourceId: 'a' }],
      slotHeaderDidMount() {
        counts.slotHeaderDidMount += 1
      },
      slotHeaderContent() {
        counts.slotHeaderContent += 1
      },
      slotLaneDidMount() {
        counts.slotLaneDidMount += 1
      },
      resourceCellContent() {
        counts.resourceCellContent += 1
        return true
      },
      resourceLaneDidMount() {
        counts.resourceLaneDidMount += 1
      },
      eventContent() {
        counts.eventContent += 1
      },
    })
    await waitForSettle()
    expectCounts({
      slotHeaderDidMount: 24,
      slotHeaderContent: 24,
      slotLaneDidMount: 48,
      resourceCellContent: 1,
      resourceLaneDidMount: 1,
      eventContent: 1,
    })

    // the event is out of the new range
    resetCounts()
    calendar.next()
    await waitForSettle()
    expectCounts({
      slotHeaderDidMount: 24,
      slotHeaderContent: 24,
      slotLaneDidMount: 48,
      resourceCellContent: 0,
      resourceLaneDidMount: 0,
      eventContent: 0,
    })

    resetCounts()
    calendar.addResource({ title: 'Resource B' })
    await waitForSettle()
    expectCounts({
      slotHeaderDidMount: 0,
      slotHeaderContent: 0,
      slotLaneDidMount: 0,
      resourceCellContent: 1,
      resourceLaneDidMount: 1,
      eventContent: 0,
    })

    // resizing relayouts without rerendering content
    resetCounts()
    calendar.el.style.width = '700px'
    await waitForSettle()
    expectCounts({
      slotHeaderDidMount: 0,
      slotHeaderContent: 0,
      slotLaneDidMount: 0,
      resourceCellContent: 0,
      resourceLaneDidMount: 0,
      eventContent: 0,
    })
    expect(calendar.el.getBoundingClientRect().width).toBe(700)
  })
})
