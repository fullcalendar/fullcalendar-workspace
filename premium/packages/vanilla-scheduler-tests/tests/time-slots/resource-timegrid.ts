import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { createHeldFetch } from '../lib/fetching'

/*
Vertical scrolling of resource timeGrid's slots. With dayMinWidth, the columns also scroll
horizontally, which puts the slots in a different scroller arrangement than plain timeGrid.
*/
describe('scrollTime in resource timeGrid', () => {
  const options = {
    initialView: 'resourceTimeGridDay',
    initialDate: '2015-08-07',
    dayMinWidth: 300,
    height: 400, // short enough to scroll
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }

  function getSlotEl(calendar: Calendar, time: string): HTMLElement {
    return queryParts(calendar.el, 'slotLane').find((el) => el.getAttribute('data-time') === time)!
  }

  // the slots' vertical scroller
  function getScrollerEl(calendar: Calendar): HTMLElement {
    for (let el = getSlotEl(calendar, '00:00:00').parentElement; el; el = el.parentElement) {
      const { overflowY } = getComputedStyle(el)
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el
      }
    }
    throw new Error('No vertical scroller')
  }

  // how far the slot's top is below the top of the scroller's visible area
  function getSlotOffset(calendar: Calendar, time: string): number {
    const scrollerEl = getScrollerEl(calendar)
    return getSlotEl(calendar, time).getBoundingClientRect().top - scrollerEl.getBoundingClientRect().top - scrollerEl.clientTop
  }

  it.each([
    ['a string', '02:00:00'],
    ['an object', { hours: 2 }],
  ])('scrolls to it initially, given as %s', async (_desc, scrollTime) => {
    const calendar = initCalendar({ ...options, scrollTime })
    await waitForSettle()

    expect(getScrollerEl(calendar).scrollTop).toBeGreaterThan(0)
    expect(Math.abs(getSlotOffset(calendar, '02:00:00'))).toBeLessThan(3)
  })

  it('isn\'t reapplied when navigating with scrollTimeReset:false', async () => {
    const calendar = initCalendar({ ...options, scrollTime: '02:00:00', scrollTimeReset: false })
    await waitForSettle()
    const scrollerEl = getScrollerEl(calendar)
    scrollerEl.scrollTop = 99999
    const scrollTop = scrollerEl.scrollTop
    expect(Math.abs(getSlotOffset(calendar, '02:00:00'))).toBeGreaterThan(100)

    calendar.next()
    await waitForSettle()

    expect(getScrollerEl(calendar).scrollTop).toBe(scrollTop)
  })

  describe('keeps the scroll position', () => {
    async function initScrolled() {
      const heldResources = createHeldFetch(() => options.resources)
      const heldEvents = createHeldFetch(() => [
        { id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
        { id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
      ])
      const calendar = initCalendar({
        ...options,
        scrollTime: '00:00',
        resources: heldResources.fetch,
        events: heldEvents.fetch,
      })
      await heldResources.releaseAll()
      await heldEvents.releaseAll()
      getScrollerEl(calendar).scrollTop = 100
      return { calendar, heldEvents }
    }

    it('when render is called again', async () => {
      const { calendar } = await initScrolled()

      calendar.render()
      await waitForSettle()

      expect(getScrollerEl(calendar).scrollTop).toBe(100)
    })

    it('when events are refetched', async () => {
      const { calendar, heldEvents } = await initScrolled()

      calendar.refetchEvents()
      await heldEvents.releaseAll()

      expect(heldEvents.fetch).toHaveBeenCalledTimes(2)
      expect(getScrollerEl(calendar).scrollTop).toBe(100)
    })
  })
})
