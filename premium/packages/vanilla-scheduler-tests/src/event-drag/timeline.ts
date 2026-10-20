import { describe, expect, it, vi } from 'vitest'
import { AllowFunc } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getRectCenter, pointer, touchPointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { getEventEls, queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import { TimelineModel } from '../lib/models/timeline'
import {
  DST_TIMELINE_OPTIONS, FALL_BACK_0200_SLOT, FALL_BACK_SECOND_0130_SLOT, SPRING_FORWARD_DAY, SPRING_FORWARD_0300_SLOT, expectCloseTo,
} from '../lib/dst'

describe('event dragging in timeline', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    initialDate: '2015-11-29',
    scrollTime: '00:00',
    editable: true,
    dragScroll: false,
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
    ],
  }
  const event = { id: '1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' }

  function getResourceIds(calendar, eventId: string): string[] {
    return calendar.getEventById(eventId)!.getResources().map((resource) => resource.id).sort()
  }

  it('moves an event to another time and resource', async () => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, events: [event], eventDrop })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-29T02:00', resourceId: 'b' },
      { date: '2015-11-29T05:00', resourceId: 'a' },
    )

    const info = eventDrop.mock.calls[0][0]
    expect(info.event.startStr).toBe('2015-11-29T05:00:00Z')
    expect(info.event.endStr).toBe('2015-11-29T06:00:00Z')
    expect(info.oldResource.id).toBe('b')
    expect(info.newResource.id).toBe('a')
    expect(getResourceIds(calendar, '1')).toEqual(['a'])
  })

  it('moves an event to another time within its resource', async () => {
    const eventDrop = vi.fn()
    const calendar = initCalendar({ ...options, events: [event], eventDrop })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-29T02:00', resourceId: 'b' },
      { date: '2015-11-29T05:00', resourceId: 'b' },
    )

    const info = eventDrop.mock.calls[0][0]
    expect(info.event.startStr).toBe('2015-11-29T05:00:00Z')
    expect(info.oldResource).toBeNull()
    expect(info.newResource).toBeNull()
    expect(getResourceIds(calendar, '1')).toEqual(['b'])
  })

  it('gives eventAllow the dragged event with its dates', async () => {
    const eventAllow = vi.fn<AllowFunc>(() => true)
    const calendar = initCalendar({ ...options, events: [event], eventAllow })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-29T02:00', resourceId: 'b' },
      { date: '2015-11-29T05:00', resourceId: 'a' },
    )

    expect(eventAllow).toHaveBeenCalled()
    const [dropInfo, draggedEvent] = eventAllow.mock.calls.at(-1)!
    expect(draggedEvent.startStr).toBe('2015-11-29T02:00:00Z')
    expect(dropInfo.startStr).toBe('2015-11-29T05:00:00Z')
    expect(dropInfo.resource.id).toBe('a')
  })

  it('moves an event to a time that has to be scrolled into view', async () => {
    const calendar = initCalendar({ ...options, events: [event] })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const scrollerRight = calendar.el.getBoundingClientRect().right
    expect(timeline.getSlotLanes()[40].getBoundingClientRect().left).toBeGreaterThan(scrollerRight) // 20:00 is off-screen

    await timeline.dragEvent(
      '1',
      { date: '2015-11-29T02:00', resourceId: 'b' },
      { date: '2015-11-29T20:00', resourceId: 'b' },
    )

    expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T20:00:00Z')
  })

  it('moves by the dropped time and resource in RTL', async () => {
    const calendar = initCalendar({ ...options, direction: 'rtl', events: [event] })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-29T02:00', resourceId: 'b' },
      { date: '2015-11-29T05:00', resourceId: 'a' },
    )

    expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T05:00:00Z')
    expect(getResourceIds(calendar, '1')).toEqual(['a'])
  })

  it('moves an event after a long touch press', async () => {
    const calendar = initCalendar({ ...options, longPressDelay: 50, events: [event] })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const { point } = timeline.pointForEventAt('1', { date: '2015-11-29T02:00', resourceId: 'b' })
    await touchPointer.press(point, 150, async () => {
      await touchPointer.move(timeline.pointForDateTime({ date: '2015-11-29T05:00', resourceId: 'a' }))
      await waitForSettle()
    })
    await waitForSettle()

    expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T05:00:00Z')
    expect(getResourceIds(calendar, '1')).toEqual(['a'])
  })

  // https://github.com/fullcalendar/fullcalendar/issues/3900
  it('moves an event past midnight when slotMaxTime extends past it', async () => {
    const calendar = initCalendar({
      ...options,
      slotDuration: '04:00',
      slotMaxTime: '36:00',
      events: [{ id: '1', start: '2015-11-29T20:00:00', end: '2015-11-29T24:00:00', resourceId: 'b' }],
    })
    await waitForSettle()

    await new TimelineModel(calendar.el).dragEvent(
      '1',
      { date: '2015-11-29T20:00', resourceId: 'b' },
      { date: '2015-11-30T04:00', resourceId: 'b' },
    )

    expect(calendar.getEventById('1')!.startStr).toBe('2015-11-30T04:00:00Z')
  })

  describe('an event with several resources', () => {
    const multiEvent = { id: '1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceIds: ['a', 'b'] }

    it.each([
      ['an unassigned resource, replacing the dragged occurrence\'s', 'c', ['b', 'c']],
      ['another of its resources, merging the occurrences', 'b', ['b']],
    ])('moves the dragged occurrence to %s', async (_desc, dropResourceId, expectedResourceIds) => {
      const calendar = initCalendar({ ...options, events: [multiEvent] })
      await waitForSettle()

      await new TimelineModel(calendar.el).dragEvent(
        '1',
        { date: '2015-11-29T02:00', resourceId: 'a' },
        { date: '2015-11-29T05:00', resourceId: dropResourceId },
      )

      expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T05:00:00Z')
      expect(getResourceIds(calendar, '1')).toEqual(expectedResourceIds)
    })

    it('restores all its resources with revert()', async () => {
      const eventDrop = vi.fn()
      const calendar = initCalendar({ ...options, events: [multiEvent], eventDrop })
      await waitForSettle()

      await new TimelineModel(calendar.el).dragEvent(
        '1',
        { date: '2015-11-29T02:00', resourceId: 'a' },
        { date: '2015-11-29T05:00', resourceId: 'c' },
      )
      expect(getResourceIds(calendar, '1')).toEqual(['b', 'c'])
      eventDrop.mock.calls[0][0].revert()

      expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T02:00:00Z')
      expect(getResourceIds(calendar, '1')).toEqual(['a', 'b'])
    })
  })

  it('moves events sharing a groupId by the same time, but only the dragged one to the new resource', async () => {
    const calendar = initCalendar({
      ...options,
      events: [
        { groupId: 'g', id: '1', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'a' },
        { groupId: 'g', id: '2', start: '2015-11-29T02:00:00', end: '2015-11-29T03:00:00', resourceId: 'b' },
      ],
    })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    const { point } = timeline.pointForEventAt('1', { date: '2015-11-29T02:00', resourceId: 'a' })
    await pointer.press(point, async () => {
      await pointer.move(timeline.pointForDateTime({ date: '2015-11-29T05:00', resourceId: 'c' }))
      await waitForSettle()
      expect(timeline.getMirrorEls()).toHaveLength(2)
    })
    await waitForSettle()

    expect(calendar.getEventById('1')!.startStr).toBe('2015-11-29T05:00:00Z')
    expect(getResourceIds(calendar, '1')).toEqual(['c'])
    expect(calendar.getEventById('2')!.startStr).toBe('2015-11-29T05:00:00Z')
    expect(getResourceIds(calendar, '2')).toEqual(['b'])
  })

  it('moves an event out of a more-link popover to another resource', async () => {
    const calendar = initCalendar({
      ...options,
      initialDate: '2021-05-07',
      eventMaxStack: 2,
      events: [
        { id: '1', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { id: '2', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' },
        { id: '3', start: '2021-05-07T00:00:00', end: '2021-05-07T01:00:00', resourceId: 'a' }, // in the popover
      ],
    })
    await waitForSettle()

    const timeline = new TimelineModel(calendar.el)
    await pointer.click(getRectCenter(queryPart(timeline.getResourceLane('a'), 'moreLink')!.getBoundingClientRect()))
    await waitForSettle()
    const popoverEventEl = getEventEls(queryPart(document, 'popover')!, '3')[0]
    await pointer.press(getRectCenter(popoverEventEl.getBoundingClientRect()), async () => {
      await pointer.move(timeline.pointForDateTime({ date: '2021-05-07T04:00', resourceId: 'c' }))
      await waitForSettle()
    })
    await waitForSettle()

    const event = calendar.getEventById('3')!
    expect(event.startStr).toBe('2021-05-07T04:00:00Z')
    expect(getResourceIds(calendar, '3')).toEqual(['c'])
  })

  /*
  Drags move events by exact elapsed time (slots dragged x real slot duration), not wall-clock
  arithmetic, so a drop across a DST transition lands right under the pointer.
  */
  describe('across DST', () => {
    const dstEvent = { id: '1', start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00' }

    async function dragToSlot(calendarOptions: object, slotIndex: number, resourceId?: string) {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, editable: true, dragScroll: false, ...calendarOptions })
      await waitForSettle()

      const timeline = new TimelineModel(calendar.el)
      const grabDate = (calendar.getEventById('1')!.startStr).slice(0, 16)
      await timeline.dragEvent('1', { date: grabDate, resourceId }, () => timeline.pointForSlot(slotIndex, resourceId))

      const event = calendar.getEventById('1')!
      const eventLeft = timeline.getEventEls('1')[0].getBoundingClientRect().left
      const slotLeft = timeline.getSlotLanes()[slotIndex].getBoundingClientRect().left
      return { event, eventLeft, slotLeft }
    }

    it('moves across the fall-back transition by elapsed time', async () => {
      const { event, eventLeft, slotLeft } = await dragToSlot({ events: [dstEvent] }, FALL_BACK_0200_SLOT)

      // 6 slots = 3 real hours: 04:00Z -> 07:00Z (02:00 EST)
      expect(event.start!.toISOString()).toBe('2024-11-03T07:00:00.000Z')
      expect(event.end!.toISOString()).toBe('2024-11-03T07:30:00.000Z')
      expectCloseTo(eventLeft, slotLeft)
    })

    it('drops onto the second copy of a repeated wall-clock time and stays there', async () => {
      const { event, eventLeft, slotLeft } = await dragToSlot({ events: [dstEvent] }, FALL_BACK_SECOND_0130_SLOT)

      expect(event.start!.toISOString()).toBe('2024-11-03T06:30:00.000Z') // the second 01:30 (EST)
      expect(event.startStr).toBe('2024-11-03T01:30:00-05:00')
      expectCloseTo(eventLeft, slotLeft)
    })

    it('moves across the spring-forward gap by elapsed time', async () => {
      const { event, eventLeft, slotLeft } = await dragToSlot({
        initialDate: SPRING_FORWARD_DAY,
        events: [{ id: '1', start: '2024-03-10T00:00:00', end: '2024-03-10T00:30:00' }],
      }, SPRING_FORWARD_0300_SLOT)

      // 4 slots = 2 real hours: 05:00Z -> 07:00Z (03:00 EDT)
      expect(event.start!.toISOString()).toBe('2024-03-10T07:00:00.000Z')
      expectCloseTo(eventLeft, slotLeft)
    })

    // exercises resource timeline's separate hit-testing
    it('moves across the fall-back transition in a resource timeline', async () => {
      const { event } = await dragToSlot({
        initialView: 'resourceTimelineDay',
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [{ ...dstEvent, resourceId: 'a' }],
      }, FALL_BACK_0200_SLOT, 'a')

      expect(event.start!.toISOString()).toBe('2024-11-03T07:00:00.000Z')
    })

    it('gives eventAllow the exact instant of a drop onto the second copy of a repeated time', async () => {
      const eventAllow = vi.fn<AllowFunc>(() => true)
      const { event } = await dragToSlot({ events: [dstEvent], eventAllow }, FALL_BACK_SECOND_0130_SLOT)

      expect(event.startStr).toBe('2024-11-03T01:30:00-05:00')
      expect(eventAllow.mock.calls.at(-1)![0].startStr).toBe('2024-11-03T01:30:00-05:00')
    })

    /*
    Both copies of the repeated hour read the same wall-clock times, but overlap is checked by
    exact instants.
    */
    it.each([
      ['allows a drop onto the free first copy', 3, '2024-11-03T05:30:00.000Z', 1],
      ['rejects a drop onto the occupied second copy', FALL_BACK_SECOND_0130_SLOT, '2024-11-03T04:00:00.000Z', 0],
    ])('with eventOverlap:false, %s of a repeated time', async (_desc, slotIndex, expectedStart, dropCount) => {
      const eventDrop = vi.fn()
      const { event } = await dragToSlot({
        eventOverlap: false,
        eventDrop,
        events: [
          dstEvent,
          { id: 'est', start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' },
        ],
      }, slotIndex)

      expect(eventDrop).toHaveBeenCalledTimes(dropCount)
      expect(event.start!.toISOString()).toBe(expectedStart)
    })
  })
})
