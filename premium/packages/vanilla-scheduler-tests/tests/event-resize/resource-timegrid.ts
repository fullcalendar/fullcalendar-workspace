import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

describe('event resizing in resource timeGrid', () => {
  const options = {
    initialView: 'resourceTimeGridTwoDay',
    views: { resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } } },
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  it('resizes an event without resources in a non-resource view', async () => {
    const eventResize = vi.fn()
    const calendar = initCalendar({
      ...options,
      initialView: 'timeGridWeek',
      events: [{ id: '1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00' }],
      eventResize,
    })
    await waitForSettle()

    await new TimeGridModel(calendar.el).resizeEvent('1', 'end', '2015-11-29T03:00', '2015-11-29T04:30')

    const info = eventResize.mock.calls[0][0]
    expect(info.event.endStr).toBe('2015-11-29T04:30:00Z')
    expect(info.event.getResources()).toEqual([])
  })

  // the two layouts order the columns differently
  describe.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('with %s', (_desc, datesAboveResources) => {
    const layoutOptions = {
      ...options,
      datesAboveResources,
      events: [{ id: '1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }],
    }

    it.each([
      ['on the same day', '2015-11-29T04:30', '2015-11-29T04:30:00Z'],
      ['onto the next day', '2015-11-30T04:30', '2015-11-30T04:30:00Z'],
    ])('resizes the end %s, keeping the resource', async (_desc, to, expectedEnd) => {
      const eventResize = vi.fn()
      const calendar = initCalendar({ ...layoutOptions, eventResize })
      await waitForSettle()

      await new TimeGridModel(calendar.el).resizeEvent(
        '1',
        'end',
        { date: '2015-11-29T03:00', resourceId: 'b' },
        { date: to, resourceId: 'b' },
      )

      const info = eventResize.mock.calls[0][0]
      expect(info.event.endStr).toBe(expectedEnd)
      expect(info.event.getResources().map((resource) => resource.id)).toEqual(['b'])
    })

    it('won\'t resize into another resource\'s column', async () => {
      const eventResizeStart = vi.fn()
      const eventResize = vi.fn()
      const calendar = initCalendar({ ...layoutOptions, eventResizeStart, eventResize })
      await waitForSettle()

      await new TimeGridModel(calendar.el).resizeEvent(
        '1',
        'end',
        { date: '2015-11-29T03:00', resourceId: 'b' },
        { date: '2015-11-29T04:00', resourceId: 'a' },
      )

      expect(eventResizeStart).toHaveBeenCalledOnce()
      expect(eventResize).not.toHaveBeenCalled()
    })
  })
})
