import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { TimelineModel } from '../lib/models/timeline'

/*
Whether a drag can change an event's resource, separately from its dates. Tested on resource timeline.
*/
describe('eventResourceEditable', () => {
  const options = {
    initialView: 'resourceTimelineWeek',
    initialDate: '2016-09-04',
    scrollTime: '00:00',
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }
  const event = { id: '1', start: '2016-09-04T01:00:00', resourceId: 'b' }

  async function dragToResourceC(calendarOptions: object) {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, ...calendarOptions, eventDrop })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2016-09-04T01:00', resourceId: 'b' },
      { date: '2016-09-04T03:00', resourceId: 'c' },
    )

    expect(eventDrop).toHaveBeenCalledOnce()
    return eventDrop.mock.calls[0][0]
  }

  describe.each([
    ['the option', { eventResourceEditable: false, events: [event] }],
    ['the event source', { eventSources: [{ resourceEditable: false, events: [event] }] }],
    ['the event', { events: [{ ...event, resourceEditable: false }] }],
  ])('when not resource-editable via %s, but date-editable', (_desc, moreOptions) => {
    it('changes the time but keeps the resource', async () => {
      const info = await dragToResourceC({ editable: true, ...moreOptions })

      expect(info.event.startStr).toBe('2016-09-04T03:00:00Z')
      expect(info.event.getResources().map((resource) => resource.id)).toEqual(['b'])
      // https://github.com/fullcalendar/fullcalendar/issues/4943
      expect(info.oldResource).toBeNull()
      expect(info.newResource).toBeNull()
    })
  })

  describe.each([
    ['the option', { eventResourceEditable: true, events: [event] }],
    ['the event source', { eventSources: [{ resourceEditable: true, events: [event] }] }],
    ['the event', { events: [{ ...event, resourceEditable: true }] }],
  ])('when resource-editable via %s, but not date-editable', (_desc, moreOptions) => {
    it('changes the resource but keeps the time', async () => {
      const info = await dragToResourceC({ editable: false, ...moreOptions })

      expect(info.event.startStr).toBe('2016-09-04T01:00:00Z')
      expect(info.event.getResources().map((resource) => resource.id)).toEqual(['c'])
      expect(info.oldResource.id).toBe('b')
      expect(info.newResource.id).toBe('c')
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5166
  describe('set with setProp', () => {
    it.each([
      ['makes the resource editable', false, true, ['c']],
      ['makes the resource non-editable', true, false, ['b']],
    ])('%s', async (_desc, initialValue, newValue, expectedResourceIds) => {
      const warn = vi.spyOn(console, 'warn')
      const eventDrop = vi.fn()
      const calendar = initCalendar({
        ...options,
        editable: true,
        events: [{ ...event, resourceEditable: initialValue }],
        eventDrop,
      })
      await waitForSettle()

      calendar.getEventById('1')!.setProp('resourceEditable', newValue)
      expect(warn).not.toHaveBeenCalled()
      await waitForSettle()

      await new TimelineModel(calendar.el).dragEvent(
        '1',
        { date: '2016-09-04T01:00', resourceId: 'b' },
        { date: '2016-09-04T03:00', resourceId: 'c' },
      )

      const info = eventDrop.mock.calls[0][0]
      expect(info.event.startStr).toBe('2016-09-04T03:00:00Z')
      expect(info.event.getResources().map((resource) => resource.id)).toEqual(expectedResourceIds)
    })
  })
})
