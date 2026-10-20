import { describe, expect, it, vi } from 'vitest'
import { CalendarOptions, EventInput } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls, isElVisible, queryPart, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import {
  clickExpander, expectElSpansSlots, expectElSpansTimes, getBackgroundEventEls, getResourceAreaRows,
  getResourceLane,
} from '../lib/models/timeline-layout'
import { DST_TIMELINE_OPTIONS, FALL_BACK_0200_SLOT, FALL_BACK_SECOND_0130_SLOT, SPRING_FORWARD_DAY } from '../lib/dst'

describe('event rendering in timeline', () => {
  const options: CalendarOptions = {
    initialView: 'resourceTimelineDay',
    now: '2015-10-17',
    scrollTime: '00:00',
    slotDuration: '00:30',
    resources: [{ id: 'a', title: 'Resource A' }],
  }

  interface ExpectedSeg {
    start: string
    end: string
    isStart: boolean
    isEnd: boolean
  }

  /*
  Renders one event (id '1', in resource 'a') and returns its rendered segment, checked against
  `expected`: its edges at slot boundaries, and isStart/isEnd as reported to render hooks.
  `expected` null means it doesn't render.
  */
  async function expectEventRendering(
    calendarOptions: CalendarOptions,
    event: EventInput,
    expected: ExpectedSeg | null,
  ): Promise<void> {
    const eventDidMount = vi.fn()
    const calendar = initCalendar({
      ...options,
      ...calendarOptions,
      events: [{ id: '1', resourceId: 'a', ...event }],
      eventDidMount,
    })
    await waitForSettle()

    expect(calendar.getEventById('1')).not.toBeNull() // parsed, even when not rendered
    const eventEls = getEventEls(calendar.el, '1')

    if (!expected) {
      expect(eventEls).toHaveLength(0)
      return
    }

    expect(eventEls).toHaveLength(1)
    expectElSpansTimes(calendar.el, eventEls[0], expected.start, expected.end)
    const info = eventDidMount.mock.calls.at(-1)![0]
    expect(info.isStart).toBe(expected.isStart)
    expect(info.isEnd).toBe(expected.isEnd)
  }

  describe('with time slots', () => {
    it.each([
      ['fits completely', '2015-10-17T02:00:00', '2015-10-17T06:00:00',
        { start: '2015-10-17T02:00', end: '2015-10-17T06:00', isStart: true, isEnd: true }],
      ['starts before the view', '2015-10-16T22:00:00', '2015-10-17T06:00:00',
        { start: '2015-10-17T00:00', end: '2015-10-17T06:00', isStart: false, isEnd: true }],
      ['ends after the view', '2015-10-17T02:00:00', '2015-10-18T02:00:00',
        { start: '2015-10-17T02:00', end: '2015-10-18T00:00', isStart: true, isEnd: false }],
      ['starts and ends outside the view', '2015-10-16T22:00:00', '2015-10-18T02:00:00',
        { start: '2015-10-17T00:00', end: '2015-10-18T00:00', isStart: false, isEnd: false }],
    ])('renders an event that %s', async (_desc, start, end, expected) => {
      await expectEventRendering({}, { start, end }, expected)
    })

    it('renders an event that starts before the view in RTL', async () => {
      await expectEventRendering(
        { direction: 'rtl' },
        { start: '2015-10-16T22:00:00', end: '2015-10-17T06:00:00' },
        { start: '2015-10-17T00:00', end: '2015-10-17T06:00', isStart: false, isEnd: true },
      )
    })

    it('renders an event in a timeline without resources', async () => {
      await expectEventRendering(
        { initialView: 'timelineDay' },
        { start: '2015-10-17T02:00:00', end: '2015-10-17T06:00:00' },
        { start: '2015-10-17T02:00', end: '2015-10-17T06:00', isStart: true, isEnd: true },
      )
    })

    it('renders an event at its wall-clock time in the local time zone', async () => {
      await expectEventRendering(
        { timeZone: 'local' },
        { start: '2015-10-17T02:00:00', end: '2015-10-17T06:00:00' },
        { start: '2015-10-17T02:00', end: '2015-10-17T06:00', isStart: true, isEnd: true },
      )
    })

    it.each([
      ['an event before slotMinTime on the same day', { slotMinTime: '09:00' },
        '2015-10-17T02:00:00', '2015-10-17T09:00:00', null],
      ['an event from the day before, cropped by slotMinTime', { slotMinTime: '03:00' },
        '2015-10-16T12:00:00', '2015-10-17T06:00:00',
        { start: '2015-10-17T03:00', end: '2015-10-17T06:00', isStart: false, isEnd: true }],
      ['an event on the same day, cropped by slotMinTime', { slotMinTime: '03:00' },
        '2015-10-17T02:00:00', '2015-10-17T06:00:00',
        { start: '2015-10-17T03:00', end: '2015-10-17T06:00', isStart: false, isEnd: true }],
      ['an event after slotMaxTime on the same day', { slotMaxTime: '18:00', scrollTime: '24:00' },
        '2015-10-17T18:00:00', '2015-10-17T23:00:00', null],
      ['an event ending the next day, cropped by slotMaxTime', { slotMaxTime: '21:00', scrollTime: '24:00' },
        '2015-10-17T19:00:00', '2015-10-18T02:00:00',
        { start: '2015-10-17T19:00', end: '2015-10-17T21:00', isStart: true, isEnd: false }],
      ['an event ending the same day, cropped by slotMaxTime', { slotMaxTime: '18:00', scrollTime: '24:00' },
        '2015-10-17T12:00:00', '2015-10-17T22:00:00',
        { start: '2015-10-17T12:00', end: '2015-10-17T18:00', isStart: true, isEnd: false }],
      ['an event within the hidden time between two days', {
        initialView: 'resourceTimelineTwoDay',
        views: { resourceTimelineTwoDay: { type: 'resourceTimeline', duration: { days: 2 } } },
        slotMinTime: '09:00',
        slotMaxTime: '17:00',
      }, '2015-10-17T17:00:00', '2015-10-18T09:00:00', null],
      ['an event within a slotMaxTime past midnight', { slotMinTime: '09:00', slotMaxTime: '28:00', scrollTime: '24:00' },
        '2015-10-17T08:00:00', '2015-10-18T02:00:00',
        { start: '2015-10-17T09:00', end: '2015-10-18T02:00', isStart: false, isEnd: true }],
      ['an event past a slotMaxTime past midnight', { slotMinTime: '09:00', slotMaxTime: '28:00', scrollTime: '24:00' },
        '2015-10-17T08:00:00', '2015-10-18T05:00:00',
        { start: '2015-10-17T09:00', end: '2015-10-18T04:00', isStart: false, isEnd: false }],
    ] as const)('renders %s', async (_desc, moreOptions, start, end, expected) => {
      await expectEventRendering(moreOptions, { start, end }, expected)
    })

    it('stacks a longer event above a shorter one', async () => {
      const calendar = initCalendar({
        ...options,
        events: [
          { id: 'short', resourceId: 'a', start: '2015-10-17T02:00:00', end: '2015-10-17T06:00:00' },
          { id: 'long', resourceId: 'a', start: '2015-10-17T02:00:00', end: '2015-10-17T08:00:00' },
        ],
      })
      await waitForSettle()

      const shortRect = getEventEls(calendar.el, 'short')[0].getBoundingClientRect()
      const longRect = getEventEls(calendar.el, 'long')[0].getBoundingClientRect()
      expect(longRect.bottom).toBeLessThanOrEqual(shortRect.top)
    })
  })

  describe('with day slots', () => {
    const dayOptions: CalendarOptions = {
      initialView: 'resourceTimelineThreeWeek', // Oct 11 - Nov 1
      views: {
        resourceTimelineThreeWeek: { type: 'resourceTimeline', duration: { weeks: 3 }, slotDuration: { days: 1 } },
      },
    }

    it.each([
      ['fits completely', {}, '2015-10-16', '2015-10-18',
        { start: '2015-10-16', end: '2015-10-18', isStart: true, isEnd: true }],
      ['starts before the view', {}, '2015-10-10', '2015-10-18',
        { start: '2015-10-11', end: '2015-10-18', isStart: false, isEnd: true }],
      ['ends after the view', {}, '2015-10-18', '2015-11-18',
        { start: '2015-10-18', end: '2015-11-01', isStart: true, isEnd: false }],
      ['starts and ends outside the view', {}, '2015-09-18', '2015-11-18',
        { start: '2015-10-11', end: '2015-11-01', isStart: false, isEnd: false }],
      ['is timed within one day, filling the day', {}, '2015-10-16T04:00:00', '2015-10-16T05:00:00',
        { start: '2015-10-16', end: '2015-10-17', isStart: true, isEnd: true }],
      ['ends before nextDayThreshold, excluding the last day', { nextDayThreshold: '02:00' },
        '2015-10-16T04:00:00', '2015-10-18T01:00:00',
        { start: '2015-10-16', end: '2015-10-18', isStart: true, isEnd: true }],
      ['ends after nextDayThreshold, including the last day', { nextDayThreshold: '02:00' },
        '2015-10-16T04:00:00', '2015-10-18T03:00:00',
        { start: '2015-10-16', end: '2015-10-19', isStart: true, isEnd: true }],
      // https://github.com/fullcalendar/fullcalendar-scheduler/issues/151
      ['spans whole days, regardless of slotMinTime/slotMaxTime', { slotMinTime: '09:00', slotMaxTime: '17:00' },
        '2015-10-16', '2015-10-18',
        { start: '2015-10-16', end: '2015-10-18', isStart: true, isEnd: true }],
    ])('renders an event that %s', async (_desc, moreOptions, start, end, expected) => {
      await expectEventRendering({ ...dayOptions, ...moreOptions }, { start, end }, expected)
    })
  })

  describe('with week slots', () => {
    const weekOptions: CalendarOptions = {
      initialView: 'resourceTimelineYearOfWeeks',
      views: {
        resourceTimelineYearOfWeeks: { type: 'resourceTimeline', duration: { weeks: 52 }, slotDuration: { weeks: 1 } },
      },
      slotHeaderFormat: { month: 'numeric', day: 'numeric' },
    }

    it.each([
      ['aligned with weeks', '2015-10-18', '2015-11-15', { start: '2015-10-18', end: '2015-11-15', isStart: true, isEnd: true }],
      ['not aligned with weeks, rounded out to whole weeks', '2015-10-19', '2015-11-17',
        { start: '2015-10-18', end: '2015-11-22', isStart: true, isEnd: true }],
    ])('renders an event %s', async (_desc, start, end, expected) => {
      await expectEventRendering(weekOptions, { start, end }, expected)
    })
  })

  describe('background events', () => {
    it.each<[string, CalendarOptions, string, string, string, string]>([
      ['time slots', {}, '2015-10-17T02:00:00', '2015-10-17T06:00:00', '2015-10-17T02:00', '2015-10-17T06:00'],
      ['time slots, cropped to the view', {}, '2015-10-16T22:00:00', '2015-10-18T02:00:00', '2015-10-17T00:00', '2015-10-18T00:00'],
      ['day slots', { initialView: 'resourceTimelineWeek', slotDuration: { days: 1 } },
        '2015-10-13', '2015-10-15', '2015-10-13', '2015-10-15'],
      ['time slots in RTL', { direction: 'rtl' }, '2015-10-17T02:00:00', '2015-10-17T06:00:00', '2015-10-17T02:00', '2015-10-17T06:00'],
    ])('renders in a resource lane with %s', async (_desc, moreOptions, start, end, expectedStart, expectedEnd) => {
      const calendar = initCalendar({
        ...options,
        ...moreOptions,
        events: [{ id: '1', resourceId: 'a', display: 'background', start, end }],
      })
      await waitForSettle()

      const bgEls = getBackgroundEventEls(getResourceLane(calendar.el, 'a'), '1')
      expect(bgEls).toHaveLength(1)
      expectElSpansTimes(calendar.el, bgEls[0], expectedStart, expectedEnd)
    })

    it('renders an event without resources across all resource lanes', async () => {
      const calendar = initCalendar({
        ...options,
        resources: [{ id: 'a', title: 'Resource A' }, { id: 'b', title: 'Resource B' }],
        events: [{ id: '1', display: 'background', start: '2015-10-17T02:00:00', end: '2015-10-17T06:00:00' }],
      })
      await waitForSettle()

      const bgEls = getBackgroundEventEls(calendar.el, '1')
      expect(bgEls).toHaveLength(1)
      expectElSpansTimes(calendar.el, bgEls[0], '2015-10-17T02:00', '2015-10-17T06:00')

      const bgRect = bgEls[0].getBoundingClientRect()
      expect(bgRect.top).toBeLessThanOrEqual(getResourceLane(calendar.el, 'a').getBoundingClientRect().top)
      expect(bgRect.bottom).toBeGreaterThanOrEqual(getResourceLane(calendar.el, 'b').getBoundingClientRect().bottom)
    })

    it.each([
      ['within the view, filling around it', '2015-10-17T02:00:00', '2015-10-17T06:00:00',
        [['2015-10-17T00:00', '2015-10-17T02:00'], ['2015-10-17T06:00', '2015-10-18T00:00']]],
      ['starting before the view, filling after it', '2015-10-16T22:00:00', '2015-10-17T06:00:00',
        [['2015-10-17T06:00', '2015-10-18T00:00']]],
      ['covering the whole view, filling nothing', '2015-10-16T22:00:00', '2015-10-18T02:00:00', []],
    ])('renders an inverse-background event %s', async (_desc, start, end, expectedRanges) => {
      const calendar = initCalendar({
        ...options,
        events: [{ id: '1', resourceId: 'a', display: 'inverse-background', start, end }],
      })
      await waitForSettle()

      expect(calendar.getEventById('1')).not.toBeNull()
      const bgEls = getBackgroundEventEls(getResourceLane(calendar.el, 'a'), '1')
        .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      expect(bgEls).toHaveLength(expectedRanges.length)
      expectedRanges.forEach(([rangeStart, rangeEnd], i) => {
        expectElSpansTimes(calendar.el, bgEls[i], rangeStart, rangeEnd)
      })
    })

    it('doesn\'t render a removed event again after collapsing and expanding its resource', async () => {
      const calendar = initCalendar({
        ...options,
        resources: [{ id: 'parent', title: 'Parent', children: [{ id: 'child', title: 'Child' }] }],
        events: [{ id: '1', resourceId: 'child', display: 'background', start: '2015-10-17T02:00:00', end: '2015-10-17T06:00:00' }],
      })
      await waitForSettle()
      expect(getBackgroundEventEls(calendar.el, '1')).toHaveLength(1)

      calendar.getEventById('1')!.remove()
      await waitForSettle()
      expect(getBackgroundEventEls(calendar.el, '1')).toHaveLength(0)

      const parentRow = getResourceAreaRows(calendar.el).find((row) => row.resourceId === 'parent')!
      await clickExpander(parentRow.el) // collapse
      expect(getResourceAreaRows(calendar.el).map((row) => row.resourceId)).toEqual(['parent'])
      await clickExpander(parentRow.el) // expand
      expect(getResourceAreaRows(calendar.el).map((row) => row.resourceId)).toEqual(['parent', 'child'])

      expect(getBackgroundEventEls(calendar.el, '1')).toHaveLength(0)
    })
  })

  describe('event heights', () => {
    function expectNoOverlap(els: HTMLElement[]): void {
      const rects = els.map((el) => el.getBoundingClientRect())

      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]
          const b = rects[j]
          const intersects = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
          expect(intersects, `events ${i} and ${j} overlap`).toBe(false)
        }
      }
    }

    // https://github.com/fullcalendar/fullcalendar/issues/5413
    it('stacks events of different heights without collisions', async () => {
      const calendar = initCalendar({
        initialView: 'timelineDay',
        initialDate: '2020-05-12',
        slotMinTime: '08:00:00',
        events: [
          { id: '2', start: '2020-05-12T08:00:00', end: '2020-05-12T22:00:00', title: 'event 2' },
          { id: '3', start: '2020-05-12T09:00:00', end: '2020-05-12T22:00:00', title: 'event 3' },
        ],
        eventContent(info) {
          return { html: info.event.title + (info.event.id === '2' ? '<br><br><br><br>' : '<br><br>') }
        },
      })
      await waitForSettle()

      const eventEls = getEventEls(calendar.el)
      expect(eventEls).toHaveLength(2)
      expectNoOverlap(eventEls)
    })

    // https://github.com/fullcalendar/fullcalendar/issues/6395
    it('stacks events of different heights without overlap in a resource lane', async () => {
      const calendar = initCalendar({
        initialDate: '2021-06-24',
        initialView: 'resourceTimelineDay',
        slotMinTime: '05:00',
        resources: [{ id: 'a', title: 'Auditorium A' }],
        eventContent: (info) => ({ html: info.event.title }),
        events: [
          { resourceId: 'a', title: 'event1', start: '2021-06-24T06:00:00+00:00', end: '2021-06-24T08:00:00+00:00' },
          { resourceId: 'a', title: '<div><div>event 2</div><div>line 2</div></div>', start: '2021-06-24T06:00:00+00:00', end: '2021-06-24T08:00:00+00:00' },
          { resourceId: 'a', title: 'event 3', start: '2021-06-24T09:00:00+00:00', end: '2021-06-24T10:00:00+00:00' },
          { resourceId: 'a', title: 'event 4', start: '2021-06-24T09:00:00+00:00', end: '2021-06-24T10:00:00+00:00' },
          { resourceId: 'a', title: '<div><div>event 5</div><div>line 2</div></div>', start: '2021-06-24T12:00:00+00:00', end: '2021-06-25T06:00:00+00:00' },
          { resourceId: 'a', title: '<div><div>event 6</div><div>line 2</div></div>', start: '2021-06-24T12:00:00+00:00', end: '2021-06-25T06:00:00+00:00' },
          { resourceId: 'a', title: '<div><div>event 7</div><div>line 2</div></div>', start: '2021-06-24T12:00:00+00:00', end: '2021-06-25T06:00:00+00:00' },
        ],
      })
      await waitForSettle()

      const visibleEventEls = getEventEls(calendar.el).filter(isElVisible)
      expect(visibleEventEls).toHaveLength(7)
      expectNoOverlap(visibleEventEls)
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5792
    it('grows the body of a timeline without resources to fit its events', async () => {
      const calendar = initCalendar({
        initialView: 'timelineDay',
        initialDate: '2018-12-13',
        contentHeight: 100,
        events: Array.from({ length: 10 }, () => ({ start: '2018-12-13T00:00:00' })),
      })
      await waitForSettle()

      const eventEls = getEventEls(calendar.el)
      expect(eventEls).toHaveLength(10)
      const bodyEl = queryPart(calendar.el, 'tableBody')!
      const eventsBottom = Math.max(...eventEls.map((el) => el.getBoundingClientRect().bottom))
      const eventsTop = Math.min(...eventEls.map((el) => el.getBoundingClientRect().top))
      expect(eventsBottom - eventsTop).toBeGreaterThan(110) // taller than contentHeight
      expect(bodyEl.scrollHeight).toBeGreaterThanOrEqual(Math.round(eventsBottom - eventsTop))
    })

    it('shrinks a resource lane back after its resources and events are removed and re-added', async () => {
      const resources = [
        { id: 'a', title: 'Space A' },
        { id: 'b', title: 'Space B' },
        { id: 'c', title: 'Space C' },
      ]
      const calendar = initCalendar({
        initialView: 'resourceTimelineWeek',
        initialDate: '2026-06-10',
        firstDay: 1,
        contentHeight: 800,
        expandRows: false,
        slotDuration: '24:00:00',
        resources,
        events: Array.from({ length: 6 }, (_, i) => (
          { resourceId: 'a', title: `Booking A${i}`, start: '2026-06-09', end: '2026-06-12' }
        )),
      })
      await waitForSettle()

      const tallLaneHeight = getResourceLane(calendar.el, 'a').offsetHeight
      expect(tallLaneHeight).toBeGreaterThan(getResourceLane(calendar.el, 'b').offsetHeight)

      calendar.getResources().forEach((resource) => resource.remove())
      await waitForSettle()
      calendar.removeAllEventSources() // must happen after the resources are removed
      await waitForSettle()
      resources.forEach((resource) => calendar.addResource(resource, false))
      await waitForSettle()

      const emptyLaneHeight = getResourceLane(calendar.el, 'a').offsetHeight
      expect(emptyLaneHeight).toBe(getResourceLane(calendar.el, 'b').offsetHeight)
      expect(emptyLaneHeight).toBeLessThan(tallLaneHeight)
    })
  })

  /*
  Each event element is wrapped by an unstyled list item, directly within a list.
  */
  describe('list semantics', () => {
    function expectInList(eventEl: HTMLElement): HTMLElement {
      const itemEl = eventEl.parentElement!
      expect(itemEl.getAttribute('role')).toBe('listitem')
      expect(itemEl.parentElement!.getAttribute('role')).toBe('list')
      return itemEl.parentElement!
    }

    it('puts the events of a timeline without resources in one labeled list', async () => {
      const calendar = initCalendar({
        initialView: 'timelineDay',
        initialDate: '2023-04-03',
        scrollTime: '00:00',
        events: [
          { title: 'a', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00' },
          { title: 'b', start: '2023-04-03T03:00:00', end: '2023-04-03T04:00:00' },
        ],
      })
      await waitForSettle()

      const eventEls = getEventEls(calendar.el)
      expect(eventEls).toHaveLength(2)
      const listEls = eventEls.map(expectInList)
      expect(listEls[0]).toBe(listEls[1])
      expect(listEls[0].getAttribute('aria-label')).toBe('Events')
    })

    it('puts each resource lane\'s events in an unlabeled list, only when it has events', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        initialDate: '2023-04-03',
        scrollTime: '00:00',
        resources: [{ id: 'a' }, { id: 'b' }],
        events: [
          { title: 'a1', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a2', start: '2023-04-03T03:00:00', end: '2023-04-03T04:00:00', resourceId: 'a' },
        ],
      })
      await waitForSettle()

      const eventEls = getEventEls(calendar.el)
      expect(eventEls).toHaveLength(2)
      const listEl = expectInList(eventEls[0])
      expectInList(eventEls[1])
      expect(listEl.hasAttribute('aria-label')).toBe(false)
      expect(getResourceLane(calendar.el, 'a').querySelectorAll('[role=list]')).toHaveLength(1)
      expect(getResourceLane(calendar.el, 'b').querySelectorAll('[role=list]')).toHaveLength(0)
    })

    it('puts the more-link in the list, and lists the popover\'s events', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        initialDate: '2023-04-03',
        scrollTime: '00:00',
        eventMaxStack: 1,
        resources: [{ id: 'a' }, { id: 'b' }],
        events: [
          { title: 'a1', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a2', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
          { title: 'a3', start: '2023-04-03T01:00:00', end: '2023-04-03T02:00:00', resourceId: 'a' },
        ],
      })
      await waitForSettle()

      const moreLinkEls = queryParts(calendar.el, 'moreLink')
      expect(moreLinkEls).toHaveLength(1)
      const moreItemEl = moreLinkEls[0].closest('[role=listitem]')!
      expect(moreItemEl).not.toBeNull()
      expect(moreItemEl.parentElement!.getAttribute('role')).toBe('list')

      await pointer.click(getRectCenter(moreLinkEls[0].getBoundingClientRect()))
      await waitForSettle()
      const popoverEventEls = getEventEls(queryPart(document, 'popover')!)
      expect(popoverEventEls).toHaveLength(2)
      popoverEventEls.forEach(expectInList)
    })
  })

  /*
  Events are positioned by their exact instants (real elapsed time), so events spanning a DST
  transition cover the right slots. On the fall-back day, the slots for 01:00-02:00 appear twice.
  */
  describe('across DST', () => {
    const FIRST_0130_SLOT = 3
    const SECOND_0100_SLOT = 4

    async function renderDstEvents(moreOptions: CalendarOptions) {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, ...moreOptions })
      await waitForSettle()
      return calendar
    }

    function expectEventSpansSlots(root: HTMLElement, eventId: string, startSlot: number, endSlot: number): void {
      const eventEls = getEventEls(root, eventId)
      expect(eventEls).toHaveLength(1)
      expectElSpansSlots(root, eventEls[0], startSlot, endSlot)
    }

    it.each([
      // civil 00:30-03:30, but 4 real hours on fall-back day
      ['spanning the fall-back transition', {}, '2024-11-03T00:30:00', '2024-11-03T03:30:00',
        '2024-11-03T04:30:00.000Z', 1, 9],
      // civil 01:30-03:30, but 1 real hour on spring-forward day
      ['spanning the spring-forward gap', { initialDate: SPRING_FORWARD_DAY }, '2024-03-10T01:30:00', '2024-03-10T03:30:00',
        '2024-03-10T06:30:00.000Z', 3, 5],
      // 02:30 doesn't exist. It resolves forward to 03:30
      ['starting at a nonexistent time', { initialDate: SPRING_FORWARD_DAY }, '2024-03-10T02:30:00', '2024-03-10T04:00:00',
        '2024-03-10T07:30:00.000Z', 5, 6],
      // offset-less input in the repeated hour means its first occurrence. 02:00 comes after both
      ['starting at a repeated wall-clock time without an offset, at the first copy', {}, '2024-11-03T01:30:00', '2024-11-03T02:00:00',
        '2024-11-03T05:30:00.000Z', FIRST_0130_SLOT, FALL_BACK_0200_SLOT],
    ])('renders an event %s with its real duration', async (_desc, moreOptions, start, end, startInstant, startSlot, endSlot) => {
      const calendar = await renderDstEvents({ ...moreOptions, events: [{ id: '1', start, end }] })
      expect(calendar.getEventById('1')!.start!.toISOString()).toBe(startInstant)
      expectEventSpansSlots(calendar.el, '1', startSlot, endSlot)
    })

    it('renders events with explicit offsets over the matching copy of the repeated hour', async () => {
      const calendar = await renderDstEvents({
        events: [
          { id: 'edt', start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00' },
          { id: 'est', start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' },
        ],
      })

      expectEventSpansSlots(calendar.el, 'edt', FIRST_0130_SLOT, SECOND_0100_SLOT)
      expectEventSpansSlots(calendar.el, 'est', FALL_BACK_SECOND_0130_SLOT, FALL_BACK_0200_SLOT)
    })

    it('renders Date and epoch-ms inputs at the instant they name', async () => {
      const calendar = await renderDstEvents({
        events: [
          { id: 'date', start: new Date('2024-11-03T06:30:00Z'), end: new Date('2024-11-03T07:00:00Z') },
          { id: 'ms', start: Date.parse('2024-11-03T06:30:00Z'), end: Date.parse('2024-11-03T07:00:00Z') },
        ],
      })

      expectEventSpansSlots(calendar.el, 'date', FALL_BACK_SECOND_0130_SLOT, FALL_BACK_0200_SLOT)
      expectEventSpansSlots(calendar.el, 'ms', FALL_BACK_SECOND_0130_SLOT, FALL_BACK_0200_SLOT)
    })

    it('reports the instants and offsets of events in both copies of the repeated hour', async () => {
      const calendar = await renderDstEvents({
        events: [
          { id: 'edt', start: '2024-11-03T01:00:00-04:00', end: '2024-11-03T01:30:00-04:00' },
          { id: 'est', start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' },
        ],
      })

      const edt = calendar.getEventById('edt')!
      const est = calendar.getEventById('est')!
      expect([edt.start!.toISOString(), edt.end!.toISOString()]).toEqual(['2024-11-03T05:00:00.000Z', '2024-11-03T05:30:00.000Z'])
      expect([edt.startStr, edt.endStr]).toEqual(['2024-11-03T01:00:00-04:00', '2024-11-03T01:30:00-04:00'])
      expect([est.start!.toISOString(), est.end!.toISOString()]).toEqual(['2024-11-03T06:30:00.000Z', '2024-11-03T07:00:00.000Z'])
      expect([est.startStr, est.endStr]).toEqual(['2024-11-03T01:30:00-05:00', '2024-11-03T02:00:00-05:00'])
    })

    /*
    05:30Z -> 06:00Z is 30 real minutes, but the end's wall-clock reading (01:00 EST) is before the
    start's (01:30 EDT).
    */
    it.each([
      ['given in the start\'s offset', '2024-11-03T02:00:00-04:00'],
      ['given as its own reading, as emitted', '2024-11-03T01:00:00-05:00'],
    ])('keeps an end that reads earlier than the start across the transition, %s', async (_desc, end) => {
      const calendar = await renderDstEvents({ events: [{ id: '1', start: '2024-11-03T01:30:00-04:00', end }] })

      const event = calendar.getEventById('1')!
      expect(event.start!.toISOString()).toBe('2024-11-03T05:30:00.000Z')
      expect(event.end!.toISOString()).toBe('2024-11-03T06:00:00.000Z')
      expect(event.startStr).toBe('2024-11-03T01:30:00-04:00')
      expect(event.endStr).toBe('2024-11-03T01:00:00-05:00')
      expectEventSpansSlots(calendar.el, '1', FIRST_0130_SLOT, SECOND_0100_SLOT)
    })

    it('formats such an end by its own reading, and sets a wall-clock end from it', async () => {
      const calendar = await renderDstEvents({
        events: [{ id: '1', start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00' }],
      })

      const event = calendar.getEventById('1')!
      const text = event.formatRange({ hour: '2-digit', minute: '2-digit', hour12: false })
      expect(text).toMatch(/01:30.*01:00/)
      expect(text).not.toContain('02:00') // the end as given

      event.setEnd('2024-11-03T03:00:00')
      expect(event.endStr).toBe('2024-11-03T03:00:00-05:00')
    })

    it('keeps exact instants across the spring-forward gap', async () => {
      const calendar = await renderDstEvents({
        initialDate: SPRING_FORWARD_DAY,
        events: [{ id: '1', start: '2024-03-10T01:30:00-05:00', end: '2024-03-10T04:00:00-04:00' }],
      })

      const event = calendar.getEventById('1')!
      expect(event.start!.toISOString()).toBe('2024-03-10T06:30:00.000Z')
      expect(event.end!.toISOString()).toBe('2024-03-10T08:00:00.000Z')
      expect([event.startStr, event.endStr]).toEqual(['2024-03-10T01:30:00-05:00', '2024-03-10T04:00:00-04:00'])
      expectEventSpansSlots(calendar.el, '1', 3, 6)
    })

    it('applies the default duration in real time from an exact start in the repeated hour', async () => {
      const calendar = await renderDstEvents({ events: [{ id: '1', start: '2024-11-03T01:00:00-05:00' }] })

      expectEventSpansSlots(calendar.el, '1', SECOND_0100_SLOT, FALL_BACK_0200_SLOT)
    })

    it.each([
      ['setDates', (event) => event.setDates('2024-11-03T01:30:00-05:00', '2024-11-03T02:00:00-05:00'),
        '2024-11-03T01:30:00-05:00', '2024-11-03T02:00:00-05:00', FALL_BACK_SECOND_0130_SLOT, FALL_BACK_0200_SLOT],
      ['setEnd', (event) => event.setEnd('2024-11-03T01:30:00-05:00'),
        '2024-11-03T00:30:00-04:00', '2024-11-03T01:30:00-05:00', 1, FALL_BACK_SECOND_0130_SLOT],
    ])('moves an edge onto the second copy with exact instants via %s', async (_desc, mutate, startStr, endStr, startSlot, endSlot) => {
      const calendar = await renderDstEvents({
        events: [{ id: '1', start: '2024-11-03T00:30:00', end: '2024-11-03T01:00:00' }],
      })

      const event = calendar.getEventById('1')!
      mutate(event)
      await waitForSettle()

      expect([event.startStr, event.endStr]).toEqual([startStr, endStr])
      expectEventSpansSlots(calendar.el, '1', startSlot, endSlot)
    })

    it('renders a recurring event in the repeated hour at the first copy', async () => {
      const calendar = await renderDstEvents({
        events: [{ id: '1', daysOfWeek: [0], startTime: '01:30', endTime: '02:00' }],
      })

      expect(calendar.getEvents()[0].startStr).toBe('2024-11-03T01:30:00-04:00')
      expectEventSpansSlots(calendar.el, '1', FIRST_0130_SLOT, FALL_BACK_0200_SLOT)
    })

    it('drops the instants when converting to all-day', async () => {
      const calendar = await renderDstEvents({
        events: [{ id: '1', start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' }],
      })

      const event = calendar.getEventById('1')!
      expect(event.startStr).toBe('2024-11-03T01:30:00-05:00')
      event.setAllDay(true)
      expect(event.allDay).toBe(true)
      expect(event.startStr).toBe('2024-11-03')
    })

    it.each([
      ['in UTC from the start', { timeZone: 'UTC' }, false, '2024-11-03T06:30:00Z', 13],
      ['after switching the timeZone to UTC', {}, true, '2024-11-03T06:30:00Z', 13],
    ])('renders exact-instant events %s', async (_desc, moreOptions, switchToUtc, startStr, utcSlot) => {
      const calendar = await renderDstEvents({
        ...moreOptions,
        events: [{ id: '1', start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' }],
      })

      if (switchToUtc) {
        expectEventSpansSlots(calendar.el, '1', FALL_BACK_SECOND_0130_SLOT, FALL_BACK_0200_SLOT)
        calendar.setOption('timeZone', 'UTC')
        await waitForSettle()
      }

      const event = calendar.getEventById('1')!
      expect(event.start!.toISOString()).toBe('2024-11-03T06:30:00.000Z')
      expect(event.startStr).toBe(startStr)
      expectEventSpansSlots(calendar.el, '1', utcSlot, utcSlot + 1)
    })

    it.each([
      ['an event in the first copy of the repeated hour as past during the second', '2024-11-03T06:15:00Z', true, false],
      ['the same event as future before it', '2024-11-03T04:15:00Z', false, true],
    ])('reports %s', async (_desc, now, isPast, isFuture) => {
      const eventDidMount = vi.fn()
      await renderDstEvents({
        now,
        events: [{ id: '1', start: '2024-11-03T01:00:00-04:00', end: '2024-11-03T01:30:00-04:00' }],
        eventDidMount,
      })

      const info = eventDidMount.mock.calls[0][0]
      expect({ isPast: info.isPast, isFuture: info.isFuture }).toEqual({ isPast, isFuture })
    })

    it('renders a background event spanning the transition with its real duration', async () => {
      const calendar = await renderDstEvents({
        events: [{ id: '1', start: '2024-11-03T00:30:00', end: '2024-11-03T03:30:00', display: 'background' }],
      })

      const bgEls = getBackgroundEventEls(calendar.el, '1')
      expect(bgEls).toHaveLength(1)
      expectElSpansSlots(calendar.el, bgEls[0], 1, 9)
    })
  })
})
