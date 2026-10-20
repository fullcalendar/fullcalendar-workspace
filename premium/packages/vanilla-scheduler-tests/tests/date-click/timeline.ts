import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'
import { DST_TIMELINE_OPTIONS, SPRING_FORWARD_DAY } from '../lib/dst'

describe('dateClick in timeline', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-11-28',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  it('reports the clicked time with no resource in a non-resource timeline', async () => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, initialView: 'timelineDay', dateClick })
    await waitForSettle()

    await new TimelineModel(calendar.el).clickDateTime('2015-11-28T04:30')

    const info = dateClick.mock.calls[0][0]
    expect(info.dateStr).toBe('2015-11-28T04:30:00Z')
    expect(info.jsEvent).toBeInstanceOf(MouseEvent)
    expect(info.resource).toBeFalsy()
  })

  it.each([
    ['ltr'],
    ['rtl'],
  ] as const)('reports the clicked time and resource (%s)', async (direction) => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, direction, dateClick })
    await waitForSettle()

    await new TimelineModel(calendar.el).clickDateTime({ date: '2015-11-28T04:30', resourceId: 'b' })

    const info = dateClick.mock.calls[0][0]
    expect(info.dateStr).toBe('2015-11-28T04:30:00Z')
    expect(info.resource.id).toBe('b')
  })

  it('reports nothing for a click below the resources', async () => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, dateClick })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const laneRect = timeline.getResourceLane('b').getBoundingClientRect()
    const point = { x: timeline.pointForDateTime('2015-11-28T04:30').x, y: laneRect.bottom + 10 }
    const hitEl = document.elementFromPoint(point.x, point.y)!
    expect(queryParts(calendar.el, 'resourceLane').some((el) => el.contains(hitEl))).toBe(false)
    expect(calendar.el.contains(hitEl)).toBe(true)

    await pointer.click(point)
    await waitForSettle()

    expect(dateClick).not.toHaveBeenCalled()
  })

  it('reports times at snapDuration granularity', async () => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, slotDuration: '00:30', snapDuration: '00:15', dateClick })
    await waitForSettle()

    await new TimelineModel(calendar.el).clickDateTime({ date: '2015-11-28T04:15', resourceId: 'b' })

    expect(dateClick.mock.calls[0][0].dateStr).toBe('2015-11-28T04:15:00Z')
  })

  it.each([
    ['day', 'resourceTimelineMonth', { days: 1 }, '2015-11-03'],
    ['week', 'resourceTimelineYear', { weeks: 1 }, '2015-01-18'],
  ])('reports untimed dates with %s-sized slots', async (_unit, view, slotDuration, date) => {
    const dateClick = vi.fn()
    const calendar = initCalendar({ ...options, initialView: view, initialDate: date, slotDuration, slotMinWidth: 50, dateClick })
    await waitForSettle()

    await new TimelineModel(calendar.el).clickDateTime({ date, resourceId: 'a' })

    const info = dateClick.mock.calls[0][0]
    expect(info.dateStr).toBe(date)
    expect(info.resource.id).toBe('a')
  })

  describe('across DST', () => {
    it.each([
      ['the first copy of a repeated wall-clock time, with its offset', {}, 3, '2024-11-03T05:30:00.000Z', '2024-11-03T01:30:00-04:00'],
      ['the second copy, one real hour later', {}, 5, '2024-11-03T06:30:00.000Z', '2024-11-03T01:30:00-05:00'],
      ['a time just after the spring-forward gap', { initialDate: SPRING_FORWARD_DAY }, 5, '2024-03-10T07:30:00.000Z', '2024-03-10T03:30:00-04:00'],
    ])('reports %s', async (_desc, moreOptions, slot, expectedInstant, expectedStr) => {
      const dateClick = vi.fn()
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, ...moreOptions, dateClick })
      await waitForSettle()

      await new TimelineModel(calendar.el).clickDateTime({ slot })

      const info = dateClick.mock.calls[0][0]
      expect(info.date.toISOString()).toBe(expectedInstant)
      expect(info.dateStr).toBe(expectedStr)
    })
  })
})
