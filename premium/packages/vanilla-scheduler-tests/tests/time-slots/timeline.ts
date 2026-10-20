import { describe, expect, it, vi } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import lvLocale from 'fullcalendar/locales/lv'
import { createCalendarElement, initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getEventEls, queryPart } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { pointer } from '@fullcalendar-tests/standard/tests/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import {
  expectElAtX, expectElSpansSlots, expectScrolledTo, getHorizontalScroller, getSlotDates, getSlotEdgeX, getSlotEl,
  getSlotHeaderDates, getSlotHeaderRows, getSlotLanes, getTimeAxisEdges, getTimeScroller,
} from '../lib/models/timeline-layout'
import { DST_TIMELINE_OPTIONS, FALL_BACK_DAY, SPRING_FORWARD_DAY, expectCloseTo } from '../lib/dst'

describe('timeline time slots', () => {
  describe('slot headers', () => {
    it('renders a header row per slotHeaderFormat entry', async () => {
      const calendar = initCalendar({
        initialView: 'timelineWeek',
        initialDate: '2017-10-27',
        slotDuration: { hours: 1 },
        slotHeaderFormat: [
          { month: 'numeric', day: 'numeric' },
          { hour: 'numeric', minute: 'numeric' },
        ],
      })
      await waitForSettle()

      const rows = getSlotHeaderRows(calendar.el)
      expect(rows).toHaveLength(2)
      expect(rows[0][0].getAttribute('data-date')).toBe('2017-10-22T00:00:00')
      expect(rows[0][0].textContent).toBe('10/22')
      expect(rows[1][1].getAttribute('data-date')).toBe('2017-10-22T01:00:00')
    })

    it('gives slotHeaderContent the level of each header row', async () => {
      const slotHeaderContent = vi.fn()
      initCalendar({
        initialView: 'timelineWeek',
        initialDate: '2017-10-27',
        slotHeaderFormat: [
          { day: 'numeric' },
          { hour: 'numeric', minute: 'numeric' },
        ],
        slotHeaderContent,
      })
      await waitForSettle()

      const levels = new Set(slotHeaderContent.mock.calls.map(([info]) => info.level))
      expect([...levels].sort()).toEqual([0, 1])
    })

    it.each([
      ['day', 'timelineWeek', { days: 1 }, 7, '2017-10-22T00:00:00.000Z'],
      ['hour', 'timelineDay', { hours: 1 }, 24, '2017-10-27T00:00:00.000Z'],
    ])('calls slotHeaderDidMount for each %s', async (_unit, initialView, slotDuration, count, firstDate) => {
      const slotHeaderDidMount = vi.fn()
      initCalendar({ initialView, initialDate: '2017-10-27', slotDuration, slotHeaderDidMount })
      await waitForSettle()

      expect(slotHeaderDidMount).toHaveBeenCalledTimes(count * strictModeFactor)
      const info = slotHeaderDidMount.mock.calls[0][0]
      expect(info.date.toISOString()).toBe(firstDate)
      expect(info.el.getAttribute('data-fc-part')).toContain('slotHeader')
      expect(info.view.type).toBe(initialView)
    })

    it('starts the week by the locale', async () => {
      const calendar = initCalendar({
        initialView: 'timelineWeek',
        initialDate: '2017-10-27',
        slotDuration: '01:00',
        locale: lvLocale,
      })
      await waitForSettle()

      expect(getSlotHeaderDates(calendar.el)[0]).toBe('2017-10-23T00:00:00') // a Monday
    })

    /*
    Slots that are a whole day get each day's state through render hooks.
    */
    it.each([
      ['slotHeader', 'slotHeaderClass'],
      ['slotLane', 'slotLaneClass'],
    ] as const)('gives %s render hooks the day\'s weekday and past/today/future state', async (part, classOption) => {
      const calendar = initCalendar({
        initialView: 'timelineMonth',
        now: '2016-11-05', // a Saturday
        slotDuration: { days: 1 },
        [classOption]: (info) => [
          `dow-${info.date.getUTCDay() === info.dow ? info.dow : 'mismatch'}`,
          info.isToday && 'today',
          info.isPast && 'past',
          info.isFuture && 'future',
        ].filter(Boolean).join(' '),
      })
      await waitForSettle()

      expect([...getSlotEl(calendar.el, '2016-11-04', part).classList]).toEqual(expect.arrayContaining(['dow-5', 'past']))
      expect([...getSlotEl(calendar.el, '2016-11-05', part).classList]).toEqual(expect.arrayContaining(['dow-6', 'today']))
      expect([...getSlotEl(calendar.el, '2016-11-07', part).classList]).toEqual(expect.arrayContaining(['dow-1', 'future']))
      expect(getSlotEl(calendar.el, '2016-11-05', part).classList.contains('past')).toBe(false)
    })
  })

  describe('slotMinTime and slotMaxTime', () => {
    const options: CalendarOptions = {
      now: '2016-02-17',
      initialView: 'timelineTwoDay',
      slotHeaderInterval: '01:00',
      views: {
        timelineTwoDay: { type: 'timeline', duration: { days: 2 } },
      },
    }

    it.each([
      ['a negative slotMinTime, leaving a gap', { slotMinTime: '-02:00', slotMaxTime: '20:00' },
        '2016-02-16T22:00:00', '2016-02-18T19:00:00', ['2016-02-17T19:00:00', '2016-02-17T22:00:00']],
      ['a slotMaxTime past midnight, leaving a gap', { slotMinTime: '09:00', slotMaxTime: '28:00' },
        '2016-02-17T09:00:00', '2016-02-19T03:00:00', ['2016-02-18T03:00:00', '2016-02-18T09:00:00']],
      ['a negative slotMinTime, overlapping the previous day', { slotMinTime: '-02:00' },
        '2016-02-16T22:00:00', '2016-02-18T23:00:00', null],
      ['a slotMaxTime past midnight, overlapping the next day', { slotMaxTime: '26:00' },
        '2016-02-17T00:00:00', '2016-02-19T01:00:00', null],
    ])('renders the range of %s', async (_desc, moreOptions, firstHour, lastHour, gap) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()

      const hours = getSlotHeaderDates(calendar.el, -1)
      expect(hours[0]).toBe(firstHour)
      expect(hours.at(-1)).toBe(lastHour)

      if (gap) { // consecutive headers skip the hidden hours
        const gapStartIndex = hours.indexOf(gap[0])
        expect(hours[gapStartIndex + 1]).toBe(gap[1])
      } else { // two 26-hour days that share 2 hours, rendered once
        expect(hours).toHaveLength(50)
        expect(new Set(hours).size).toBe(50)
      }
    })
  })

  describe('eventMinWidth', () => {
    const options: CalendarOptions = {
      initialView: 'timelineDay',
      initialDate: '2021-05-07',
      scrollTime: '00:00',
      events: [{ id: '1', start: '2021-05-07T00:00:00', end: '2021-05-07T00:01:00' }],
    }

    it.each([
      ['30px by default', {}, 30],
      ['the given width', { eventMinWidth: 100 }, 100],
      ['the given width, from the start edge in RTL', { eventMinWidth: 100, direction: 'rtl' }, 100],
    ] as const)('makes a short event %s', async (_desc, moreOptions, width) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()

      const eventEl = getEventEls(calendar.el, '1')[0]
      const rtl = 'direction' in moreOptions
      const startX = getSlotEdgeX(calendar.el, 0)
      expectElAtX(eventEl, rtl, startX, rtl ? startX - width : startX + width, 2)
    })
  })

  describe('scrollTime', () => {
    it.each([
      ['timelineDay'],
      ['resourceTimelineDay'],
    ])('scrolls the body and header to it initially in %s', async (initialView) => {
      const calendar = initCalendar({
        initialDate: '2020-08-09',
        initialView,
        slotDuration: { minutes: 30 },
        scrollTime: '06:00',
      })
      await waitForSettle()

      const slotLaneEl = getSlotEl(calendar.el, '2020-08-09T06:00:00')
      const slotHeaderEl = getSlotEl(calendar.el, '2020-08-09T06:00:00', 'slotHeader')
      expect(getTimeScroller(calendar.el).scrollLeft).toBeGreaterThan(0)
      expectScrolledTo(getTimeScroller(calendar.el), slotLaneEl)
      expectScrolledTo(getHorizontalScroller(slotHeaderEl), slotHeaderEl)
    })

    it('scrolls to it after switching from a view with day slots', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineMonth',
        initialDate: '2020-08-09',
        scrollTime: '06:00',
      })
      await waitForSettle()

      calendar.changeView('resourceTimelineWeek')
      await waitForSettle()

      expectScrolledTo(getTimeScroller(calendar.el), getSlotEl(calendar.el, '2020-08-09T06:00:00'))
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5645
    it('is disregarded when slots are a day or bigger', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineMonth',
        initialDate: '2020-08-09',
        scrollTime: '06:00',
      })
      await waitForSettle()

      const scrollerEl = getTimeScroller(calendar.el)
      expect(scrollerEl.scrollWidth).toBeGreaterThan(scrollerEl.clientWidth) // could scroll
      expect(scrollerEl.scrollLeft).toBe(0)
    })

    describe('when navigating', () => {
      const options: CalendarOptions = {
        now: '2020-07-07T23:00:00',
        nowIndicator: true,
        initialView: 'resourceTimelineDay',
        scrollTime: '06:00',
      }

      // https://github.com/fullcalendar/fullcalendar/issues/5351
      it('is kept when moving to the next day, with resources and nowIndicator', async () => {
        const calendar = initCalendar(options)
        await waitForSettle()
        const origScroll = getTimeScroller(calendar.el).scrollLeft
        expect(origScroll).toBeGreaterThan(0)

        calendar.next()
        await waitForSettle()

        expect(calendar.view.currentStart.toISOString()).toBe('2020-07-08T00:00:00.000Z')
        expect(getTimeScroller(calendar.el).scrollLeft).toBe(origScroll)
      })

      // https://github.com/fullcalendar/fullcalendar/issues/5351#issuecomment-667554437
      it('is kept when returning to the current day', async () => {
        const calendar = initCalendar(options)
        await waitForSettle()
        const origScroll = getTimeScroller(calendar.el).scrollLeft
        expect(origScroll).toBeGreaterThan(0)

        calendar.next()
        await waitForSettle()
        calendar.prev()
        await waitForSettle()

        expect(calendar.view.currentStart.toISOString()).toBe('2020-07-07T00:00:00.000Z')
        expect(getTimeScroller(calendar.el).scrollLeft).toBe(origScroll)
      })
    })

    /*
    https://github.com/fullcalendar/fullcalendar/issues/8093
    When the whole timeline fits without scrolling, a time-based scroll is a no-op that fires no
    scroll event. Whether the initial render hits this depends on layout timing, so scrollToTime()
    is used to reproduce it deterministically.
    */
    describe('when the timeline is too wide to scroll', () => {
      function createWideCalendarElement(): HTMLElement {
        const el = createCalendarElement()
        el.style.width = '3000px' // wide enough for the whole day to fit
        el.style.maxWidth = 'none' // override the test stylesheet
        return el
      }

      it('renders the leading slots when virtualized', async () => {
        const calendar = initCalendar({
          initialDate: '2020-08-09',
          initialView: 'resourceTimelineDay',
          scrollTime: '12:00',
          virtualization: true,
          resources: [{ id: 'a', title: 'Resource A' }],
          events: [{ id: '1', resourceId: 'a', start: '2020-08-09T00:00:00', end: '2020-08-09T23:00:00' }],
        }, createWideCalendarElement())
        await waitForSettle()

        function expectLeadingSlotsRendered(): void {
          const scrollerEl = getTimeScroller(calendar.el)
          const slotLaneEl = getSlotEl(calendar.el, '2020-08-09T00:00:00')
          const slotHeaderEl = getSlotEl(calendar.el, '2020-08-09T00:00:00', 'slotHeader')

          expect(scrollerEl.scrollWidth).toBeLessThanOrEqual(scrollerEl.clientWidth)
          expectScrolledTo(scrollerEl, slotLaneEl)
          expectScrolledTo(getHorizontalScroller(slotHeaderEl), slotHeaderEl)
          expectScrolledTo(scrollerEl, getEventEls(calendar.el, '1')[0], 2)
        }

        expectLeadingSlotsRendered()

        calendar.scrollToTime('12:00')
        calendar.addEvent({ resourceId: 'a', start: '2020-08-09T23:00:00', title: 'rerender trigger' })
        await waitForSettle()
        expectLeadingSlotsRendered()
      })

      /*
      Print clips the canvas to the recorded on-screen scroll position, which must not exceed what the
      screen could actually scroll to.
      */
      it.each([
        ['resourceTimelineDay'],
        ['timelineDay'],
      ])('prints the leading slots in %s', async (initialView) => {
        const calendar = initCalendar({
          initialView,
          initialDate: '2020-08-09',
          scrollTime: '12:00',
          resources: [{ id: 'a', title: 'Resource A' }],
        }, createWideCalendarElement())
        await waitForSettle()

        calendar.scrollToTime('12:00')
        await waitForSettle()
        calendar.trigger('_beforeprint')
        await waitForSettle()

        try {
          const slotHeaderEl = getSlotEl(calendar.el, '2020-08-09T00:00:00', 'slotHeader')
          const cropEl = slotHeaderEl.closest('th')!
          expect(cropEl).not.toBeNull() // print renders a table
          expectCloseTo(slotHeaderEl.getBoundingClientRect().left, cropEl.getBoundingClientRect().left, 1)
        } finally {
          calendar.trigger('_afterprint')
        }
      })
    })
  })

  /*
  The timed axis enumerates a wall-clock grid from each day's midnight, then resolves each grid time
  to its real occurrences: on the fall-back day the repeated hour's slots appear twice, and on the
  spring-forward day the nonexistent hour's slots are skipped.
  */
  describe('across DST', () => {
    async function renderDst(moreOptions: CalendarOptions = {}) {
      const calendar = initCalendar({ ...DST_TIMELINE_OPTIONS, ...moreOptions })
      await waitForSettle()
      return calendar
    }

    function expectEventSpansSlots(root: HTMLElement, eventId: string, startSlot: number, endSlot: number): void {
      const eventEls = getEventEls(root, eventId)
      expect(eventEls).toHaveLength(1)
      expectElSpansSlots(root, eventEls[0], startSlot, endSlot)
    }

    function getSlotCenterX(root: HTMLElement, index: number): number {
      const rect = getSlotLanes(root)[index].getBoundingClientRect()
      return rect.left + rect.width / 2
    }

    describe('with 30-minute slots', () => {
      it('doubles the slots of the repeated hour on the fall-back day', async () => {
        const calendar = await renderDst()

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(50) // 25 real hours
        expect(slotDates.slice(0, 8)).toEqual([
          '2024-11-03T00:00:00',
          '2024-11-03T00:30:00',
          '2024-11-03T01:00:00', // first copy (EDT)
          '2024-11-03T01:30:00',
          '2024-11-03T01:00:00', // second copy (EST)
          '2024-11-03T01:30:00',
          '2024-11-03T02:00:00',
          '2024-11-03T02:30:00',
        ])
      })

      it('labels the repeated hour twice on the fall-back day', async () => {
        const calendar = await renderDst()

        const hours = getSlotHeaderDates(calendar.el, -1)
        expect(hours).toHaveLength(25)
        expect(hours.slice(0, 4)).toEqual([
          '2024-11-03T00:00:00',
          '2024-11-03T01:00:00',
          '2024-11-03T01:00:00',
          '2024-11-03T02:00:00',
        ])
      })

      it('applies slotMinTime and slotMaxTime by wall-clock time around the transition', async () => {
        const calendar = await renderDst({ slotMinTime: '01:00', slotMaxTime: '04:00' })

        expect(getSlotDates(calendar.el)).toEqual([ // 4 real hours
          '2024-11-03T01:00:00',
          '2024-11-03T01:30:00',
          '2024-11-03T01:00:00',
          '2024-11-03T01:30:00',
          '2024-11-03T02:00:00',
          '2024-11-03T02:30:00',
          '2024-11-03T03:00:00',
          '2024-11-03T03:30:00',
        ])
      })

      it('gives each copy of a repeated slot its own instant and past/future state', async () => {
        const slotLaneClass = vi.fn(() => '')
        await renderDst({
          now: '2024-11-03T05:45:00Z', // between the two 01:00 slots
          slotLaneClass,
        })

        const infoByInstant = new Map(slotLaneClass.mock.calls.map(([info]: any[]) => [info.date.toISOString(), info]))
        const firstCopy = infoByInstant.get('2024-11-03T05:00:00.000Z')!
        const secondCopy = infoByInstant.get('2024-11-03T06:00:00.000Z')!
        expect({ isPast: firstCopy.isPast, isFuture: firstCopy.isFuture }).toEqual({ isPast: true, isFuture: false })
        expect({ isPast: secondCopy.isPast, isFuture: secondCopy.isFuture }).toEqual({ isPast: false, isFuture: true })
      })

      it('skips the slots of the nonexistent hour on the spring-forward day', async () => {
        const calendar = await renderDst({ initialDate: SPRING_FORWARD_DAY })

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(46) // 23 real hours
        expect(slotDates.slice(2, 6)).toEqual([
          '2024-03-10T01:00:00',
          '2024-03-10T01:30:00',
          '2024-03-10T03:00:00',
          '2024-03-10T03:30:00',
        ])

        const hours = getSlotHeaderDates(calendar.el, -1)
        expect(hours).toHaveLength(23)
        expect(hours.slice(1, 3)).toEqual(['2024-03-10T01:00:00', '2024-03-10T03:00:00'])
      })

      it('renders a uniform day in UTC', async () => {
        const calendar = await renderDst({ timeZone: 'UTC' })

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(48)
        expect(slotDates.slice(2, 5)).toEqual(['2024-11-03T01:00:00', '2024-11-03T01:30:00', '2024-11-03T02:00:00'])
      })

      it('accumulates each day\'s slots in a multi-day timeline', async () => {
        const calendar = await renderDst({
          initialView: 'timelineThreeDays',
          initialDate: '2024-11-02',
          slotDuration: '01:00',
          views: { timelineThreeDays: { type: 'timeline', duration: { days: 3 } } },
          events: [{ id: '1', start: '2024-11-04T06:00:00Z', end: '2024-11-04T07:00:00Z' }],
        })

        const slotDates = getSlotDates(calendar.el)
        const countsByDay: Record<string, number> = {}
        for (const date of slotDates) {
          countsByDay[date.slice(0, 10)] = (countsByDay[date.slice(0, 10)] || 0) + 1
        }
        expect(countsByDay).toEqual({ '2024-11-02': 24, '2024-11-03': 25, '2024-11-04': 24 })
        expect(slotDates[50]).toBe('2024-11-04T01:00:00')
        expectEventSpansSlots(calendar.el, '1', 50, 51)
      })

      /*
      scrollTime is wall-clock: '06:00' is the slot labeled 06:00, which is 7 real hours after midnight
      on the fall-back day and 5 on the spring-forward day.
      */
      it.each([
        ['fall-back', FALL_BACK_DAY, 14],
        ['spring-forward', SPRING_FORWARD_DAY, 10],
      ])('scrolls to the wall-clock scrollTime on the %s day', async (_desc, initialDate, slotIndex) => {
        const calendar = await renderDst({ initialDate, scrollTime: '06:00' })

        const slotLaneEl = getSlotLanes(calendar.el)[slotIndex]
        expect(slotLaneEl.getAttribute('data-date')).toBe(`${initialDate}T06:00:00`)
        expect(getTimeScroller(calendar.el).scrollLeft).toBeGreaterThan(0)
        expectScrolledTo(getTimeScroller(calendar.el), slotLaneEl, 3)
      })
    })

    /*
    A two-hour grid from midnight. The grid time that doesn't exist (or the doubled one) is dropped,
    and the slot containing the transition spans 3 real hours.
    */
    describe('with 2-hour slots', () => {
      const options: CalendarOptions = { slotDuration: '02:00', nowIndicator: true, nowIndicatorSnap: false }

      it.each([
        ['fall-back', FALL_BACK_DAY, ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']],
        ['spring-forward', SPRING_FORWARD_DAY, ['00', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']],
      ])('renders the even-hour wall-clock grid on the %s day', async (_desc, initialDate, hours) => {
        const calendar = await renderDst({ ...options, initialDate })

        expect(getSlotDates(calendar.el)).toEqual(hours.map((hour) => `${initialDate}T${hour}:00:00`))
      })

      it.each([
        ['fall-back', FALL_BACK_DAY, '2024-11-03T05:30:00Z', [
          { id: 'transition', start: '2024-11-03T00:00:00-04:00', end: '2024-11-03T01:30:00-04:00' },
          { id: 'after', start: '2024-11-03T02:00:00-05:00', end: '2024-11-03T04:00:00-05:00' },
        ]],
        ['spring-forward', SPRING_FORWARD_DAY, '2024-03-10T06:30:00Z', [
          { id: 'transition', start: '2024-03-10T00:00:00-05:00', end: '2024-03-10T01:30:00-05:00' },
          { id: 'after', start: '2024-03-10T04:00:00-04:00', end: '2024-03-10T06:00:00-04:00' },
        ]],
      ])('positions times within the 3-hour transition slot by real time on the %s day', async (_desc, initialDate, now, events) => {
        // `now` and the first event's end are halfway through the transition slot's 3 real hours
        const calendar = await renderDst({ ...options, initialDate, now, events })

        const transitionMidX = getSlotCenterX(calendar.el, 0)
        const transitionEventEl = getEventEls(calendar.el, 'transition')[0]
        expectCloseTo(transitionEventEl.getBoundingClientRect().right, transitionMidX, 3)
        expectCloseTo(getSlotEdgeX(calendar.el, 0), getTimeAxisEdges(transitionEventEl, false).start, 1.5)
        const nowIndicatorRect = queryPart(calendar.el, 'nowIndicatorLine')!.getBoundingClientRect()
        expectCloseTo(nowIndicatorRect.left + nowIndicatorRect.width / 2, transitionMidX, 3)
        expectEventSpansSlots(calendar.el, 'after', 1, 2)
      })
    })

    /*
    A 90-minute grid doesn't divide the one-hour shift. Grid times stay wall-clock aligned, and the
    slot containing the transition has 1 real hour (fall-back) or 30 real minutes (spring-forward),
    though it renders at full width. Positions interpolate within its real span, and the part of the
    slot past its real span isn't a valid date.
    */
    describe('with 90-minute slots', () => {
      const options: CalendarOptions = { slotDuration: '01:30' }

      it.each([
        ['fall-back', FALL_BACK_DAY, 17, ['00:00', '01:30', '01:30', '03:00', '04:30'], '2024-11-04'],
        ['spring-forward', SPRING_FORWARD_DAY, 16, ['00:00', '01:30', '03:00', '04:30'], '2024-03-11'],
      ])('keeps the wall-clock grid on the %s day, and fills it with a full-day event', async (_desc, initialDate, slotCount, firstTimes, nextDay) => {
        const calendar = await renderDst({
          ...options,
          initialDate,
          events: [{ id: '1', start: `${initialDate}T00:00:00`, end: `${nextDay}T00:00:00` }],
        })

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(slotCount)
        expect(slotDates.slice(0, firstTimes.length)).toEqual(firstTimes.map((time) => `${initialDate}T${time}:00`))
        expect(slotDates.at(-1)).toBe(`${initialDate}T22:30:00`)
        expectEventSpansSlots(calendar.el, '1', 0, slotCount)
      })

      it.each([
        // 06:00Z is halfway from the first 01:30 (05:30Z) to the second (06:30Z)
        ['fall-back', FALL_BACK_DAY, '2024-11-03T01:00:00-05:00'],
        // 06:45Z is halfway from 01:30 EST (06:30Z) to 03:00 EDT (07:00Z)
        ['spring-forward', SPRING_FORWARD_DAY, '2024-03-10T06:45:00Z'],
      ])('stretches real time within the transition slot on the %s day', async (_desc, initialDate, end) => {
        const calendar = await renderDst({
          ...options,
          initialDate,
          events: [{ id: '1', start: `${initialDate}T00:00:00`, end }],
        })

        expectCloseTo(getEventEls(calendar.el, '1')[0].getBoundingClientRect().right, getSlotCenterX(calendar.el, 1), 3)
      })

      it.each([
        // 3 nominal 30-minute snaps in the slot, but only 2 have real time
        ['fall-back', FALL_BACK_DAY, 0.85, '2024-11-03T05:30:00.000Z', '2024-11-03T01:30:00-04:00'],
        // only the first of the 3 has real time
        ['spring-forward', SPRING_FORWARD_DAY, 0.5, '2024-03-10T06:30:00.000Z', '2024-03-10T01:30:00-05:00'],
      ])('reports clicks in the transition slot by real time, ignoring the part past its real span, on the %s day', async (
        _desc, initialDate, deadFrac, expectedInstant, expectedStr,
      ) => {
        const dateClick = vi.fn()
        const calendar = await renderDst({ ...options, initialDate, snapDuration: '00:30', dateClick })

        const slotRect = getSlotLanes(calendar.el)[1].getBoundingClientRect()
        const y = slotRect.top + slotRect.height / 2
        await pointer.click({ x: slotRect.left + slotRect.width * 0.15, y })
        await waitForSettle()
        expect(dateClick).toHaveBeenCalledTimes(1)
        expect(dateClick.mock.calls[0][0].date.toISOString()).toBe(expectedInstant)
        expect(dateClick.mock.calls[0][0].dateStr).toBe(expectedStr)

        await pointer.click({ x: slotRect.left + slotRect.width * deadFrac, y })
        await waitForSettle()
        expect(dateClick).toHaveBeenCalledTimes(1)
      })

      it('renders a uniform day in UTC', async () => {
        const calendar = await renderDst({
          ...options,
          timeZone: 'UTC',
          events: [{ id: '1', start: '2024-11-03T00:00:00', end: '2024-11-04T00:00:00' }],
        })

        expect(getSlotDates(calendar.el)).toHaveLength(16)
        expectEventSpansSlots(calendar.el, '1', 0, 16)
      })
    })

    /*
    Lord Howe Island shifts by 30 minutes. Hour slots keep whole-hour wall-clock starts, and the slot
    containing the transition absorbs the shift.
    */
    describe('in time zones with other transition rules', () => {
      it.each([
        // 02:00 +10:30 -> 02:30 +11:00
        ['spring-forward', '2024-10-06', 23, ['00', '01', '03', '04'], [
          { id: 'transition', start: '2024-10-06T01:00:00+10:30', end: '2024-10-06T03:00:00+11:00' },
          { id: 'after', start: '2024-10-06T03:00:00+11:00', end: '2024-10-06T04:00:00+11:00' },
        ], 90],
        // 02:00 +11:00 -> 01:30 +10:30
        ['fall-back', '2025-04-06', 24, ['00', '01', '02', '03'], [
          { id: 'transition', start: '2025-04-06T01:00:00+11:00', end: '2025-04-06T02:00:00+10:30' },
          { id: 'after', start: '2025-04-06T02:00:00+10:30', end: '2025-04-06T03:00:00+10:30' },
        ], 90],
      ])('keeps whole-hour slots on Lord Howe Island\'s half-hour %s day', async (_desc, initialDate, slotCount, firstHours, events, transitionMinutes) => {
        const calendar = await renderDst({ timeZone: 'Australia/Lord_Howe', initialDate, slotDuration: '01:00', events })

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(slotCount)
        expect(slotDates.slice(0, 4)).toEqual(firstHours.map((hour) => `${initialDate}T${hour}:00:00`))
        expect(slotDates.every((date) => date.endsWith(':00:00'))).toBe(true)

        const transitionEvent = calendar.getEventById('transition')!
        const afterEvent = calendar.getEventById('after')!
        expect(transitionEvent.end!.valueOf() - transitionEvent.start!.valueOf()).toBe(transitionMinutes * 60 * 1000)
        expect(afterEvent.end!.valueOf() - afterEvent.start!.valueOf()).toBe(60 * 60 * 1000)
        expectEventSpansSlots(calendar.el, 'transition', 1, 2)
        expectEventSpansSlots(calendar.el, 'after', 2, 3)
      })

      it('doubles the repeated 02:00 hour on Sydney\'s fall-back day', async () => {
        const calendar = await renderDst({ timeZone: 'Australia/Sydney', initialDate: '2025-04-06' }) // 03:00 AEDT -> 02:00 AEST

        const slotDates = getSlotDates(calendar.el)
        expect(slotDates).toHaveLength(50)
        expect(slotDates.slice(4, 9)).toEqual([
          '2025-04-06T02:00:00', // first copy (AEDT)
          '2025-04-06T02:30:00',
          '2025-04-06T02:00:00', // second copy (AEST)
          '2025-04-06T02:30:00',
          '2025-04-06T03:00:00',
        ])
      })
    })
  })
})
