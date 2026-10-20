import { describe, expect, it, vi } from 'vitest'
import { CalendarOptions, DateSpanApi, EventApi, EventInput } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { TimeGridModel } from '@fullcalendar-tests/standard/tests/lib/models/time-grid'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

describe('resource-aware constraints', () => {
  const timelineOptions = {
    initialView: 'resourceTimelineWeek',
    initialDate: '2016-09-04',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }

  async function dragToResource(calendarOptions: object, fromResourceId: string, toResourceId: string) {
    const eventDrop = vi.fn()
    const calendar = initCalendar({
      ...timelineOptions,
      events: [{ id: '1', title: 'event 1', start: '2016-09-04T01:00', resourceId: fromResourceId }],
      ...calendarOptions,
      eventDrop,
    })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2016-09-04T01:00', resourceId: fromResourceId },
      { date: '2016-09-04T03:00', resourceId: toResourceId },
    )

    const event = calendar.getEventById('1')!
    return { eventDrop, event, resourceIds: event.getResources().map((resource) => resource.id) }
  }

  it.each([true, false])('consults eventAllow with each resource hovered (returning %s)', async (returnValue) => {
    const eventAllow = vi.fn(() => returnValue)
    const { eventDrop, event, resourceIds } = await dragToResource({ eventAllow }, 'a', 'b')

    const hoveredResourceIds = eventAllow.mock.calls.map(([dropInfo]) => dropInfo.resource.id)
    expect(hoveredResourceIds).toContain('a')
    expect(hoveredResourceIds).toContain('b')
    expect(eventDrop).toHaveBeenCalledTimes(returnValue ? 1 : 0)
    expect(event.startStr).toBe(returnValue ? '2016-09-04T03:00:00Z' : '2016-09-04T01:00:00Z')
    expect(resourceIds).toEqual([returnValue ? 'b' : 'a'])
  })

  it.each([
    ['resourceId', { resourceId: 'b' }, 'b', true],
    ['resourceId', { resourceId: 'b' }, 'c', false],
    ['resourceIds', { resourceIds: ['b', 'c'] }, 'c', true],
    ['resourceIds', { resourceIds: ['b', 'c'] }, 'a', false],
  ])('with an eventConstraint %s, a drag to resource %s is allowed: %s', async (_desc, eventConstraint, toResourceId, isAllowed) => {
    const { eventDrop, resourceIds } = await dragToResource({ eventConstraint }, 'b', toResourceId)

    expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    expect(resourceIds).toEqual([isAllowed ? toResourceId : 'b'])
  })

  /*
  With eventOverlap:false, events only conflict with events of the same resource, even in a view
  without resource columns.
  */
  describe.each([
    ['resource columns', 'resourceTimeGridDay'],
    ['no resource columns', 'timeGridDay'],
  ])('eventOverlap:false with %s', (_desc, view) => {
    const dragged = { id: '1', resourceId: 'a', start: '2016-02-14T01:00:00', end: '2016-02-14T03:00:00' }
    const otherDates = { id: '2', start: '2016-02-14T04:00:00', end: '2016-02-14T06:00:00' }

    it.each([
      ['allows a drop onto an event of another resource', { ...otherDates, resourceId: 'b' }, true],
      ['disallows a drop onto an event of the same resource', { ...otherDates, resourceId: 'a' }, false],
      ['disallows a drop onto an event that also has the resource', { ...otherDates, resourceIds: ['a', 'b'] }, false],
      ['disallows a drop onto a background event without resources', { ...otherDates, display: 'background' }, false],
    ])('%s', async (_desc, otherEvent, isAllowed) => {
      const eventDragStart = vi.fn()
      const eventDrop = vi.fn()
      const calendar = initCalendar({
        initialView: view,
        initialDate: '2016-02-14',
        scrollTime: '00:00',
        editable: true,
        dragScroll: false,
        eventOverlap: false,
        resources: [{ id: 'a', title: 'Resource A' }, { id: 'b', title: 'Resource B' }],
        events: [dragged, otherEvent],
        eventDragStart,
        eventDrop,
      })
      await waitForSettle()

      const resourceId = view === 'resourceTimeGridDay' ? 'a' : undefined
      await new TimeGridModel(calendar.el).dragEvent(
        '1',
        { date: '2016-02-14T01:00', resourceId },
        { date: '2016-02-14T04:00', resourceId },
      )

      expect(eventDragStart).toHaveBeenCalledOnce()
      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    })
  })
})

