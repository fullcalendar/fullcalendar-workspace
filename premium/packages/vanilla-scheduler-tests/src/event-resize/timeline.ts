import { describe, expect, it, vi } from 'vitest'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { TimelineModel } from '../lib/models/timeline'
import {
  DST_TIMELINE_OPTIONS, FALL_BACK_0200_SLOT, SPRING_FORWARD_DAY, expectCloseTo,
} from '../lib/dst'

describe('event resizing in timeline', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-11-28',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }
  const dates = { start: '2015-11-28T04:00:00', end: '2015-11-28T05:00:00' }
  const event = { id: '1', ...dates, resourceId: 'b' }

  function getResourceIds(calendar): string[] {
    return calendar.getEventById('1')!.getResources().map((resource) => resource.id).sort()
  }

  it('extends the end of an event without resources', async () => {
    const calendar = initCalendar({ ...options, initialView: 'timelineDay', events: [{ id: '1', ...dates }] })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    await timeline.resizeEvent('1', 'end', '2015-11-28T05:00', '2015-11-28T07:30')

    const resized = calendar.getEventById('1')!
    expect(resized.startStr).toBe('2015-11-28T04:00:00Z')
    expect(resized.endStr).toBe('2015-11-28T07:30:00Z')
    expect(resized.getResources()).toEqual([])
    expect(queryParts(calendar.el, 'highlight')).toHaveLength(0)
  })

  it.each([
    ['in its lane', 'b'],
    ['when the pointer strays into another lane', 'c'],
  ])('extends the end and keeps the resource %s', async (_desc, toResourceId) => {
    const calendar = initCalendar({ ...options, events: [event] })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T05:00', resourceId: 'b' },
      { date: '2015-11-28T07:30', resourceId: toResourceId },
    )

    expect(calendar.getEventById('1')!.endStr).toBe('2015-11-28T07:30:00Z')
    expect(getResourceIds(calendar)).toEqual(['b'])
  })

  it('extends the end of one occurrence of a multi-resource event, keeping all resources', async () => {
    const calendar = initCalendar({ ...options, events: [{ id: '1', ...dates, resourceIds: ['a', 'b'] }] })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T05:00', resourceId: 'b' },
      { date: '2015-11-28T07:30', resourceId: 'b' },
    )

    expect(calendar.getEventById('1')!.endStr).toBe('2015-11-28T07:30:00Z')
    expect(getResourceIds(calendar)).toEqual(['a', 'b'])
  })

  it('snaps to snapDuration rather than slotDuration', async () => {
    const calendar = initCalendar({ ...options, slotDuration: '00:30', snapDuration: '00:15', events: [event] })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T05:00', resourceId: 'b' },
      { date: '2015-11-28T07:45', resourceId: 'b' },
    )

    expect(calendar.getEventById('1')!.endStr).toBe('2015-11-28T07:45:00Z')
  })

  it('extends the end in RTL', async () => {
    const calendar = initCalendar({ ...options, direction: 'rtl', events: [event] })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T05:00', resourceId: 'b' },
      { date: '2015-11-28T07:30', resourceId: 'b' },
    )

    expect(calendar.getEventById('1')!.endStr).toBe('2015-11-28T07:30:00Z')
  })

  it.each([
    ['day', 'resourceTimelineMonth', { days: 1 }, { start: '2015-11-03' }, '2015-11-04', '2015-11-06'],
    ['week', 'resourceTimelineYear', { weeks: 1 }, { start: '2015-01-18', end: '2015-01-25' }, '2015-01-25', '2015-02-15'],
  ])('resizes by whole %ss with %s-sized slots', async (_unit, view, slotDuration, dates, from, to) => {
    const calendar = initCalendar({
      ...options,
      initialView: view,
      initialDate: dates.start,
      slotDuration,
      slotMinWidth: 50,
      events: [{ id: '1', ...dates, resourceId: 'a' }],
    })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent('1', 'end', { date: from, resourceId: 'a' }, { date: to, resourceId: 'a' })

    const resized = calendar.getEventById('1')!
    expect(resized.startStr).toBe(dates.start)
    expect(resized.endStr).toBe(to)
  })

  it('resizes with touch after a long press selects the event', async () => {
    const calendar = initCalendar({ ...options, longPressDelay: 50, events: [event] })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T05:00', resourceId: 'b' },
      { date: '2015-11-28T07:30', resourceId: 'b' },
      undefined,
      { holdMs: 150 },
    )

    expect(calendar.getEventById('1')!.endStr).toBe('2015-11-28T07:30:00Z')
    expect(getResourceIds(calendar)).toEqual(['b'])
  })

  // the mirror renders on press (eventDragMinDistance:0), then once per slot crossed
  it('passes the mirror through the event render hooks, once per changed hit', async () => {
    let mountCnt = 0
    let contentCnt = 0
    let unmountCnt = 0
    const calendar = initCalendar({
      ...options,
      eventDragMinDistance: 0,
      slotDuration: '01:00',
      snapDuration: '01:00',
      events: [{ id: '1', start: '2015-11-28T01:00:00', end: '2015-11-28T02:00:00', resourceId: 'a' }],
      eventDidMount: (info) => { mountCnt += Number(info.isMirror) },
      eventContent: (info) => { contentCnt += Number(info.isMirror) },
      eventWillUnmount: (info) => { unmountCnt += Number(info.isMirror) },
    })
    await waitForSettle()

    await new TimelineModel(calendar.el).resizeEvent(
      '1',
      'end',
      { date: '2015-11-28T02:00', resourceId: 'a' },
      { date: '2015-11-28T04:00', resourceId: 'a' },
    )

    expect(mountCnt).toBe(1 * strictModeFactor)
    expect(contentCnt).toBe(3 * strictModeFactor)
    expect(unmountCnt).toBe(1 * strictModeFactor)
  })

  /*
  Resizes change events by exact elapsed time, so an edge dropped across a DST transition lands right
  under the pointer.
  */
  describe('across DST', () => {
    async function resize(calendarOptions: object, edge: 'start' | 'end', fromSlot: number, toSlot: number) {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, editable: true, dragScroll: false, ...calendarOptions })
      await waitForSettle()

      const timeline = new TimelineModel(calendar.el)
      await timeline.resizeEvent('1', edge, { slot: fromSlot }, { slot: toSlot })

      const eventRect = timeline.getEventEls('1')[0].getBoundingClientRect()
      const slotRects = timeline.getSlotLanes().map((el) => el.getBoundingClientRect())
      return { event: calendar.getEventById('1')!, eventRect, slotRects }
    }

    it('extends an end across the fall-back transition by elapsed time', async () => {
      const { event, eventRect, slotRects } = await resize({
        events: [{ id: '1', start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00' }],
      }, 'end', 1, FALL_BACK_0200_SLOT)

      expect(event.start!.toISOString()).toBe('2024-11-03T04:00:00.000Z')
      expect(event.end!.toISOString()).toBe('2024-11-03T07:00:00.000Z')
      expectCloseTo(eventRect.right, slotRects[FALL_BACK_0200_SLOT].left)
    })

    it('moves a start back across the fall-back transition by elapsed time', async () => {
      const { event, eventRect, slotRects } = await resize({
        events: [{ id: '1', start: '2024-11-03T02:30:00', end: '2024-11-03T03:00:00' }],
      }, 'start', 7, 2) // to the first 01:00

      expect(event.start!.toISOString()).toBe('2024-11-03T05:00:00.000Z')
      expect(event.end!.toISOString()).toBe('2024-11-03T08:00:00.000Z')
      expectCloseTo(eventRect.left, slotRects[2].left)
    })

    it('extends an end across the spring-forward gap by elapsed time', async () => {
      const { event, eventRect, slotRects } = await resize({
        initialDate: SPRING_FORWARD_DAY,
        events: [{ id: '1', start: '2024-03-10T01:00:00', end: '2024-03-10T01:30:00' }],
      }, 'end', 3, 5) // to 03:30, just after the gap

      // only 1.5 real hours, though the wall-clock span reads 2.5
      expect(event.end!.toISOString()).toBe('2024-03-10T07:30:00.000Z')
      expectCloseTo(eventRect.right, slotRects[5].left)
    })
  })
})
