import { describe, expect, it, vi } from 'vitest'
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
        eventDrop,
      })
      await waitForSettle()

      const resourceId = view === 'resourceTimeGridDay' ? 'a' : undefined
      await new TimeGridModel(calendar.el).dragEvent(
        '1',
        { date: '2016-02-14T01:00', resourceId },
        { date: '2016-02-14T04:00', resourceId },
      )

      expect(eventDrop).toHaveBeenCalledTimes(isAllowed ? 1 : 0)
    })
  })
})
