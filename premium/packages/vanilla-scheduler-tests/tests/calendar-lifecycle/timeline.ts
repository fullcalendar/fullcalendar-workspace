import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { getResourceAreaRows, getTimeScroller } from '../lib/models/timeline-layout'

describe('resource timeline rerendering', () => {
  it('doesn\'t rerender resources when navigating dates', async () => {
    const resourceCellContent = vi.fn()
    const calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2015-08-07',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' },
      ],
      resourceCellContent,
    })
    await waitForSettle()
    const origRowEls = getResourceAreaRows(calendar.el).map((row) => row.el)
    expect(resourceCellContent).toHaveBeenCalledTimes(3 * strictModeFactor)

    calendar.next()
    await waitForSettle()

    expect(calendar.view.currentStart.toISOString()).toBe('2015-08-08T00:00:00.000Z')
    expect(resourceCellContent).toHaveBeenCalledTimes(3 * strictModeFactor)
    expect(getResourceAreaRows(calendar.el).map((row) => row.el)).toEqual(origRowEls)
  })

  it.each([
    ['rendering again', (calendar: Calendar) => calendar.render(), 1],
    ['refetching events', (calendar: Calendar) => calendar.refetchEvents(), 2],
  ])('keeps the scroll position when %s', async (_desc, rerender, fetchCount) => {
    const resourceFetch = createHeldFetch(() => Array.from({ length: 26 }, (_, i) => ({ id: `r${i}`, title: `Auditorium ${i}` })))
    const eventFetch = createHeldFetch(() => [
      { id: '1', resourceId: 'r1', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00' },
      { id: '2', resourceId: 'r2', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00' },
    ])
    const calendar = initCalendar({
      now: '2015-08-07',
      scrollTime: '00:00',
      initialView: 'resourceTimelineDay',
      resources: resourceFetch.fetch,
      events: eventFetch.fetch,
    })
    await resourceFetch.releaseAll()
    await eventFetch.releaseAll()

    const scrollerEl = getTimeScroller(calendar.el)
    scrollerEl.scrollTop = 100
    scrollerEl.scrollLeft = 50
    await waitForSettle()
    expect([scrollerEl.scrollTop, scrollerEl.scrollLeft]).toEqual([100, 50])

    rerender(calendar)
    await eventFetch.releaseAll()

    expect(eventFetch.fetch).toHaveBeenCalledTimes(fetchCount)
    expect(getTimeScroller(calendar.el)).toBe(scrollerEl)
    expect([scrollerEl.scrollTop, scrollerEl.scrollLeft]).toEqual([100, 50])
  })
})
