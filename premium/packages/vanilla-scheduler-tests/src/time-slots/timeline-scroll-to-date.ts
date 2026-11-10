import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'

describe('scrollToTime in a multi-day timeline', () => {
  it('scrolls to a duration of days from the view\'s start', async () => {
    const calendar = initCalendar({
      initialView: 'timelineMonth',
      initialDate: '2017-03-15',
      slotDuration: { hours: 12 },
    })
    await waitForSettle()

    calendar.scrollToTime({ days: 2 })
    await waitForSettle()

    const slotEl = queryParts(calendar.el, 'slotLane').find((el) => el.getAttribute('data-date') === '2017-03-03T00:00:00')!
    let scrollerEl = slotEl.parentElement!
    while (!(scrollerEl.scrollWidth > scrollerEl.clientWidth && getComputedStyle(scrollerEl).overflowX !== 'visible')) {
      scrollerEl = scrollerEl.parentElement!
    }

    expect(scrollerEl.scrollLeft).toBeGreaterThan(0)
    expect(Math.abs(slotEl.getBoundingClientRect().left - scrollerEl.getBoundingClientRect().left)).toBeLessThan(3)
  })
})
