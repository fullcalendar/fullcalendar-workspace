import { describe, expect, it, vi } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getEventEls, queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'

/*
Event-related render hooks get the `resource` of the column or lane they render in. An event with
several resources renders once per resource, each copy with its own resource.
https://github.com/fullcalendar/fullcalendar/issues/4926
*/
describe('resource in event render hooks', () => {
  const options = {
    now: '2015-11-17',
    scrollTime: '00:00',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
  }

  function buildResourceClass(prefix: string, resource: { id: string } | undefined): string {
    return prefix + '-' + (resource ? resource.id : 'none')
  }

  function getContainerResourceId(el: Element): string | null {
    return el.closest('[data-resource-id]')!.getAttribute('data-resource-id')
  }

  /*
  Every element a hook classed must sit in the column/lane of the resource the hook was given.
  `filter` leaves out elements that legitimately have no resource.
  */
  function expectResourceClassesMatchContainers(prefix: string, filter = (_el: HTMLElement) => true) {
    for (const resourceId of ['a', 'b']) {
      const els = Array.from(document.querySelectorAll<HTMLElement>(`.${prefix}-${resourceId}`)).filter(filter)
      expect(els.length).toBeGreaterThan(0)

      for (const el of els) {
        expect(getContainerResourceId(el)).toBe(resourceId)
      }
    }

    expect(Array.from(document.querySelectorAll<HTMLElement>(`.${prefix}-none`)).filter(filter)).toHaveLength(0)
  }

  const timedEvent = { start: '2015-11-17T01:00:00', end: '2015-11-17T05:00:00', resourceIds: ['a', 'b'] }
  const allDayEvent = { start: '2015-11-17', allDay: true, resourceIds: ['a', 'b'] }

  describe.each([
    ['resourceTimeGrid, a timed event', { initialView: 'resourceTimeGridDay', events: [timedEvent] }],
    ['resourceTimeGrid, an all-day event', { initialView: 'resourceTimeGridDay', events: [allDayEvent] }],
    ['resourceDayGrid', { initialView: 'resourceDayGridDay', events: [timedEvent] }],
    ['resourceDayGrid, spanning several days', {
      initialView: 'resourceDayGridWeek',
      events: [{ start: '2015-11-16', end: '2015-11-19', resourceIds: ['a', 'b'] }],
    }],
    ['resourceTimeline', { initialView: 'resourceTimelineDay', events: [timedEvent] }],
  ])('for an event with several resources, in %s', (_desc, viewOptions) => {
    it('gives eventContent the rendered resource', () => {
      const eventContent = vi.fn()
      initCalendar({ ...options, ...viewOptions, eventContent })

      const resourceIds = new Set(eventContent.mock.calls.map(([info]) => (info.resource ? info.resource.id : 'none')))
      expect([...resourceIds].sort()).toEqual(['a', 'b'])
    })

    it('gives eventClass the resource of its column/lane', () => {
      initCalendar({ ...options, ...viewOptions, eventClass: (info) => buildResourceClass('event-res', info.resource) })

      expectResourceClassesMatchContainers('event-res')
    })

    it('gives eventDidMount the resource of its column/lane', () => {
      const eventDidMount = vi.fn()
      const calendar = initCalendar({ ...options, ...viewOptions, eventDidMount })

      const resourceIdsByEl = new Map(eventDidMount.mock.calls.map(([info]) => [info.el, info.resource ? info.resource.id : 'none']))
      const eventEls = getEventEls(calendar.el)
      expect(eventEls.map((el) => resourceIdsByEl.get(el))).toEqual(eventEls.map(getContainerResourceId))
      expect(eventEls.map(getContainerResourceId).sort()).toEqual(['a', 'b'])
    })

    it('gives eventTitleClass the resource of its column/lane', () => {
      initCalendar({ ...options, ...viewOptions, eventTitleClass: (info) => buildResourceClass('title-res', info.resource) })

      expectResourceClassesMatchContainers('title-res')
    })
  })

  const timedBgEvent = { ...timedEvent, display: 'background' }
  const allDayBgEvent = { ...allDayEvent, display: 'background' } // dayGrid only renders all-day background events

  it.each([
    ['resourceTimeGrid, a timed event', 'resourceTimeGridDay', timedBgEvent],
    ['resourceTimeGrid, an all-day event', 'resourceTimeGridDay', allDayBgEvent],
    ['resourceDayGrid', 'resourceDayGridDay', allDayBgEvent],
    ['resourceTimeline', 'resourceTimelineDay', timedBgEvent],
  ])('gives backgroundEventClass the resource of its column/lane, in %s', (_desc, initialView, event) => {
    initCalendar({
      ...options,
      initialView,
      events: [event],
      backgroundEventClass: (info) => buildResourceClass('bg-res', info.resource),
    })

    expectResourceClassesMatchContainers('bg-res')
  })

  describe.each([
    ['resourceTimeGrid, timed events', {
      initialView: 'resourceTimeGridDay',
      eventMaxStack: 1,
      events: [timedEvent, timedEvent, timedEvent].map((event) => ({ ...event, end: '2015-11-17T02:00:00' })),
    }],
    ['resourceTimeGrid, all-day events', {
      initialView: 'resourceTimeGridDay',
      dayMaxEvents: 1,
      events: [allDayEvent, allDayEvent, allDayEvent],
    }],
    ['resourceDayGrid', {
      initialView: 'resourceDayGridDay',
      dayMaxEvents: 1,
      events: [timedEvent, timedEvent, timedEvent].map((event) => ({ ...event, end: '2015-11-17T02:00:00' })),
    }],
    ['resourceTimeline', {
      initialView: 'resourceTimelineDay',
      eventMaxStack: 1,
      events: [timedEvent, timedEvent, timedEvent].map((event) => ({ ...event, end: '2015-11-17T02:00:00' })),
    }],
  ])('for events hidden behind a more-link, in %s', (_desc, viewOptions) => {
    // a hidden more-link probe, used for measuring, has no resource
    const isVisibleMoreLink = (el: HTMLElement) => el.closest('[aria-hidden="true"]') === null

    it('gives moreLinkClass the resource of its column/lane', async () => {
      initCalendar({ ...options, ...viewOptions, moreLinkClass: (info) => buildResourceClass('more-res', info.resource) })
      await waitForSettle()

      expectResourceClassesMatchContainers('more-res', isVisibleMoreLink)
    })

    it('gives moreLinkContent the resource', async () => {
      const moreLinkContent = vi.fn((info) => info.text)
      initCalendar({ ...options, ...viewOptions, moreLinkContent })
      await waitForSettle()

      const resourceIds = new Set(moreLinkContent.mock.calls.filter(([info]) => info.resource).map(([info]) => info.resource.id))
      expect([...resourceIds].sort()).toEqual(['a', 'b'])
    })

    it('gives the popover\'s event, day-header and day-cell hooks the resource', async () => {
      const calendar = initCalendar({
        ...options,
        ...viewOptions,
        eventClass: (info) => buildResourceClass('event-res', info.resource),
        dayHeaderClass: (info) => (info.inPopover ? buildResourceClass('header-res', info.resource) : ''),
        dayCellClass: (info) => (info.inPopover ? buildResourceClass('cell-res', info.resource) : ''),
      })
      await waitForSettle()
      const moreLinkEl = queryParts(calendar.el, 'moreLink').filter(isVisibleMoreLink)[0]
      const resourceId = getContainerResourceId(moreLinkEl)

      await pointer.click(getRectCenter(moreLinkEl.getBoundingClientRect()))
      await waitForSettle()
      const popoverEl = queryPart(document, 'popover')!
      const popoverEventEls = getEventEls(popoverEl)

      expect(popoverEventEls.length).toBeGreaterThan(0)
      for (const el of popoverEventEls) {
        expect(el.classList).toContain(`event-res-${resourceId}`)
      }
      expect(popoverEl.querySelectorAll(`.header-res-${resourceId}`)).toHaveLength(1)
      expect(popoverEl.querySelectorAll(`.cell-res-${resourceId}`)).toHaveLength(1)
    })
  })

  it.each(['timeGridDay', 'dayGridDay', 'timelineDay', 'listDay'])('leaves the resource undefined in %s', (initialView) => {
    const eventContent = vi.fn()
    initCalendar({ ...options, initialView, events: [timedEvent], eventContent })

    expect(eventContent).toHaveBeenCalled()
    expect(eventContent.mock.calls.every(([info]) => info.resource === undefined)).toBe(true)
  })
})
