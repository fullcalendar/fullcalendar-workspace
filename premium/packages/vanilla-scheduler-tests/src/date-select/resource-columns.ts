import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { DayGridModel } from '@fullcalendar-tests/standard/src/lib/models/day-grid'
import { TimeGridModel } from '@fullcalendar-tests/standard/src/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'

describe('selecting in resource columns', () => {
  const options = {
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    selectable: true,
    dragScroll: false,
    views: {
      resourceTimeGridThreeDay: { type: 'resourceTimeGrid', duration: { days: 3 } },
      resourceDayGridThreeDay: { type: 'resourceDayGrid', duration: { days: 3 } },
    },
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  // the two layouts order the columns differently
  describe.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('with %s', (_desc, datesAboveResources) => {
    /*
    Each cross-resource row has a same-resource twin that differs only in the end's resource,
    so a selection that never started can't pass as "disallowed".
    */
    it.each([
      ['on one day', 'b', 'b', '2015-11-30T04:00', '2015-11-30T07:30', false, true],
      ['across days', 'b', 'b', '2015-11-29T04:00', '2015-11-30T07:30', false, true],
      ['backwards across days', 'b', 'b', '2015-11-29T04:00', '2015-11-30T07:30', true, true],
      ['within resource A', 'a', 'a', '2015-11-29T04:00', '2015-11-30T07:30', false, true],
      ['from resource A into B', 'a', 'b', '2015-11-29T04:00', '2015-11-30T07:30', false, false],
    ])('in resource timeGrid, selects slots %s: %s -> %s', async (_desc, startResourceId, endResourceId, start, end, fromEnd, isAllowed) => {
      const select = vi.fn()
      const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridThreeDay', datesAboveResources, select })
      await waitForSettle()

      await new TimeGridModel(calendar.el).selectRange(
        { date: start, resourceId: startResourceId },
        { date: end, resourceId: endResourceId },
        { fromEnd },
      )

      expect(select).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      if (isAllowed) {
        const info = select.mock.calls[0][0]
        expect(info.startStr).toBe(start + ':00Z')
        expect(info.endStr).toBe(end + ':00Z')
        expect(info.resource.id).toBe(startResourceId)
      }
    })

    it.each([
      ['forwards', 'b', 'b', '2015-11-29', '2015-11-30', true],
      ['backwards', 'b', 'b', '2015-11-30', '2015-11-29', true],
      ['within resource A', 'a', 'a', '2015-11-29', '2015-11-30', true],
      ['from resource A into B', 'a', 'b', '2015-11-29', '2015-11-30', false],
    ])('in resource dayGrid, selects days %s: %s -> %s', async (_desc, startResourceId, endResourceId, first, last, isAllowed) => {
      const select = vi.fn()
      const calendar = initCalendar({ ...options, initialView: 'resourceDayGridThreeDay', datesAboveResources, select })
      await waitForSettle()

      await new DayGridModel(calendar.el).selectDates(
        { date: first, resourceId: startResourceId },
        { date: last, resourceId: endResourceId },
      )

      expect(select).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      if (isAllowed) {
        const info = select.mock.calls[0][0]
        expect(info.startStr).toBe('2015-11-29')
        expect(info.endStr).toBe('2015-12-01')
        expect(info.resource.id).toBe(startResourceId)
      }
    })
  })

  it.each([
    ['timeGridWeek', (calendar) => new TimeGridModel(calendar.el).selectRange('2015-11-30T04:00', '2015-11-30T07:30'), '2015-11-30T04:00:00Z'],
    ['dayGridWeek', (calendar) => new DayGridModel(calendar.el).selectDates('2015-11-30', '2015-12-01'), '2015-11-30'],
  ])('selects with no resource in the non-resource view %s', async (view, doSelect, expectedStart) => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, initialView: view, select })
    await waitForSettle()

    await doSelect(calendar)

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe(expectedStart)
    expect(info.resource).toBeUndefined()
  })
})
