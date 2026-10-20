import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { DayGridModel } from '@fullcalendar-tests/standard/tests/lib/models/day-grid'
import { getEventEls } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

describe('event dragging in resource dayGrid', () => {
  const options = {
    initialView: 'resourceDayGridWeek',
    initialDate: '2015-11-29',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    events: [{ id: '1', start: '2015-11-30T12:00:00', resourceId: 'b' }],
  }

  // the two layouts order the columns differently
  it.each([
    ['resources above dates', false],
    ['dates above resources', true],
  ])('moves an event to another date and resource, keeping its time (%s)', async (_desc, datesAboveResources) => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, datesAboveResources, eventDrop })
    await waitForSettle()

    await new DayGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30', resourceId: 'b' },
      { date: '2015-12-01', resourceId: 'a' },
    )

    const info = eventDrop.mock.calls[0][0]
    expect(info.event.startStr).toBe('2015-12-01T12:00:00Z')
    expect(info.event.end).toBeNull()
    expect(info.event.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  it('moves an event to another resource in RTL', async () => {
    const calendar = initCalendar({ ...options, direction: 'rtl' })
    await waitForSettle()

    await new DayGridModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-30', resourceId: 'b' },
      { date: '2015-11-30', resourceId: 'a' },
    )

    expect(calendar.getEventById('1')!.getResources().map((resource) => resource.id)).toEqual(['a'])
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5593
  it('moves an event out of a more-link popover to another resource', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceDayGridMonth',
      dayMaxEvents: 0,
      events: [{ id: '1', start: '2015-11-10', resourceId: 'a' }],
    })
    await waitForSettle()

    const dayGrid = new DayGridModel(calendar.el)
    const popoverEl = await dayGrid.openMorePopover({ date: '2015-11-10', resourceId: 'a' })
    await pointer.press(getRectCenter(getEventEls(popoverEl, '1')[0].getBoundingClientRect()), async () => {
      await pointer.move(dayGrid.pointForDate({ date: '2015-11-18', resourceId: 'b' }))
      await waitForSettle()
    })
    await waitForSettle()

    const event = calendar.getEventById('1')!
    expect(event.startStr).toBe('2015-11-18')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['b'])
  })
})
