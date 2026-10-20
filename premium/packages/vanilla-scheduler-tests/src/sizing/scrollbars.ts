import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { areScrollbarsHidden } from '@fullcalendar-tests/standard/src/lib/env'
import { getVerticalScroller } from '@fullcalendar-tests/standard/src/lib/models/slots'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { getSlotEl, getSlotHeaderRows, getTimeAxisEdges } from '../lib/models/timeline-layout'
import { TimelineModel } from '../lib/models/timeline'

/*
When the body scrolls vertically, its scrollbar takes width that the header doesn't have. The layout
compensates so header cells stay aligned with the body's columns. Runs with scrollbars and without
(the browser and browser-no-scrollbars projects in the standard test package's vitest.config.base.ts).
*/
describe('header alignment with a vertical scrollbar', () => {
  it.each(['ltr', 'rtl'] as const)('aligns resource timeline\'s slot headers with its slots in %s', async (direction) => {
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2023-01-03',
      direction,
      height: 300,
      resources: Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, title: `resource ${i}` })),
    })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const slotLaneEls = timeline.getSlotLanes()
    const scrollerEl = getVerticalScroller(timeline.getResourceLane('r0'))
    expect(scrollerEl.offsetWidth - scrollerEl.clientWidth > 0).toBe(!areScrollbarsHidden)

    // scroll to the end, where the last slot meets the vertical scrollbar
    expect(scrollerEl.scrollWidth).toBeGreaterThan(scrollerEl.clientWidth)
    calendar.scrollToTime('24:00')
    await waitForSettle()
    expect(Math.abs(scrollerEl.scrollLeft)).toBe(scrollerEl.scrollWidth - scrollerEl.clientWidth)

    // each header cell spans whole slots (an hour of half-hour slots), so compare its edges with
    // its first and last slots' edges
    const rtl = direction === 'rtl'
    const headerEls = getSlotHeaderRows(calendar.el).at(-1)!
    const laneEdges = slotLaneEls.map((el) => getTimeAxisEdges(el, rtl))
    for (const headerEl of headerEls) {
      const date = headerEl.getAttribute('data-date')!
      const laneIndex = slotLaneEls.indexOf(getSlotEl(calendar.el, date))
      const headerEdges = getTimeAxisEdges(headerEl, rtl)
      expect(Math.abs(headerEdges.start - laneEdges[laneIndex].start), `${date} start`).toBeLessThanOrEqual(1)
    }
    const lastHeaderEdges = getTimeAxisEdges(headerEls.at(-1)!, rtl)
    expect(Math.abs(lastHeaderEdges.end - laneEdges.at(-1)!.end), 'last end').toBeLessThanOrEqual(1)
  })
})
