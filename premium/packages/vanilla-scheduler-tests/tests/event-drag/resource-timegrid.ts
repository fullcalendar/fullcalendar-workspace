import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

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
