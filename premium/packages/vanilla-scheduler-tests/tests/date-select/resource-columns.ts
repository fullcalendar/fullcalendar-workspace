import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

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
    describe('in resource timeGrid', () => {
      const timeGridOptions = { ...options, initialView: 'resourceTimeGridThreeDay', datesAboveResources }

      it.each([
        ['on one day', '2015-11-30T04:00', '2015-11-30T07:30'],
        ['across days', '2015-11-29T04:00', '2015-11-30T07:30'],
      ])('selects slots of one resource %s', async (_desc, start, end) => {
        const select = vi.fn()
        const calendar = initCalendar({ ...timeGridOptions, select })
        await waitForSettle()

        await new TimeGridModel(calendar.el).selectRange({ date: start, resourceId: 'b' }, { date: end, resourceId: 'b' })

        const info = select.mock.calls[0][0]
        expect(info.startStr).toBe(start + ':00Z')
        expect(info.endStr).toBe(end + ':00Z')
        expect(info.resource.id).toBe('b')
      })

      it('won\'t select across resources', async () => {
        const select = vi.fn()
        const calendar = initCalendar({ ...timeGridOptions, select })
        await waitForSettle()

        await new TimeGridModel(calendar.el).selectRange(
          { date: '2015-11-30T04:00', resourceId: 'a' },
          { date: '2015-11-30T07:30', resourceId: 'b' },
        )

        expect(select).not.toHaveBeenCalled()
      })
    })

    describe('in resource dayGrid', () => {
      const dayGridOptions = { ...options, initialView: 'resourceDayGridThreeDay', datesAboveResources }

      it('selects days of one resource', async () => {
        const select = vi.fn()
        const calendar = initCalendar({ ...dayGridOptions, select })
        await waitForSettle()

        await new DayGridModel(calendar.el).selectDates({ date: '2015-11-29', resourceId: 'b' }, { date: '2015-11-30', resourceId: 'b' })

        const info = select.mock.calls[0][0]
        expect(info.startStr).toBe('2015-11-29')
        expect(info.endStr).toBe('2015-12-01')
        expect(info.resource.id).toBe('b')
      })

      it('won\'t select across resources', async () => {
        const select = vi.fn()
        const calendar = initCalendar({ ...dayGridOptions, select })
        await waitForSettle()

        await new DayGridModel(calendar.el).selectDates({ date: '2015-11-29', resourceId: 'a' }, { date: '2015-11-30', resourceId: 'b' })

        expect(select).not.toHaveBeenCalled()
      })
    })
  })
})
