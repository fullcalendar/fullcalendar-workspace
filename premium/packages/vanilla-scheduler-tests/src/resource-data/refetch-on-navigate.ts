import { afterEach, describe, expect, it, vi } from 'vitest'
import fetchMock from 'fetch-mock'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls, getEventIdOfEl } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { createHeldFetch, whenLoaded } from '../lib/fetching'
import { getTimelineResourceTitles, ResourceColumnsModel } from '../lib/models/resource-columns'

describe('refetchResourcesOnNavigate', () => {
  const options = {
    refetchResourcesOnNavigate: true,
    now: '2016-12-04',
    scrollTime: '00:00',
    events: [
      { id: 'day1-a', title: 'event1', start: '2016-12-04T01:00:00', resourceId: 'a' },
      { id: 'day1-b', title: 'event2', start: '2016-12-04T02:00:00', resourceId: 'b' },
      { id: 'day2-a', title: 'event3', start: '2016-12-05T03:00:00', resourceId: 'a' },
      { id: 'day2-b', title: 'event4', start: '2016-12-05T04:00:00', resourceId: 'b' },
    ],
  }

  function buildResources(callNum: number) {
    return [
      { id: 'a', title: `resource a-${callNum}` },
      { id: 'b', title: `resource b-${callNum}` },
    ]
  }

  function getRenderedEventIds(calendar: Calendar): string[] {
    return getEventEls(calendar.el).map(getEventIdOfEl).sort()
  }

  describe.each([
    ['resource timeline', 'resourceTimelineDay', (calendar: Calendar) => getTimelineResourceTitles(calendar.el)],
    ['resource timeGrid', 'resourceTimeGridDay', (calendar: Calendar) => new ResourceColumnsModel(calendar.el).getResourceHeaderTitles()],
    ['resource dayGrid', 'resourceDayGridDay', (calendar: Calendar) => new ResourceColumnsModel(calendar.el).getResourceHeaderTitles()],
  ])('in %s', (_desc, initialView, getResourceTitles) => {
    it('refetches resources when navigating', async () => {
      const resources = vi.fn((_info, callback) => {
        callback(buildResources(resources.mock.calls.length))
      })
      const calendar = initCalendar({ ...options, initialView, resources })
      await waitForSettle()

      expect(getResourceTitles(calendar)).toEqual(['resource a-1', 'resource b-1'])
      expect(getRenderedEventIds(calendar)).toEqual(['day1-a', 'day1-b'])

      calendar.next()
      await waitForSettle()

      expect(resources).toHaveBeenCalledTimes(2)
      expect(getResourceTitles(calendar)).toEqual(['resource a-2', 'resource b-2'])
      expect(getRenderedEventIds(calendar)).toEqual(['day2-a', 'day2-b'])
    })

    it('waits for async resources before rendering events', async () => {
      const heldResources = createHeldFetch(buildResources)
      const calendar = initCalendar({ ...options, initialView, resources: heldResources.fetch })
      await waitForSettle()

      expect(heldResources.heldCallNums).toEqual([1])
      expect(getResourceTitles(calendar)).toEqual([])
      expect(getRenderedEventIds(calendar)).toEqual([])

      await heldResources.release(1)

      expect(getResourceTitles(calendar)).toEqual(['resource a-1', 'resource b-1'])
      expect(getRenderedEventIds(calendar)).toEqual(['day1-a', 'day1-b'])

      calendar.next()
      await waitForSettle()
      expect(heldResources.heldCallNums).toEqual([2])

      await heldResources.release(2)

      expect(getResourceTitles(calendar)).toEqual(['resource a-2', 'resource b-2'])
      expect(getRenderedEventIds(calendar)).toEqual(['day2-a', 'day2-b'])
    })

    it('refetches on each quick navigation and shows the latest response', async () => {
      const heldResources = createHeldFetch(buildResources)
      const calendar = initCalendar({ ...options, initialView, resources: heldResources.fetch })
      await heldResources.release(1)

      calendar.next()
      await waitForSettle()
      calendar.next() // before the previous refetch returns
      await waitForSettle()

      expect(heldResources.heldCallNums).toEqual([2, 3])

      await heldResources.releaseAll()

      expect(getResourceTitles(calendar)).toEqual(['resource a-3', 'resource b-3'])
    })

    it('ignores a stale response that arrives after the latest one', async () => {
      const heldResources = createHeldFetch(buildResources)
      const calendar = initCalendar({ ...options, initialView, resources: heldResources.fetch })
      await heldResources.release(1)

      calendar.next()
      await waitForSettle()
      calendar.next()
      await waitForSettle()

      await heldResources.release(3)
      expect(getResourceTitles(calendar)).toEqual(['resource a-3', 'resource b-3'])

      await heldResources.release(2)
      expect(getResourceTitles(calendar)).toEqual(['resource a-3', 'resource b-3'])
    })
  })

  it('refetches resources when switching views', async () => {
    const resources = vi.fn((_info, callback) => {
      callback(buildResources(resources.mock.calls.length))
    })
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimeGridDay',
      views: {
        resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } },
      },
      resources,
    })
    await waitForSettle()
    const columns = new ResourceColumnsModel(calendar.el)

    expect(columns.getResourceHeaderTitles()).toEqual(['resource a-1', 'resource b-1'])
    expect(getRenderedEventIds(calendar)).toEqual(['day1-a', 'day1-b'])

    calendar.changeView('resourceTimeGridTwoDay')
    await waitForSettle()

    expect(columns.getResourceHeaderTitles()).toEqual(['resource a-2', 'resource b-2'])
    expect(getRenderedEventIds(calendar)).toEqual(['day1-a', 'day1-b', 'day2-a', 'day2-b'])
  })

  it('restyles events by the refetched resources in a non-resource view', async () => {
    const heldResources = createHeldFetch((callNum) => [
      { id: 'a', eventClass: `resource-a-${callNum}` },
      { id: 'b', eventClass: `resource-b-${callNum}` },
    ])
    const calendar = initCalendar({ ...options, initialView: 'timeGridDay', resources: heldResources.fetch })
    await waitForSettle()

    function getEventClassesById() {
      return Object.fromEntries(getEventEls(calendar.el).map((el) => [
        getEventIdOfEl(el),
        Array.from(el.classList).filter((className) => className.startsWith('resource-')),
      ]))
    }

    // events don't know the resources' classNames yet
    expect(getEventClassesById()).toEqual({ 'day1-a': [], 'day1-b': [] })

    await heldResources.release(1)
    expect(getEventClassesById()).toEqual({ 'day1-a': ['resource-a-1'], 'day1-b': ['resource-b-1'] })

    calendar.next()
    await heldResources.release(2)
    expect(getEventClassesById()).toEqual({ 'day2-a': ['resource-a-2'], 'day2-b': ['resource-b-2'] })
  })

  describe('with a resources function', () => {
    const chicagoOptions = {
      ...options,
      initialView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',
    }

    function summarizeArgs(resources: ReturnType<typeof vi.fn>) {
      return resources.mock.calls.map(([info]) => ({
        start: info.start.toISOString(),
        end: info.end.toISOString(),
        startStr: info.startStr,
        endStr: info.endStr,
        timeZone: info.timeZone,
      }))
    }

    const FIRST_WEEK = {
      start: '2017-02-12T06:00:00.000Z',
      end: '2017-02-19T06:00:00.000Z',
      startStr: '2017-02-12T00:00:00-06:00',
      endStr: '2017-02-19T00:00:00-06:00',
      timeZone: 'America/Chicago',
    }
    const SECOND_WEEK = {
      start: '2017-02-19T06:00:00.000Z',
      end: '2017-02-26T06:00:00.000Z',
      startStr: '2017-02-19T00:00:00-06:00',
      endStr: '2017-02-26T00:00:00-06:00',
      timeZone: 'America/Chicago',
    }

    it('passes the view\'s range and time zone, before and after navigating', () => {
      const resources = vi.fn((_info, callback) => callback([]))
      const calendar = initCalendar({ ...chicagoOptions, resources })

      calendar.next()

      expect(summarizeArgs(resources)).toEqual([FIRST_WEEK, SECOND_WEEK])
    })

    it('passes the same range again on refetchResources', () => {
      const resources = vi.fn((_info, callback) => callback([]))
      const calendar = initCalendar({ ...chicagoOptions, resources })

      calendar.refetchResources()

      expect(summarizeArgs(resources)).toEqual([FIRST_WEEK, FIRST_WEEK])
    })

    it('passes no range when off, and doesn\'t refetch when navigating', () => {
      const resources = vi.fn((_info, callback) => callback([]))
      const calendar = initCalendar({ ...chicagoOptions, refetchResourcesOnNavigate: false, resources })

      calendar.next()

      expect(resources).toHaveBeenCalledTimes(1)
      expect(resources.mock.calls[0][0]).toEqual({})
    })
  })

  describe('with a JSON feed', () => {
    const FEED_URL = 'https://feed.test/my-feed.php'
    const feedOptions = {
      initialView: 'resourceTimelineWeek',
      now: '2017-02-12',
      timeZone: 'America/Chicago',
      refetchResourcesOnNavigate: true,
      resources: FEED_URL,
    }

    afterEach(() => {
      fetchMock.restore()
    })

    function lastRequestParams(): URLSearchParams {
      return new URL(fetchMock.lastUrl()!).searchParams
    }

    it('sends the range and time zone', async () => {
      fetchMock.get(/my-feed\.php/, { body: [] })
      const calendar = initCalendar(feedOptions)
      await whenLoaded(calendar)

      expect(Object.fromEntries(lastRequestParams())).toEqual({
        start: '2017-02-12T00:00:00-06:00',
        end: '2017-02-19T00:00:00-06:00',
        timeZone: 'America/Chicago',
      })
    })

    it('uses startParam, endParam and timeZoneParam', async () => {
      fetchMock.get(/my-feed\.php/, { body: [] })
      const calendar = initCalendar({
        ...feedOptions,
        startParam: 'mystart',
        endParam: 'myend',
        timeZoneParam: 'mytimezone',
      })
      await whenLoaded(calendar)

      expect(Object.fromEntries(lastRequestParams())).toEqual({
        mystart: '2017-02-12T00:00:00-06:00',
        myend: '2017-02-19T00:00:00-06:00',
        mytimezone: 'America/Chicago',
      })
    })

    it('sends no params when off', async () => {
      fetchMock.get(/my-feed\.php/, { body: [] })
      const calendar = initCalendar({ ...feedOptions, refetchResourcesOnNavigate: false })
      await whenLoaded(calendar)

      expect(fetchMock.calls()).toHaveLength(1)
      expect(lastRequestParams().toString()).toBe('')
    })
  })
})
