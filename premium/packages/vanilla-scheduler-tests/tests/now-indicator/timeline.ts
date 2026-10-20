import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { getSlotLanes, getTimeAxisEdges, getTimeBoundaryX, isRtl } from '../lib/models/timeline-layout'
import { DST_TIMELINE_OPTIONS, FALL_BACK_SECOND_0130_SLOT, SPRING_FORWARD_DAY, expectCloseTo } from '../lib/dst'

describe('timeline now-indicator', () => {
  const options: CalendarOptions = {
    initialView: 'timelineDay',
    now: '2015-12-26T02:30:00',
    nowIndicator: true,
    scrollTime: '00:00',
  }
  const resources = [{ id: 'a', title: 'Resource A' }, { id: 'b', title: 'Resource B' }]

  function getCenterX(el: Element): number {
    const rect = el.getBoundingClientRect()
    return rect.left + rect.width / 2
  }

  /*
  The x of the line in the body and of the marker in the header, or null when neither renders.
  Throws if only one renders.
  */
  function getIndicatorXs(root: HTMLElement): { lineX: number, headerX: number } | null {
    const lineEls = queryParts(root, 'nowIndicatorLine')
    const headerEls = queryParts(root, 'nowIndicatorHeader')

    if (lineEls.length !== headerEls.length || lineEls.length > 1) {
      throw new Error(`Found ${lineEls.length} now-indicator lines and ${headerEls.length} header markers`)
    }
    return lineEls.length ? { lineX: getCenterX(lineEls[0]), headerX: getCenterX(headerEls[0]) } : null
  }

  function expectIndicatorAtX(root: HTMLElement, x: number, tolerance = 2): void {
    const xs = getIndicatorXs(root)
    expect(xs).not.toBeNull()
    expectCloseTo(xs!.lineX, x, tolerance)
    expectCloseTo(xs!.headerX, x, tolerance)
  }

  /*
  The x of a time within the slot that starts at `slotStart`, by linear interpolation.
  */
  function getTimeX(root: HTMLElement, slotStart: string, fraction: number): number {
    const slotEl = getSlotLanes(root).find((el) => el.getAttribute('data-date') === slotStart)!
    const edges = getTimeAxisEdges(slotEl, isRtl(root))
    return edges.start + (edges.end - edges.start) * fraction
  }

  it.each([
    ['in a timeline', {}, '2015-12-26T02:30'],
    ['in a resource timeline', { initialView: 'resourceTimelineDay', resources }, '2015-12-26T02:30'],
    ['in RTL', { direction: 'rtl' }, '2015-12-26T02:30'],
    ['in a resource timeline in RTL', { initialView: 'resourceTimelineDay', resources, direction: 'rtl' }, '2015-12-26T02:30'],
    ['when now is out of view', { initialDate: '2015-12-27' }, null],
    ['when now is out of view in a resource timeline', { initialView: 'resourceTimelineDay', resources, initialDate: '2015-12-27' }, null],
  ] as const)('renders at now %s', async (_desc, moreOptions, expectedTime) => {
    const calendar = initCalendar({ ...options, ...moreOptions })
    await waitForSettle()

    expect(getSlotLanes(calendar.el).length).toBeGreaterThan(0) // the view rendered

    if (expectedTime) {
      expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, expectedTime))
    } else {
      expect(getIndicatorXs(calendar.el)).toBeNull()
    }
  })

  it('moves as time passes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    onTestFinished(() => {
      vi.useRealTimers()
    })

    const calendar = initCalendar({
      ...options,
      now: '2015-12-26T00:00:00',
      initialView: 'timelineOneMinute',
      views: {
        timelineOneMinute: { type: 'timeline', duration: { minutes: 1 }, slotDuration: { seconds: 1 } },
      },
    })
    await waitForSettle()
    expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, '2015-12-26T00:00:00'))

    for (const time of ['2015-12-26T00:00:01', '2015-12-26T00:00:02']) {
      vi.advanceTimersByTime(1000)
      await waitForSettle()
      expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, time))
    }
  })

  it('moves when the slot width changes with the container', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'timelineSixHour',
      views: {
        timelineSixHour: { type: 'timeline', duration: { hours: 6 }, slotDuration: { minutes: 30 } },
      },
    })
    await waitForSettle()
    const origX = getTimeBoundaryX(calendar.el, '2015-12-26T02:30')
    expectIndicatorAtX(calendar.el, origX)

    calendar.el.style.width = '50%'
    await waitForSettle()

    const newX = getTimeBoundaryX(calendar.el, '2015-12-26T02:30')
    expect(Math.abs(newX - origX)).toBeGreaterThan(50) // the slots moved
    expectIndicatorAtX(calendar.el, newX)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5999
  it('snaps to the start of month-sized slots', async () => {
    const calendar = initCalendar({
      ...options,
      initialView: 'timelineYear',
      slotDuration: { months: 1 },
      initialDate: '2020-11-28',
      now: '2020-12-02',
    })
    await waitForSettle()

    expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, '2020-12-01'))
  })

  // https://github.com/fullcalendar/fullcalendar/issues/6394
  describe('when slotMaxTime extends past midnight', () => {
    const lateOptions: CalendarOptions = {
      ...options,
      initialDate: '2015-12-26',
      slotMaxTime: '30:00',
      scrollTime: '24:00',
    }

    it.each([
      ['after midnight', {}, '2015-12-27T02:30:00', '2015-12-27T02:30'],
      ['after midnight in a resource timeline', { initialView: 'resourceTimelineDay', resources }, '2015-12-27T02:30:00', '2015-12-27T02:30'],
      ['nowhere past the extended end', {}, '2015-12-27T07:00:00', null],
      ['nowhere past the extended end in a resource timeline', { initialView: 'resourceTimelineDay', resources }, '2015-12-27T07:00:00', null],
    ] as const)('renders %s', async (_desc, moreOptions, now, expectedTime) => {
      const calendar = initCalendar({ ...lateOptions, ...moreOptions, now })
      await waitForSettle()

      if (expectedTime) {
        expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, expectedTime))
      } else {
        expect(getIndicatorXs(calendar.el)).toBeNull()
      }
    })

    it.each([
      ['within the month', '2015-12-31T02:30:00', '2015-12-31'],
      ['nowhere after it, since a day-sized axis ignores slotMaxTime', '2016-01-01T02:30:00', null],
    ])('renders a day-sized axis\'s indicator %s', async (_desc, now, expectedDate) => {
      const calendar = initCalendar({
        ...lateOptions,
        initialView: 'timelineMonth',
        slotDuration: { days: 1 },
        initialDate: '2015-12-01',
        now,
      })
      await waitForSettle()

      if (expectedDate) {
        expectIndicatorAtX(calendar.el, getTimeBoundaryX(calendar.el, expectedDate))
      } else {
        expect(getIndicatorXs(calendar.el)).toBeNull()
      }
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/6175
  describe('nowIndicatorSnap', () => {
    const snapOptions: CalendarOptions = {
      ...options,
      slotDuration: { hours: 1 },
      initialDate: '2025-01-05',
      now: '2025-01-05T01:35:00',
    }

    it.each([
      ['snaps to the slot by default, with one header row', 'timelineDay', {}, 0],
      ['snaps to the slot by default, with two header rows', 'timelineWeek', {}, 0],
      ['doesn\'t snap when false, with one header row', 'timelineDay', { nowIndicatorSnap: false }, 35 / 60],
      ['doesn\'t snap when false, with two header rows', 'timelineWeek', { nowIndicatorSnap: false }, 35 / 60],
    ])('%s', async (_desc, initialView, moreOptions, fraction) => {
      const calendar = initCalendar({ ...snapOptions, ...moreOptions, initialView })
      await waitForSettle()

      expectIndicatorAtX(calendar.el, getTimeX(calendar.el, '2025-01-05T01:00:00', fraction))
    })
  })

  /*
  The indicator is positioned by the exact instant of now, so it sweeps the 25-hour fall-back day
  without jumping back.
  */
  describe('across DST', () => {
    const FIRST_0130_SLOT = 3

    it.each([
      ['before the transition', {}, '2024-11-03T00:30:00', 1],
      ['in the first copy of the repeated hour', {}, '2024-11-03T05:30:00Z', FIRST_0130_SLOT],
      ['in the second copy of the repeated hour', {}, '2024-11-03T06:30:00Z', FALL_BACK_SECOND_0130_SLOT],
      ['after the transition', {}, '2024-11-03T02:30:00', 7],
      ['after the spring-forward gap', { initialDate: SPRING_FORWARD_DAY }, '2024-03-10T03:30:00', 5],
      // hour slots: 0=00:00, 1=01:00 EDT, 2=01:00 EST. Snapped, since slots are one unit
      ['in the second copy of the repeated hour, snapped to an hour slot', { slotDuration: '01:00' }, '2024-11-03T06:40:00Z', 2],
    ])('renders %s', async (_desc, moreOptions, now, slotIndex) => {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, nowIndicator: true, ...moreOptions, now })
      await waitForSettle()

      const slotStartX = getSlotLanes(calendar.el)[slotIndex].getBoundingClientRect().left
      expectIndicatorAtX(calendar.el, slotStartX, 3)
    })
  })
})
