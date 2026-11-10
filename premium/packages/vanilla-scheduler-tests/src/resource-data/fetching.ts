import { afterEach, describe, expect, it, vi } from 'vitest'
import fetchMock from 'fetch-mock'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls } from '@fullcalendar-tests/standard/src/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch, whenLoaded } from '../lib/fetching'
import { getTimelineResourceIds } from '../lib/models/resource-columns'

/*
Receiving resources: as an array, from a function, or from a JSON feed (fetch is mocked).
*/
describe('resource fetching', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2017-02-12',
  }

  function summarize(calendar: Calendar) {
    return calendar.getResources().map((resource) => ({ id: resource.id, title: resource.title }))
  }

  describe('as an array', () => {
    it('parses each resource', () => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { id: '1', title: 'room 1' },
          { id: '2', title: 'room 2' },
        ],
      })

      expect(summarize(calendar)).toEqual([
        { id: '1', title: 'room 1' },
        { id: '2', title: 'room 2' },
      ])
    })

    it('keeps only the first resource with a given id', () => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { id: '1', title: 'room 1' },
          { id: '2', title: 'room 2' },
          { id: '2', title: 'room 2 again' },
        ],
      })

      expect(summarize(calendar)).toEqual([
        { id: '1', title: 'room 1' },
        { id: '2', title: 'room 2' },
      ])
    })

    it('accepts resources without ids', async () => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { title: 'room 1' },
          { title: 'room 2' },
        ],
      })
      await waitForSettle()

      expect(summarize(calendar)).toEqual([
        { id: '', title: 'room 1' },
        { id: '', title: 'room 2' },
      ])
      expect(getTimelineResourceIds(calendar.el)).toHaveLength(2)
    })

    it.each([
      ['nested children', [
        { id: 'a', title: 'room a', children: [{ id: 'a1', title: 'room a1' }] },
      ]],
      ['flat children with a parentId', [
        { id: 'a', title: 'room a' },
        { id: 'a1', title: 'room a1', parentId: 'a' },
      ]],
    ])('builds the tree from %s', (_desc, resources) => {
      const calendar = initCalendar({ ...options, resources })

      const topLevel = calendar.getTopLevelResources()
      expect(topLevel.map((resource) => resource.title)).toEqual(['room a'])
      expect(topLevel[0].getChildren().map((resource) => resource.title)).toEqual(['room a1'])
    })

    it('parses event styling props', () => {
      const calendar = initCalendar({
        ...options,
        resources: [{
          id: '1',
          title: 'room 1',
          eventClass: 'niceevents',
          eventColor: 'red',
          eventContrastColor: 'green',
        }],
      })

      const resource = calendar.getResourceById('1')!
      expect(resource.eventClass).toBe('niceevents')
      expect(resource.eventColor).toBe('red')
      expect(resource.eventContrastColor).toBe('green')
    })

    it.each([
      ['unknown props', { something: 'cool' }],
      ['an explicit extendedProps', { extendedProps: { something: 'cool' } }],
    ])('puts %s in extendedProps', (_desc, props) => {
      const calendar = initCalendar({
        ...options,
        resources: [{ id: '1', title: 'room 1', ...props }],
      })

      expect(calendar.getResourceById('1')!.extendedProps).toEqual({ something: 'cool' })
    })
  })

  describe('from a function', () => {
    it('cycles the loading state around a synchronous success', () => {
      const loading = vi.fn()
      const calendar = initCalendar({
        ...options,
        loading,
        resources(_info, successCallback) {
          successCallback([{ id: 'a', title: 'room a' }])
        },
      })

      expect(summarize(calendar)).toEqual([{ id: 'a', title: 'room a' }])
      expect(loading.mock.calls).toEqual([[true], [false]])
    })

    it('cycles the loading state around a failure', () => {
      const loading = vi.fn()
      const resources = vi.fn((_info, _successCallback, failureCallback) => {
        failureCallback(new Error('nope'))
      })
      const calendar = initCalendar({ ...options, loading, resources })

      expect(resources).toHaveBeenCalledTimes(1)
      expect(calendar.getResources()).toEqual([])
      expect(loading.mock.calls).toEqual([[true], [false]])
    })

    it('accepts a returned promise', async () => {
      const calendar = initCalendar({
        ...options,
        resources: () => Promise.resolve([{ id: 'a', title: 'room a' }]),
      })
      await whenLoaded(calendar)

      expect(getTimelineResourceIds(calendar.el)).toEqual(['a'])
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5896
    it('reports loading once while both resources and events are pending', async () => {
      const loading = vi.fn()
      const heldResources = createHeldFetch(() => [])
      const heldEvents = createHeldFetch(() => [])
      initCalendar({
        ...options,
        loading,
        resources: heldResources.fetch,
        events: heldEvents.fetch,
      })

      expect(loading.mock.calls).toEqual([[true]])

      await heldResources.releaseAll()
      expect(loading.mock.calls).toEqual([[true]])

      await heldEvents.releaseAll()
      expect(loading.mock.calls).toEqual([[true], [false]])
    })

    // https://github.com/fullcalendar/fullcalendar/issues/7365
    it('leaves all-day events clickable once resources arrive in resource timeGrid', async () => {
      const eventClick = vi.fn()
      const heldResources = createHeldFetch(() => [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' },
      ])
      const calendar = initCalendar({
        initialView: 'resourceTimeGridDay',
        initialDate: '2023-09-20',
        editable: true,
        resources: heldResources.fetch,
        events: [{ id: '1', title: 'event', start: '2023-09-20', allDay: true, resourceId: 'a' }],
        eventClick,
      })
      await waitForSettle()
      await heldResources.releaseAll()

      const [eventEl] = getEventEls(calendar.el, '1')
      await pointer.click(getRectCenter(eventEl.getBoundingClientRect()))
      await waitForSettle()

      expect(eventClick).toHaveBeenCalledTimes(1)
      expect(eventClick.mock.calls[0][0].event.id).toBe('1')
    })
  })

  describe('from a JSON feed', () => {
    const FEED_URL = 'https://feed.test/my-feed.php'

    afterEach(() => {
      fetchMock.restore()
    })

    it('reads the resources, stringifying numeric ids', async () => {
      fetchMock.get(/my-feed\.php/, {
        body: [
          { id: 1, title: 'room 1' },
          { id: 2, title: 'room 2' },
        ],
      })
      const calendar = initCalendar({ ...options, resources: FEED_URL })
      await whenLoaded(calendar)

      expect(summarize(calendar)).toEqual([
        { id: '1', title: 'room 1' },
        { id: '2', title: 'room 2' },
      ])
      expect(getTimelineResourceIds(calendar.el)).toEqual(['1', '2'])
    })

    it('can use a POST request', async () => {
      fetchMock.post(/my-feed\.php/, { body: [{ id: 'a', title: 'room a' }] })
      const calendar = initCalendar({
        ...options,
        resources: { url: FEED_URL, method: 'POST' },
      })
      await whenLoaded(calendar)

      expect(summarize(calendar)).toEqual([{ id: 'a', title: 'room a' }])
      expect(fetchMock.calls()).toHaveLength(1)
      expect(fetchMock.lastOptions()!.method).toBe('POST')
    })
  })
})
