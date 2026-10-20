import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

describe('event resizing in resource dayGrid', () => {
  const options = {
    initialView: 'resourceDayGridWeek',
    initialDate: '2015-11-29',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    events: [{ id: '1', start: '2015-11-30', resourceId: 'b' }],
  }

  describe.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('with %s', (_desc, datesAboveResources) => {
    it('extends the end by whole days, keeping the resource', async () => {
      const eventResize = vi.fn()
      const calendar = initCalendar({ ...options, datesAboveResources, eventResize })
      await waitForSettle()

      await new DayGridModel(calendar.el).resizeEvent(
        '1',
        'end',
        { date: '2015-11-30', resourceId: 'b' },
        { date: '2015-12-01', resourceId: 'b' },
      )

      const info = eventResize.mock.calls[0][0]
      expect(info.event.endStr).toBe('2015-12-02')
      expect(info.event.getResources().map((resource) => resource.id)).toEqual(['b'])
    })

    it('won\'t resize into another resource\'s column', async () => {
      const eventResizeStart = vi.fn()
      const eventResize = vi.fn()
      const calendar = initCalendar({ ...options, datesAboveResources, eventResizeStart, eventResize })
      await waitForSettle()

      await new DayGridModel(calendar.el).resizeEvent(
        '1',
        'end',
        { date: '2015-11-30', resourceId: 'b' },
        { date: '2015-12-01', resourceId: 'a' },
      )

      expect(eventResizeStart).toHaveBeenCalledOnce()
      expect(eventResize).not.toHaveBeenCalled()
      const event = calendar.getEventById('1')!
      expect(event.end).toBeNull()
      expect(event.getResources().map((resource) => resource.id)).toEqual(['b'])
    })
  })

  it('resizes an event without resources in the non-resource view dayGridWeek', async () => {
    const calendar = initCalendar({ ...options, initialView: 'dayGridWeek', events: [{ id: '1', start: '2015-11-30' }] })
    await waitForSettle()

    await new DayGridModel(calendar.el).resizeEvent('1', 'end', '2015-11-30', '2015-12-01')

    const event = calendar.getEventById('1')!
    expect(event.endStr).toBe('2015-12-02')
    expect(event.getResources()).toEqual([])
  })
})
