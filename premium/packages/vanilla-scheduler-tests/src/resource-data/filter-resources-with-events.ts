import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { getTimelineResourceIds, ResourceColumnsModel } from '../lib/models/resource-columns'

/*
filterResourcesWithEvents hides resources without events in the view's range.
For per-date filtering of resource columns (multi-day resourceTimeGrid/resourceDayGrid), see
filter-resources-with-events-columns.ts and filter-resources-with-events-placeholders.ts.
*/
describe('filterResourcesWithEvents', () => {
  const options = {
    now: '2016-12-04',
    scrollTime: '00:00',
    filterResourcesWithEvents: true,
  }
  const resources = [
    { id: 'a', title: 'resource a' },
    { id: 'b', title: 'resource b' },
    { id: 'c', title: 'resource c' },
    { id: 'd', title: 'resource d' },
  ]
  const eventsOfBAndD = [
    { title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' },
    { title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' },
  ]

  describe.each([
    ['resource timeline', 'resourceTimelineDay', (calendar: Calendar) => getTimelineResourceIds(calendar.el)],
    ['resource timeGrid', 'resourceTimeGridDay', (calendar: Calendar) => new ResourceColumnsModel(calendar.el).getResourceHeaderIds()],
  ])('in %s', (_desc, initialView, getRenderedResourceIds) => {
    it('shows only resources with events', async () => {
      const calendar = initCalendar({ ...options, initialView, resources, events: eventsOfBAndD })
      await waitForSettle()

      expect(getRenderedResourceIds(calendar)).toEqual(['b', 'd'])
      expect(getEventEls(calendar.el)).toHaveLength(2)
    })

    it('shows all resources when off', async () => {
      const calendar = initCalendar({
        ...options,
        initialView,
        resources,
        events: eventsOfBAndD,
        filterResourcesWithEvents: false,
      })
      await waitForSettle()

      expect(getRenderedResourceIds(calendar)).toEqual(['a', 'b', 'c', 'd'])
    })

    it('filters resources that arrive after the events', async () => {
      const heldResources = createHeldFetch(() => resources)
      const calendar = initCalendar({ ...options, initialView, resources: heldResources.fetch, events: eventsOfBAndD })
      await waitForSettle()

      expect(getRenderedResourceIds(calendar)).toEqual([])
      expect(getEventEls(calendar.el)).toHaveLength(0)

      await heldResources.releaseAll()

      expect(getRenderedResourceIds(calendar)).toEqual(['b', 'd'])
      expect(getEventEls(calendar.el)).toHaveLength(2)
    })

    it('filters resources that arrive before the events', async () => {
      const heldEvents = createHeldFetch(() => eventsOfBAndD)
      const calendar = initCalendar({ ...options, initialView, resources, events: heldEvents.fetch })
      await waitForSettle()

      expect(heldEvents.heldCallNums).toEqual([1])
      expect(getRenderedResourceIds(calendar)).toEqual([])
      expect(getEventEls(calendar.el)).toHaveLength(0)

      await heldEvents.releaseAll()

      expect(getRenderedResourceIds(calendar)).toEqual(['b', 'd'])
      expect(getEventEls(calendar.el)).toHaveLength(2)
    })
  })

  describe('in resource timeline', () => {
    const timelineOptions = { ...options, initialView: 'resourceTimelineDay' }

    it('shows a resource once an event is added to it', async () => {
      const calendar = initCalendar({
        ...timelineOptions,
        resources,
        events: [{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b' }],
      })
      await waitForSettle()
      expect(getTimelineResourceIds(calendar.el)).toEqual(['b'])

      calendar.addEvent({ title: 'event 2', start: '2016-12-04T02:00:00', resourceId: 'd' })
      await waitForSettle()

      expect(getTimelineResourceIds(calendar.el)).toEqual(['b', 'd'])
    })

    it('hides an added resource until it has an event', async () => {
      const calendar = initCalendar({ ...timelineOptions, resources, events: eventsOfBAndD })
      await waitForSettle()

      calendar.addResource({ id: 'e', title: 'resource e' })
      await waitForSettle()
      expect(calendar.getResourceById('e')).not.toBeNull()
      expect(getTimelineResourceIds(calendar.el)).toEqual(['b', 'd'])

      calendar.addEvent({ title: 'event 3', start: '2016-12-04T02:00:00', resourceId: 'e' })
      await waitForSettle()
      expect(getTimelineResourceIds(calendar.el)).toEqual(['b', 'd', 'e'])
    })

    it('shows the parents of a child with events, but not its siblings', async () => {
      const calendar = initCalendar({
        ...timelineOptions,
        resources: [
          { id: 'a', title: 'resource a' },
          {
            id: 'b',
            title: 'resource b',
            children: [
              { id: 'b1', title: 'resource b1' },
              { id: 'b2', title: 'resource b2' },
            ],
          },
        ],
        events: [{ title: 'event 1', start: '2016-12-04T01:00:00', resourceId: 'b2' }],
      })
      await waitForSettle()

      expect(getTimelineResourceIds(calendar.el)).toEqual(['b', 'b2'])
    })

    it('hides a resource whose events are only in other ranges', async () => {
      const calendar = initCalendar({
        ...timelineOptions,
        initialView: 'resourceTimelineWeek',
        initialDate: '2017-08-09',
        resources: [{ id: 'f', title: 'Auditorium F' }],
        events: [{ id: '5', resourceId: 'f', start: '2017-08-06T08:00:00', end: '2017-08-06T18:00:00' }],
      })
      await waitForSettle()
      expect(getTimelineResourceIds(calendar.el)).toEqual(['f'])

      calendar.next()
      await waitForSettle()

      expect(getTimelineResourceIds(calendar.el)).toEqual([])
    })
  })
})
