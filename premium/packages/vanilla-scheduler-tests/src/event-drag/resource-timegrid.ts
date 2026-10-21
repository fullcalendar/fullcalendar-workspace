import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { TimeGridModel } from '@fullcalendar-tests/standard/src/lib/models/time-grid'
import { queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
import { pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'

describe('event dragging in resource timeGrid', () => {
  const options = {
    initialView: 'resourceTimeGridWeek',
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    events: [{ id: '1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }],
  }

  describe.each([
    ['resourceTimeGridWeek', 'ltr', false],
    ['resourceTimeGridWeek', 'rtl', true],
    ['resourceTimeGridDay', 'ltr', false],
    ['resourceTimeGridDay', 'rtl', true],
  ] as const)('all-day boundary in %s %s (datesAboveResources=%s)', (initialView, direction, datesAboveResources) => {
    it.each([2, 9, 'center'] as const)('drops on the correct resource at %s px above the cell bottom', async (offset) => {
      const eventDrop = vi.fn()
      const calendar = initCalendar({
        ...options,
        initialView,
        direction,
        datesAboveResources,
        initialDate: '2015-11-30',
        eventDrop,
      })
      await waitForSettle()

      const grid = new TimeGridModel(calendar.el)
      const { point } = grid.pointForEventAt('1', { date: '2015-11-30T02:00', resourceId: 'b' })
      const date = initialView === 'resourceTimeGridDay' ? '2015-11-30' : '2015-12-01'
      const cell = grid.allDay.getDayCell({ date, resourceId: 'a' })
      const rect = cell.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = offset === 'center' ? rect.top + rect.height / 2 : rect.bottom - offset
      expect(cell.contains(document.elementFromPoint(x, y))).toBe(true)

      await pointer.press(point, async () => {
        const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
        for (let sweepY = divider.bottom + 4; sweepY > y; sweepY--) {
          await pointer.move({ x, y: sweepY }, 1)
          await waitForSettle()
        }
        await pointer.move({ x, y }, 1)
        await waitForSettle()
      })
      await waitForSettle()

      expect(eventDrop).toHaveBeenCalledOnce()
      const event = calendar.getEventById('1')!
      expect(event.startStr).toBe(date)
      expect(event.allDay).toBe(true)
      expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
    })
  })

  // the two layouts order the columns differently
  it.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('moves an event to another date, time and resource (%s)', async (_desc, datesAboveResources) => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, datesAboveResources, eventDrop })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-12-01T05:00', resourceId: 'a' },
    )

    const info = eventDrop.mock.calls[0][0]
    expect(info.event.startStr).toBe('2015-12-01T05:00:00Z')
    expect(info.event.endStr).toBe('2015-12-01T06:00:00Z')
    expect(info.oldResource.id).toBe('b')
    expect(info.newResource.id).toBe('a')
    expect(info.event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  it('moves an event to another resource in RTL', async () => {
    const calendar = initCalendar({ ...options, direction: 'rtl' })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-11-30T02:00', resourceId: 'a' },
    )

    const event = calendar.getEventById('1')!
    expect(event.startStr).toBe('2015-11-30T02:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  it('moves an event between resources but keeps its time when only the resource is editable', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimeGridDay',
      initialDate: '2015-11-30',
      eventStartEditable: false,
      eventResourceEditable: true,
    })
    await waitForSettle()

    await new TimeGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30T02:00', resourceId: 'b' },
      { date: '2015-11-30T05:00', resourceId: 'a' },
    )

    const event = calendar.getEventById('1')!
    expect(event.startStr).toBe('2015-11-30T02:00:00Z')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })
})