/*
eventConstraint/eventOverlap/eventAllow set on a resource apply to the events in that resource. A drag
is checked against the resource it drops into (the event's resource after the drop). The resource's
constraints and allow functions add to the calendar's, and an event's own `overlap` overrides its
resource's eventOverlap.
*/
describe('resource-level eventConstraint, eventOverlap and eventAllow', () => {
  const day = '2016-09-05' // a Monday

  async function dragEvent(
    options: CalendarOptions,
    event: EventInput,
    grab: { date: string, resourceId: string },
    drop: { date: string, resourceId: string },
  ) {
    const eventDragStart = vi.fn()
    const eventDrop = vi.fn()
    const calendar = initCalendar({
      initialDate: day,
      scrollTime: '00:00',
      editable: true,
      dragScroll: false,
      ...options,
      events: [{ id: '1', ...event }, ...(options.events as EventInput[] || [])],
      eventDragStart,
      eventDrop,
    })
    await waitForSettle()

    const model = options.initialView === 'resourceTimelineDay'
      ? new TimelineModel(calendar.el)
      : new TimeGridModel(calendar.el)
    await model.dragEvent('1', grab, drop)

    expect(eventDragStart).toHaveBeenCalledOnce()
    const draggedEvent = calendar.getEventById('1')!
    return {
      eventDrop,
      startStr: draggedEvent.startStr,
      resourceIds: draggedEvent.getResources().map((resource) => resource.id),
    }
  }

  describe('eventConstraint', () => {
    const options = {
      initialView: 'resourceTimelineDay',
      scrollTime: '08:00',
      businessHours: true, // Mon-Fri 9-5
      resources: [
        { id: 'a', title: 'Resource A', eventConstraint: 'businessHours' },
        { id: 'b', title: 'Resource B' },
      ],
    }

    it.each([
      ['within resource a, inside business hours', true, 'a', 'a', '13:00'],
      ['within resource a, outside business hours', false, 'a', 'a', '18:00'],
      ['within resource b (no constraint), outside business hours', true, 'b', 'b', '18:00'],
      ['from resource b into a, outside business hours', false, 'b', 'a', '18:00'],
      ['from resource a into b, outside business hours', true, 'a', 'b', '18:00'],
    ])('a drag %s is allowed: %s', async (_desc, isAllowed, fromResourceId, toResourceId, toTime) => {
      const { eventDrop, startStr, resourceIds } = await dragEvent(
        options,
        { start: `${day}T10:00:00`, end: `${day}T11:00:00`, resourceId: fromResourceId },
        { date: `${day}T10:00`, resourceId: fromResourceId },
        { date: `${day}T${toTime}`, resourceId: toResourceId },
      )

      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      expect(startStr).toBe(isAllowed ? `${day}T${toTime}:00Z` : `${day}T10:00:00Z`)
      expect(resourceIds).toEqual([isAllowed ? toResourceId : fromResourceId])
    })

    it.each([
      ['satisfies both', true, '13:00'],
      ['violates only the calendar\'s', false, '09:00'],
      ['violates only the resource\'s', false, '18:00'],
    ])('applies along with the calendar\'s eventConstraint: a drop that %s is allowed: %s', async (_desc, isAllowed, toTime) => {
      const { eventDrop, startStr } = await dragEvent(
        { ...options, eventConstraint: { startTime: '12:00', endTime: '20:00' } },
        { start: `${day}T10:00:00`, end: `${day}T11:00:00`, resourceId: 'a' },
        { date: `${day}T10:00`, resourceId: 'a' },
        { date: `${day}T${toTime}`, resourceId: 'a' },
      )

      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      expect(startStr).toBe(isAllowed ? `${day}T${toTime}:00Z` : `${day}T10:00:00Z`)
    })
  })

  /*
  Drags event 1 (01:00-03:00) onto event 2 (04:00-06:00).
  */
  describe('eventOverlap', () => {
    const resources = [
      { id: 'a', title: 'Resource A', eventOverlap: false },
      { id: 'b', title: 'Resource B' },
    ]

    it.each([
      ['within resource a', false, 'a', 'a', {}, {}],
      ['within resource b (no eventOverlap)', true, 'b', 'b', {}, {}],
      ['from resource b into a', false, 'b', 'a', {}, {}],
      ['within resource a, both events with their own overlap:true', true, 'a', 'a', { overlap: true }, { overlap: true }],
      // the event underneath still has its resource's eventOverlap:false, which also prevents the drop
      ['within resource a, only the dragged event with overlap:true', false, 'a', 'a', { overlap: true }, {}],
    ])('a drop onto another event %s is allowed: %s', async (_desc, isAllowed, fromResourceId, toResourceId, draggedProps, otherProps) => {
      const { eventDrop, startStr, resourceIds } = await dragEvent(
        {
          initialView: 'resourceTimeGridDay',
          resources,
          events: [{ id: '2', start: `${day}T04:00:00`, end: `${day}T06:00:00`, resourceId: toResourceId, ...otherProps }],
        },
        { start: `${day}T01:00:00`, end: `${day}T03:00:00`, resourceId: fromResourceId, ...draggedProps },
        { date: `${day}T01:00`, resourceId: fromResourceId },
        { date: `${day}T04:00`, resourceId: toResourceId },
      )

      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      expect(startStr).toBe(isAllowed ? `${day}T04:00:00Z` : `${day}T01:00:00Z`)
      expect(resourceIds).toEqual([isAllowed ? toResourceId : fromResourceId])
    })
  })

  describe('eventAllow', () => {
    it.each([
      ['within resource c, its eventAllow returning true', true, 'c', 'c', true],
      ['within resource c, its eventAllow returning false', false, 'c', 'c', false],
      ['from resource a into c, its eventAllow returning false', false, 'a', 'c', false],
      ['from resource c into a (no eventAllow)', true, 'c', 'a', false],
    ])('a drag %s is allowed: %s', async (_desc, isAllowed, fromResourceId, toResourceId, resourceAllowResult) => {
      const resourceEventAllow = vi.fn((_dropInfo: DateSpanApi, _draggedEvent: EventApi | null) => resourceAllowResult)
      const calendarEventAllow = vi.fn((_dropInfo: DateSpanApi, _draggedEvent: EventApi | null) => true)
      const { eventDrop, startStr, resourceIds } = await dragEvent(
        {
          initialView: 'resourceTimelineDay',
          scrollTime: '08:00',
          resources: [
            { id: 'a', title: 'Resource A' },
            { id: 'c', title: 'Resource C', eventAllow: resourceEventAllow },
          ],
          eventAllow: calendarEventAllow,
        },
        { start: `${day}T10:00:00`, end: `${day}T11:00:00`, resourceId: fromResourceId },
        { date: `${day}T10:00`, resourceId: fromResourceId },
        { date: `${day}T13:00`, resourceId: toResourceId },
      )

      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
      expect(startStr).toBe(isAllowed ? `${day}T13:00:00Z` : `${day}T10:00:00Z`)
      expect(resourceIds).toEqual([isAllowed ? toResourceId : fromResourceId])

      // the resource's function is only consulted for drops into the resource, with the dragged event
      const resourceCalls = resourceEventAllow.mock.calls.map(([dropInfo, draggedEvent]) => ({
        resourceId: dropInfo.resource!.id,
        eventId: draggedEvent!.id,
      }))
      expect(resourceCalls.length > 0).toBe(toResourceId === 'c' || fromResourceId === 'c')
      for (const call of resourceCalls) {
        expect(call).toEqual({ resourceId: 'c', eventId: '1' })
      }

      // the calendar's eventAllow is consulted too, including over resource c
      expect(calendarEventAllow.mock.calls.map(([dropInfo]) => dropInfo.resource!.id)).toContain('c')
    })
  })
})
