import { describe, expect, it, vi } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

/*
Events in resourceTimeGrid/resourceDayGrid render in their resources' columns.
*/
describe('event rendering in resource columns', () => {
  const TUE = '2015-11-17'
  const WED = '2015-11-18'
  const options = {
    now: TUE,
    scrollTime: '00:00',
    views: {
      resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } },
      resourceDayGridTwoDay: { type: 'resourceDayGrid', duration: { days: 2 } },
    },
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }

  /*
  The event's rendered elements, foreground or background.
  */
  function getRenderedEls(calendar: Calendar, display: string): HTMLElement[] {
    return display === 'background' ? queryParts(calendar.el, 'backgroundEvent') : getEventEls(calendar.el, '1')
  }

  /*
  Checks that the element is in the column of (date, resource) and horizontally under its header cell
  (the bottom header row has one cell per column, whichever is on top).
  */
  function expectInColumn(calendar: Calendar, el: HTMLElement, date: string, resourceId: string) {
    const columns = new ResourceColumnsModel(calendar.el)
    const cellEls = columns.getHeaderCellElsByRow()
    const headerCellEl = cellEls[cellEls.length - 1].find((cellEl) => (
      cellEl.getAttribute('data-date') === date && cellEl.getAttribute('data-resource-id') === resourceId
    ))!
    const headerRect = headerCellEl.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2

    const columnEl = el.closest('[data-fc-part~="dayLane"], [data-fc-part~="dayCell"]')!
    expect([columnEl.getAttribute('data-date'), columnEl.getAttribute('data-resource-id')]).toEqual([date, resourceId])
    expect(centerX).toBeGreaterThan(headerRect.left)
    expect(centerX).toBeLessThan(headerRect.right)
  }

  describe.each(['auto', 'background'])('with display:%s', (display) => {
    it.each([
      ['resourceTimeGridTwoDay', false, 'ltr', { start: TUE + 'T01:00:00', end: TUE + 'T03:00:00' }],
      ['resourceTimeGridTwoDay', true, 'ltr', { start: TUE + 'T01:00:00', end: TUE + 'T03:00:00' }],
      ['resourceDayGridTwoDay', false, 'ltr', { start: TUE, end: WED }],
      ['resourceDayGridTwoDay', true, 'ltr', { start: TUE, end: WED }],
      ['resourceTimeGridTwoDay', true, 'rtl', { start: TUE + 'T01:00:00', end: TUE + 'T03:00:00' }],
      ['resourceDayGridTwoDay', false, 'rtl', { start: TUE, end: WED }],
    ])('renders a single-day event in its column, in %s with datesAboveResources:%s (%s)', async (initialView, datesAboveResources, direction, dates) => {
      const calendar = initCalendar({
        ...options,
        initialView,
        datesAboveResources,
        direction,
        events: [{ id: '1', title: 'event 1', resourceId: 'c', display, ...dates }],
      })
      await waitForSettle()
      const els = getRenderedEls(calendar, display)

      expect(els).toHaveLength(1)
      expectInColumn(calendar, els[0], TUE, 'c')
    })

    it.each([false, true])('splits a multi-day timed event by column, with datesAboveResources:%s', async (datesAboveResources) => {
      const eventDidMount = vi.fn()
      const calendar = initCalendar({
        ...options,
        initialView: 'resourceTimeGridTwoDay',
        datesAboveResources,
        events: [{ id: '1', title: 'event 1', start: TUE + 'T12:00:00', end: WED + 'T12:00:00', resourceId: 'c', display }],
        eventDidMount,
      })
      await waitForSettle()
      const els = getRenderedEls(calendar, display)

      expect(els).toHaveLength(2)
      expectInColumn(calendar, els[0], TUE, 'c')
      expectInColumn(calendar, els[1], WED, 'c')

      if (display === 'auto') {
        const infos = els.map((el) => eventDidMount.mock.calls.find(([info]) => info.el === el)![0])
        expect(infos.map((info) => [info.isStart, info.isEnd])).toEqual([[true, false], [false, true]])
      }
    })

    it('spans a multi-day all-day event across adjacent columns of its resource', async () => {
      const calendar = initCalendar({
        ...options,
        initialView: 'resourceDayGridTwoDay',
        datesAboveResources: false,
        events: [{ id: '1', title: 'event 1', start: TUE, end: '2015-11-19', resourceId: 'c', display }],
      })
      await waitForSettle()
      const els = getRenderedEls(calendar, display)
      const columns = new ResourceColumnsModel(calendar.el)
      const tueRect = columns.getDayCellEl(TUE, 'c').getBoundingClientRect()
      const wedRect = columns.getDayCellEl(WED, 'c').getBoundingClientRect()
      const rect = els[0].getBoundingClientRect()

      expect(els).toHaveLength(1)
      expect(rect.left).toBeLessThan(Math.min(tueRect.left, wedRect.left) + tueRect.width / 2)
      expect(rect.right).toBeGreaterThan(Math.max(tueRect.right, wedRect.right) - tueRect.width / 2)
    })

    it('splits a multi-day all-day event when dates are above resources', async () => {
      const calendar = initCalendar({
        ...options,
        initialView: 'resourceDayGridTwoDay',
        datesAboveResources: true,
        events: [{ id: '1', title: 'event 1', start: TUE, end: '2015-11-19', resourceId: 'c', display }],
      })
      await waitForSettle()
      const els = getRenderedEls(calendar, display)

      expect(els).toHaveLength(2)
      expectInColumn(calendar, els[0], TUE, 'c')
      expectInColumn(calendar, els[1], WED, 'c')
    })
  })

  describe('an event without resources', () => {
    it.each([
      ['resourceTimeGridTwoDay', { start: TUE + 'T01:00:00', end: TUE + 'T03:00:00' }],
      ['resourceDayGridTwoDay', { start: TUE, end: WED }],
    ])('renders as a background event in every resource\'s column, in %s', async (initialView, dates) => {
      const calendar = initCalendar({
        ...options,
        initialView,
        events: [
          { id: '1', title: 'event 1', display: 'background', ...dates },
          { id: '2', title: 'event 2', ...dates }, // foreground: not rendered
        ],
      })
      await waitForSettle()
      const bgEls = queryParts(calendar.el, 'backgroundEvent')

      expect(bgEls).toHaveLength(3)
      expect(bgEls.map((el) => el.closest('[data-resource-id]')!.getAttribute('data-resource-id'))).toEqual(['a', 'b', 'c'])
      expect(getEventEls(calendar.el)).toHaveLength(0)
    })
  })

  describe('an event with several resources', () => {
    const events = [{
      id: '1',
      title: 'event 1',
      start: TUE + 'T01:00:00',
      end: TUE + 'T05:00:00',
      resourceIds: ['a', 'b'],
    }]

    it('renders in each resource\'s column', () => {
      const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridDay', events })

      expect(getEventEls(calendar.el, '1').map((el) => el.closest('[data-resource-id]')!.getAttribute('data-resource-id')))
        .toEqual(['a', 'b'])
    })

    it('renders once without resource columns', () => {
      const calendar = initCalendar({
        ...options,
        initialView: 'timeGridTwoDay',
        views: { timeGridTwoDay: { type: 'timeGrid', duration: { days: 2 } } },
        events,
      })

      expect(getEventEls(calendar.el, '1')).toHaveLength(1)
    })
  })
})
