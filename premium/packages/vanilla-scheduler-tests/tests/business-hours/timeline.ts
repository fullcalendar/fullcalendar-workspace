import { describe, expect, it } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import {
  clickExpander, expectElSpansSlots, expectElSpansTimes, getNonBusinessEls, getResourceAreaRows, getResourceLane,
  getResourceLanes,
} from '../lib/models/timeline-layout'
import { DST_TIMELINE_OPTIONS } from '../lib/dst'

describe('timeline businessHours', () => {
  const options: CalendarOptions = {
    initialView: 'timelineDay',
    now: '2016-02-15', // a Monday
    scrollTime: '00:00',
  }
  const NINE_TO_FIVE: [string, string][] = [
    ['2016-02-15T00:00', '2016-02-15T09:00'],
    ['2016-02-15T17:00', '2016-02-16T00:00'],
  ]
  const TWO_TO_TEN: [string, string][] = [
    ['2016-02-15T00:00', '2016-02-15T02:00'],
    ['2016-02-15T22:00', '2016-02-16T00:00'],
  ]

  /*
  Throws unless the container's non-business fills span exactly the given time ranges.
  */
  function expectNonBusiness(root: HTMLElement, container: HTMLElement, ranges: [string, string][]): void {
    const els = getNonBusinessEls(container)
    expect(els).toHaveLength(ranges.length)

    if (getComputedStyle(root).direction === 'rtl') {
      els.reverse()
    }
    ranges.forEach(([start, end], i) => {
      expectElSpansTimes(root, els[i], start, end)
    })
  }

  function expectResourceNonBusiness(root: HTMLElement, rangesByResource: Record<string, [string, string][]>): void {
    for (const [resourceId, ranges] of Object.entries(rangesByResource)) {
      expectNonBusiness(root, getResourceLane(root, resourceId), ranges)
    }
  }

  it.each([
    ['ltr'],
    ['rtl'],
  ] as const)('fills the hours outside businessHours (%s)', async (direction) => {
    const calendar = initCalendar({
      ...options,
      direction,
      slotDuration: { hours: 1 },
      businessHours: { startTime: '10:00', endTime: '16:00' },
    })
    await waitForSettle()

    expectNonBusiness(calendar.el, calendar.el, [
      ['2016-02-15T00:00', '2016-02-15T10:00'],
      ['2016-02-15T16:00', '2016-02-16T00:00'],
    ])
  })

  it('fills a whole day outside businessHours', async () => {
    const calendar = initCalendar({
      ...options,
      now: '2016-02-14', // a Sunday
      slotDuration: { hours: 1 },
      businessHours: { startTime: '10:00', endTime: '16:00' },
    })
    await waitForSettle()

    expectNonBusiness(calendar.el, calendar.el, [['2016-02-14T00:00', '2016-02-15T00:00']])
  })

  describe('with resources', () => {
    const resourceOptions: CalendarOptions = {
      ...options,
      initialView: 'resourceTimelineDay',
      businessHours: true,
    }
    const resourcesWithOverride = [
      { id: 'a', title: 'a' },
      { id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } },
      { id: 'c', title: 'c' },
    ]
    const overrideRanges = { a: NINE_TO_FIVE, b: TWO_TO_TEN, c: NINE_TO_FIVE }

    it('fills the calendar-wide hours once, across all lanes', async () => {
      const calendar = initCalendar({
        ...resourceOptions,
        resources: [{ id: 'a', title: 'a' }, { id: 'b', title: 'b' }, { id: 'c', title: 'c' }],
      })
      await waitForSettle()

      expectNonBusiness(calendar.el, calendar.el, NINE_TO_FIVE)
      const fillRect = getNonBusinessEls(calendar.el)[0].getBoundingClientRect()
      const lanes = getResourceLanes(calendar.el)
      expect(fillRect.top).toBeLessThanOrEqual(lanes[0].getBoundingClientRect().top)
      expect(fillRect.bottom).toBeGreaterThanOrEqual(lanes[2].getBoundingClientRect().bottom)
    })

    it('fills each lane by its resource\'s businessHours when one overrides them', async () => {
      const calendar = initCalendar({ ...resourceOptions, resources: resourcesWithOverride })
      await waitForSettle()

      expectResourceNonBusiness(calendar.el, overrideRanges)
    })

    it('fills the full height of expanded rows', async () => {
      const calendar = initCalendar({ ...resourceOptions, expandRows: true, resources: resourcesWithOverride })
      await waitForSettle()

      const laneHeights = getResourceLanes(calendar.el).map((el) => el.getBoundingClientRect().height)
      expect(laneHeights[0]).toBeGreaterThan(100) // expanded
      for (const resourceId of ['a', 'b', 'c']) {
        const laneHeight = getResourceLane(calendar.el, resourceId).getBoundingClientRect().height
        for (const fillEl of getNonBusinessEls(getResourceLane(calendar.el, resourceId))) {
          expect(Math.abs(fillEl.getBoundingClientRect().height - laneHeight)).toBeLessThan(3)
        }
      }
    })

    it('updates when a resource with an override is removed and re-added', async () => {
      const calendar = initCalendar({ ...resourceOptions, resources: resourcesWithOverride })
      await waitForSettle()
      expectResourceNonBusiness(calendar.el, overrideRanges)

      calendar.getResourceById('b')!.remove()
      await waitForSettle()
      expectNonBusiness(calendar.el, calendar.el, NINE_TO_FIVE)
      expect(getNonBusinessEls(calendar.el)).toHaveLength(2) // no per-lane fills left

      calendar.addResource(resourcesWithOverride[1])
      await waitForSettle()
      expectResourceNonBusiness(calendar.el, overrideRanges)
    })

    it('adds the lane fills of a resource added beside another with an override', async () => {
      const calendar = initCalendar({
        ...resourceOptions,
        resources: [{ id: 'a', title: 'a', businessHours: { startTime: '03:00', endTime: '21:00' } }],
      })
      await waitForSettle()
      const threeToNine: [string, string][] = [['2016-02-15T00:00', '2016-02-15T03:00'], ['2016-02-15T21:00', '2016-02-16T00:00']]
      expectResourceNonBusiness(calendar.el, { a: threeToNine })

      calendar.addResource({ id: 'b', title: 'b', businessHours: { startTime: '02:00', endTime: '22:00' } })
      await waitForSettle()
      expectResourceNonBusiness(calendar.el, { a: threeToNine, b: TWO_TO_TEN })
    })

    // https://github.com/fullcalendar/fullcalendar-scheduler/issues/414
    it('fills lanes by resource overrides after switching views and back', async () => {
      const calendar = initCalendar({ ...resourceOptions, resources: resourcesWithOverride })
      await waitForSettle()
      expectResourceNonBusiness(calendar.el, overrideRanges)

      calendar.changeView('dayGridMonth')
      calendar.changeView('resourceTimelineDay')
      await waitForSettle()
      expectResourceNonBusiness(calendar.el, overrideRanges)
    })

    it('fills the lane of a child resource with an override once expanded', async () => {
      const calendar = initCalendar({
        ...resourceOptions,
        resourcesInitiallyExpanded: false,
        resources: [
          { id: 'a', title: 'a', children: [{ id: 'a1', title: 'a1', businessHours: { startTime: '02:00', endTime: '22:00' } }] },
        ],
      })
      await waitForSettle()
      expect(getResourceLanes(calendar.el).map((el) => el.getAttribute('data-resource-id'))).toEqual(['a'])

      await clickExpander(getResourceAreaRows(calendar.el)[0].el)
      expectResourceNonBusiness(calendar.el, { a1: TWO_TO_TEN })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/7934
  it.each([
    ['nothing when they cover the whole window', '26:00', []],
    ['the rest of the window when they cover part of it', '27:00', [['2016-02-16T02:00', '2016-02-16T03:00']]],
  ] as const)('fills hours past 24 within a short window: %s', async (_desc, startTime, ranges) => {
    const calendar = initCalendar({
      ...options,
      initialView: 'resourceTimelineDay',
      slotMinTime: '26:00',
      slotMaxTime: '28:00',
      businessHours: { startTime, endTime: '28:00' },
    })
    await waitForSettle()

    expectNonBusiness(calendar.el, calendar.el, ranges as unknown as [string, string][])
  })

  describe('across DST', () => {
    it('fills around businessHours by real time on the fall-back day', async () => {
      const calendar = initCalendar({
        ...DST_TIMELINE_OPTIONS,
        businessHours: { daysOfWeek: [0], startTime: '00:30', endTime: '03:30' }, // a Sunday
      })
      await waitForSettle()

      // 00:30 is slot 1, and 03:30 is slot 9 (8 slots later, since the repeated hour has 2 extra)
      const fillEls = getNonBusinessEls(calendar.el)
      expect(fillEls).toHaveLength(2)
      expectElSpansSlots(calendar.el, fillEls[0], 0, 1)
      expectElSpansSlots(calendar.el, fillEls[1], 9, 50)
    })
  })
})
