import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { pointer, touchPointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'
import { DST_TIMELINE_OPTIONS, expectCloseTo } from '../lib/dst'

describe('selecting in timeline', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-11-28',
    scrollTime: '00:00',
    selectable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  it('selects with no resource in a non-resource timeline', async () => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'timelineDay', select })
    await waitForSettle()

    await new TimelineModel(calendar.el).selectRange('2015-11-28T04:00', '2015-11-28T07:30')

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe('2015-11-28T04:00:00Z')
    expect(info.endStr).toBe('2015-11-28T07:30:00Z')
    expect(info.jsEvent).toBeInstanceOf(MouseEvent)
    expect(info.resource).toBeFalsy()
  })

  it.each([
    ['in its lane (ltr)', 'ltr', 'b'],
    ['in its lane (rtl)', 'rtl', 'b'],
    ['even when the pointer strays into another lane', 'ltr', 'a'],
  ] as const)('selects a time range on the starting resource %s', async (_desc, direction, endResourceId) => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, direction, select })
    await waitForSettle()

    await new TimelineModel(calendar.el).selectRange(
      { date: '2015-11-28T04:00', resourceId: 'b' },
      { date: '2015-11-28T07:30', resourceId: endResourceId },
    )

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe('2015-11-28T04:00:00Z')
    expect(info.endStr).toBe('2015-11-28T07:30:00Z')
    expect(info.resource.id).toBe('b')
  })

  it('won\'t select when started below the resources', async () => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, select })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const y = timeline.getResourceLane('b').getBoundingClientRect().bottom + 10
    const start = { x: timeline.pointForDateTime('2015-11-28T04:00').x, y }
    const end = { x: timeline.pointForDateTime('2015-11-28T07:00').x, y }
    expect(queryParts(calendar.el, 'resourceLane').some((el) => el.contains(document.elementFromPoint(start.x, start.y)))).toBe(false)

    await pointer.press(start, async () => {
      await pointer.move(end)
      await waitForSettle()
    })
    await waitForSettle()

    expect(select).not.toHaveBeenCalled()
  })

  it('selects at snapDuration granularity', async () => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, slotDuration: '00:30', snapDuration: '00:15', select })
    await waitForSettle()

    await new TimelineModel(calendar.el).selectRange(
      { date: '2015-11-28T04:15', resourceId: 'b' },
      { date: '2015-11-28T07:45', resourceId: 'b' },
    )

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe('2015-11-28T04:15:00Z')
    expect(info.endStr).toBe('2015-11-28T07:45:00Z')
  })

  it.each([
    ['days with day-sized', 'resourceTimelineMonth', { days: 1 }, '2015-11-03', '2015-11-05'],
    ['weeks with week-sized', 'resourceTimelineYear', { weeks: 1 }, '2015-01-18', '2015-02-08'],
  ])('selects whole %s slots', async (_desc, view, slotDuration, start, end) => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, initialView: view, initialDate: start, slotDuration, slotMinWidth: 50, select })
    await waitForSettle()

    await new TimelineModel(calendar.el).selectRange({ date: start, resourceId: 'a' }, { date: end, resourceId: 'a' })

    const info = select.mock.calls[0][0]
    expect(info.startStr).toBe(start)
    expect(info.endStr).toBe(end)
    expect(info.resource.id).toBe('a')
  })

  it('selects after a long touch press', async () => {
    const select = vi.fn()
    const calendar = initCalendar({ ...options, longPressDelay: 50, select })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    await touchPointer.press(timeline.pointForDateTime({ date: '2015-11-28T04:00', resourceId: 'b' }), 150, async () => {
      await touchPointer.move(timeline.pointForSpotEnd({ date: '2015-11-28T07:30', resourceId: 'b' }))
      await waitForSettle()
    })
    await waitForSettle()

    const info = select.mock.calls[0][0]
    expect(info.endStr).toBe('2015-11-28T07:30:00Z')
    expect(info.resource.id).toBe('b')
  })

  it.each([
    ['selects when selectAllow returns true', true],
    ['doesn\'t select when selectAllow returns false', false],
  ])('%s, giving it the resource', async (_desc, isAllowed) => {
    const selectAllow = vi.fn(() => isAllowed)
    const select = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'resourceTimelineWeek', initialDate: '2016-09-04', selectAllow, select })
    await waitForSettle()

    await new TimelineModel(calendar.el).selectRange(
      { date: '2016-09-04T03:00', resourceId: 'b' },
      { date: '2016-09-04T06:00', resourceId: 'b' },
    )

    expect(selectAllow.mock.calls.at(-1)![0].resource.id).toBe('b')
    expect(select).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
  })

  /*
  Selections across DST report exact instants with the right offsets, and highlight exactly the
  dragged slots.
  */
  describe('across DST', () => {
    it('spans the fall-back fold with real instants and offsets', async () => {
      const select = vi.fn()
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, selectable: true, dragScroll: false, select })
      await waitForSettle()

      await new TimelineModel(calendar.el).selectRange({ slot: 2 }, { slot: 6 }) // first 01:00 -> 02:00

      const info = select.mock.calls[0][0]
      expect(info.start.toISOString()).toBe('2024-11-03T05:00:00.000Z') // 01:00 EDT
      expect(info.end.toISOString()).toBe('2024-11-03T07:00:00.000Z') // 02:00 EST, 2 real hours later
      expect(info.startStr).toBe('2024-11-03T01:00:00-04:00')
      expect(info.endStr).toBe('2024-11-03T02:00:00-05:00')
    })

    it('highlights exactly the dragged slots, including the second copy', async () => {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, selectable: true, dragScroll: false })
      await waitForSettle()

      const timeline = new TimelineModel(calendar.el)
      await timeline.selectRange({ slot: 4 }, { slot: 6 }) // the second 01:00 and 01:30

      const highlightRect = queryParts(calendar.el, 'highlight')[0].getBoundingClientRect()
      const slotRects = timeline.getSlotLanes().map((el) => el.getBoundingClientRect())
      expectCloseTo(highlightRect.left, slotRects[4].left)
      expectCloseTo(highlightRect.right, slotRects[5].right)
    })

    it('resolves select() with an ambiguous wall-clock time to the first copy', async () => {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, selectable: true })
      await waitForSettle()

      calendar.select('2024-11-03T01:00:00', '2024-11-03T02:00:00')
      await waitForSettle()

      const highlightRect = queryParts(calendar.el, 'highlight')[0].getBoundingClientRect()
      const slotRects = new TimelineModel(calendar.el).getSlotLanes().map((el) => el.getBoundingClientRect())
      expectCloseTo(highlightRect.left, slotRects[2].left)
      expectCloseTo(highlightRect.right, slotRects[6].left)
    })
  })
})
