import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

describe('dateClick in resource columns', () => {
  const options = {
    initialDate: '2015-11-29',
    scrollTime: '00:00',
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
    it('reports the clicked time and resource in resource timeGrid', async () => {
      const dateClick = vi.fn()
      const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridThreeDay', datesAboveResources, dateClick })
      await waitForSettle()

      await new TimeGridModel(calendar.el).clickDateTime({ date: '2015-11-30T09:00', resourceId: 'b' })

      const info = dateClick.mock.calls[0][0]
      expect(info.dateStr).toBe('2015-11-30T09:00:00Z')
      expect(info.allDay).toBe(false)
      expect(info.resource.id).toBe('b')
    })

    it('reports the clicked day and resource in resource dayGrid', async () => {
      const dateClick = vi.fn()
      const calendar = initCalendar({ ...options, initialView: 'resourceDayGridThreeDay', datesAboveResources, dateClick })
      await waitForSettle()

      await new DayGridModel(calendar.el).clickDate({ date: '2015-11-30', resourceId: 'b' })

      const info = dateClick.mock.calls[0][0]
      expect(info.dateStr).toBe('2015-11-30')
      expect(info.allDay).toBe(true)
      expect(info.resource.id).toBe('b')
    })
  })

  it.each([
    ['timeGridWeek', (calendar) => new TimeGridModel(calendar.el).clickDateTime('2015-11-30T09:00'), '2015-11-30T09:00:00Z'],
    ['dayGridWeek', (calendar) => new DayGridModel(calendar.el).clickDate('2015-11-30'), '2015-11-30'],
  ])('reports no resource in the non-resource view %s', async (view, doClick, expectedDateStr) => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, initialView: view, dateClick })
    await waitForSettle()

    await doClick(calendar)

    const info = dateClick.mock.calls[0][0]
    expect(info.dateStr).toBe(expectedDateStr)
    expect(info.resource).toBeUndefined()
  })

  it('reports the clicked all-day cell\'s resource in resource timeGrid', async () => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'resourceTimeGridThreeDay', dateClick })
    await waitForSettle()

    await new TimeGridModel(calendar.el).allDay.clickDate({ date: '2015-11-30', resourceId: 'a' })

    const info = dateClick.mock.calls[0][0]
    expect(info.dateStr).toBe('2015-11-30')
    expect(info.resource.id).toBe('a')
  })
})
