import { describe, expect, it } from 'vitest'
import { Calendar } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { TimelineModel } from '../lib/models/timeline'

/*
Linking events to resources: EventApi::getResources/setResources, ResourceApi::getEvents, and the
lane each event renders in.
*/
describe('associating events with resources', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-07-11',
  }
  const resources = [
    { id: 'a', title: 'room a' },
    { id: 'b', title: 'room b' },
  ]
  const events = [
    { id: '1', title: 'event 1', resourceId: 'a', start: '2015-07-11T09:00:00' },
    { id: '2', title: 'event 2', resourceId: 'b', start: '2015-07-11T10:00:00' },
  ]

  /*
  Each event's resources and each resource's events, by title, plus the lanes each event renders in.
  */
  function summarize(calendar: Calendar, laneIds = ['a', 'b']) {
    const timeline = new TimelineModel(calendar.el)

    return {
      eventResources: calendar.getEvents().map((event) => [
        event.title,
        event.getResources().map((resource) => resource.title),
      ]),
      resourceEvents: calendar.getResources().map((resource) => [
        resource.title,
        resource.getEvents().map((event) => event.title),
      ]),
      eventCountsByLane: laneIds.map((laneId) => timeline.getEventEls(undefined, laneId).length),
    }
  }

  const EXPECTED = {
    eventResources: [['event 1', ['room a']], ['event 2', ['room b']]],
    resourceEvents: [['room a', ['event 1']], ['room b', ['event 2']]],
    eventCountsByLane: [1, 1],
  }

  it('links by string ids', async () => {
    const calendar = initCalendar({ ...options, resources, events })
    await waitForSettle()

    expect(summarize(calendar)).toEqual(EXPECTED)
  })

  it('links by integer ids, which become strings', async () => {
    const calendar = initCalendar({
      ...options,
      resources: [
        { id: 0 as any, title: 'room a' },
        { id: 1 as any, title: 'room b' },
      ],
      events: [
        { id: 0 as any, title: 'event 1', resourceId: 0 as any, start: '2015-07-11T09:00:00' },
        { id: 1 as any, title: 'event 2', resourceId: 1 as any, start: '2015-07-11T10:00:00' },
      ],
    })
    await waitForSettle()

    expect(summarize(calendar, ['0', '1'])).toEqual(EXPECTED)
    expect(calendar.getResourceById(0 as any)!.getEvents().map((event) => event.title)).toEqual(['event 1'])
    expect(calendar.getEventById(1 as any)!.getResources().map((resource) => resource.id)).toEqual(['1'])
  })

  it.each([
    ['resources', 'events'],
    ['events', 'resources'],
  ])('links once the %s arrive after the %s', async (late) => {
    const heldFetch = createHeldFetch(() => (late === 'resources' ? resources : events) as any[])
    const calendar = initCalendar({
      ...options,
      resources: late === 'resources' ? heldFetch.fetch : resources,
      events: late === 'events' ? heldFetch.fetch : events,
    })
    await waitForSettle()

    // (before the resources arrive, getResources gives null for each unknown resource id)
    expect(new TimelineModel(calendar.el).getEventEls()).toHaveLength(0)

    await heldFetch.releaseAll()

    expect(summarize(calendar)).toEqual(EXPECTED)
  })

  describe('EventApi::setResources', () => {
    const setResourcesOptions = {
      ...options,
      resources: [...resources, { id: 'c', title: 'room c' }],
      events: [{ id: '1', title: 'event 1', resourceId: 'a', start: '2015-07-11T09:00:00' }],
    }

    it.each([
      ['ids', () => ['b', 'c']],
      ['ResourceApi objects', (calendar: Calendar) => [calendar.getResourceById('b')!, calendar.getResourceById('c')!]],
    ])('accepts %s', async (_desc, buildInput) => {
      const calendar = initCalendar(setResourcesOptions)
      const event = calendar.getEventById('1')!

      event.setResources(buildInput(calendar))
      await waitForSettle()

      expect(event.getResources().map((resource) => resource.id)).toEqual(['b', 'c'])
      const timeline = new TimelineModel(calendar.el)
      expect(timeline.getEventEls('1', 'a')).toHaveLength(0)
      expect(timeline.getEventEls('1', 'b')).toHaveLength(1)
      expect(timeline.getEventEls('1', 'c')).toHaveLength(1)
    })
  })

  it('keeps an event\'s resources when another prop changes', () => {
    const calendar = initCalendar({
      ...options,
      resources,
      events: [{ id: '1', title: 'event 0', start: '2015-07-11', resourceIds: ['a', 'b'] }],
    })

    calendar.getEventById('1')!.setProp('title', 'cool')

    const event = calendar.getEventById('1')!
    expect(event.title).toBe('cool')
    expect(event.getResources().map((resource) => resource.id)).toEqual(['a', 'b'])
  })
})
