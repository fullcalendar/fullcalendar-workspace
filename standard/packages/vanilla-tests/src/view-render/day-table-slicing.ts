import internalClassNames from 'fullcalendar/protected-styles'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper'
import { DayGridViewWrapper } from '../lib/wrappers/DayGridViewWrapper'
import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper'
import { DayGridWrapper } from '../lib/wrappers/DayGridWrapper'
import { waitTimeout } from '../lib/misc'
import { findElements } from '../lib/dom-misc'

/*
Characterization of the day-table slicing pipeline (DayGrid and TimeGrid), recorded from the code
before phase 7b replaced it (planning/phase-7b-day-table-plan.md, section 4.2, "Standard,
view-render/day-table-slicing.ts"). Every assertion is today's behavior, quirks included; the
rewrite must keep them.
*/
describe('day-table slicing', () => {
  pushOptions({
    timeZone: 'UTC',
    initialDate: '2024-01-17', // a Wednesday
    now: '2024-01-17T10:00:00',
    scrollTime: '00:00',
    height: 800,
  })

  // 1. hidden days
  // -----------------------------------------------------------------------------------------------

  describe('hidden days', () => {
    pushOptions({
      initialView: 'dayGridWeek',
      nextDayThreshold: '09:00',
    })

    describe('with an interior hidden day', () => {
      pushOptions({
        hiddenDays: [4], // Thursday the 18th
      })

      // DaySeriesModel.sliceRange: an endpoint on a hidden day clamps inward, isEnd false
      it('clamps a timed event whose threshold-adjusted end lands on the hidden day', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-16T10:00:00', end: '2024-01-18T10:00:00' }, // 10:00 is past the 09:00 threshold, so the 18th counts
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEls = dayGridWrapper.getEventEls()

        expect(eventEls.length).toBe(1)
        expectEventFlags(eventEls[0], { isStart: true, isEnd: false })
        expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-16', '2024-01-17')
      })

      it('keeps isEnd when the threshold-adjusted end stops before the hidden day', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-16T10:00:00', end: '2024-01-18T08:00:00' }, // 08:00 is before the threshold, so the 18th doesn't count
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEls = dayGridWrapper.getEventEls()

        expect(eventEls.length).toBe(1)
        expectEventFlags(eventEls[0], { isStart: true, isEnd: true })
        expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-16', '2024-01-17')
      })

      it('clamps a timed event that starts on the hidden day, isStart false', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-18T10:00:00', end: '2024-01-20T10:00:00' },
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEls = dayGridWrapper.getEventEls()

        expect(eventEls.length).toBe(1)
        expectEventFlags(eventEls[0], { isStart: false, isEnd: true })
        expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-19', '2024-01-20')
      })

      it('drops a timed event that lives only on the hidden day', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-18T10:00:00', end: '2024-01-18T12:00:00' },
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

        expect(dayGridWrapper.getEventEls().length).toBe(0)
      })
    })

    // hidden weekends are trimmed off the active range, so the clamp is the active-range clip
    describe('with hidden weekends', () => {
      pushOptions({
        weekends: false,
      })

      it('clamps a timed event whose threshold-adjusted end lands on Saturday', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-18T10:00:00', end: '2024-01-20T10:00:00' },
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEls = dayGridWrapper.getEventEls()

        expect(eventEls.length).toBe(1)
        expectEventFlags(eventEls[0], { isStart: true, isEnd: false })
        expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-18', '2024-01-19')
      })

      it('clamps a timed event that starts on Sunday, isStart false', () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-01-14T10:00:00', end: '2024-01-16T10:00:00' },
          ],
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let eventEls = dayGridWrapper.getEventEls()

        expect(eventEls.length).toBe(1)
        expectEventFlags(eventEls[0], { isStart: false, isEnd: true })
        expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-15', '2024-01-16')
      })
    })
  })

  // 2. list-item multi-day
  // -----------------------------------------------------------------------------------------------

  describe('a multi-day event displayed as a list-item', () => {
    pushOptions({
      events: [
        { title: 'multi', start: '2024-01-16', end: '2024-01-19', display: 'list-item' },
      ],
    })

    // forceDayIfListItem in DayTableSlicer
    it('occupies one day in dayGridMonth', () => {
      let calendar = initCalendar({
        initialView: 'dayGridMonth',
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let eventEls = dayGridWrapper.getEventEls()

      expect(eventEls.length).toBe(1)
      expectEventWithinDays(eventEls[0], dayGridWrapper, '2024-01-16', '2024-01-16')
    })

    // forceDayIfListItem in DaySeriesSlicer
    it('occupies one day in the all-day row of timeGridWeek', () => {
      let calendar = initCalendar({
        initialView: 'timeGridWeek',
      })
      let allDayWrapper = new TimeGridViewWrapper(calendar).dayGrid
      let eventEls = allDayWrapper.getEventEls()

      expect(eventEls.length).toBe(1)
      expectEventWithinDays(eventEls[0], allDayWrapper, '2024-01-16', '2024-01-16')
    })
  })

  // 3. all-day background events in timeGrid
  // -----------------------------------------------------------------------------------------------

  describe('an all-day background event in timeGridWeek', () => {
    pushOptions({
      initialView: 'timeGridWeek',
    })

    // AllDaySplitter sends all-day defs with a def-level background display to both lanes
    it('renders in the all-day row and in the timed columns when the event sets display', () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-01-16', end: '2024-01-18', display: 'background' },
        ],
      })
      let viewWrapper = new TimeGridViewWrapper(calendar)

      expect(viewWrapper.dayGrid.getBgEventEls().length).toBe(1)
      expect(getBgEventCountsByCol(viewWrapper.timeGrid)).toEqual([0, 0, 1, 1, 0, 0, 0])
    })

    // the lane decision reads def.ui.display, not the compiled UI, so a source-level display
    // keeps the def in the all-day lane only, where the compiled UI then renders it as background
    it('renders in the all-day row only when the event source sets display', () => {
      let calendar = initCalendar({
        eventSources: [
          {
            display: 'background',
            events: [
              { start: '2024-01-16', end: '2024-01-18' },
            ],
          },
        ],
      })
      let viewWrapper = new TimeGridViewWrapper(calendar)

      expect(viewWrapper.dayGrid.getBgEventEls().length).toBe(1)
      expect(getBgEventCountsByCol(viewWrapper.timeGrid)).toEqual([0, 0, 0, 0, 0, 0, 0])
    })
  })

  // 4. inverse-background
  // -----------------------------------------------------------------------------------------------

  describe('inverse-background events', () => {
    pushOptions({
      // marks each background element with its group, or its event id when ungrouped
      backgroundEventClass(info) {
        return 'bg-' + (info.event.groupId || info.event.id)
      },
    })

    describe('in timeGridWeek, timed', () => {
      pushOptions({
        initialView: 'timeGridWeek',
        events: [
          { id: 'a', groupId: 'g', display: 'inverse-background', start: '2024-01-16T10:00:00', end: '2024-01-16T12:00:00' },
          { id: 'b', groupId: 'g', display: 'inverse-background', start: '2024-01-17T14:00:00', end: '2024-01-17T16:00:00' },
          { id: 'n', display: 'background', start: '2024-01-16T02:00:00', end: '2024-01-16T03:00:00' },
          { id: 'd', display: 'inverse-background', start: '2024-03-05T10:00:00', end: '2024-03-05T12:00:00' }, // no in-range instance
          { id: 'e', groupId: 'h', display: 'inverse-background', start: '2024-03-06T10:00:00', end: '2024-03-06T12:00:00' }, // no in-range instance
        ],
      })

      it('renders one complement across both grouped defs, whole-range complements for defs without an in-range instance, after the plain background', () => {
        let calendar = initCalendar()
        let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid

        // per column: the group's complement pieces, then group h's, then d's
        expect(getBgMarkersByCol(timeGridWrapper)).toEqual([
          ['bg-g', 'bg-h', 'bg-d'], // Sun
          ['bg-g', 'bg-h', 'bg-d'], // Mon
          ['bg-n', 'bg-g', 'bg-g', 'bg-h', 'bg-d'], // Tue: the plain bg, then 00:00-10:00 and 12:00-24:00
          ['bg-g', 'bg-g', 'bg-h', 'bg-d'], // Wed: 00:00-14:00 and 16:00-24:00
          ['bg-g', 'bg-h', 'bg-d'], // Thu
          ['bg-g', 'bg-h', 'bg-d'], // Fri
          ['bg-g', 'bg-h', 'bg-d'], // Sat
        ])

        // timed defs never reach the all-day lane
        expect(new TimeGridViewWrapper(calendar).dayGrid.getBgEventEls().length).toBe(0)
      })
    })

    describe('in dayGridMonth, all-day', () => {
      pushOptions({
        initialView: 'dayGridMonth',
        events: [
          { id: 'a', groupId: 'g', display: 'inverse-background', start: '2024-01-16' },
          { id: 'b', groupId: 'g', display: 'inverse-background', start: '2024-01-17', end: '2024-01-19' },
          { id: 'n', display: 'background', start: '2023-12-31' },
          { id: 'd', display: 'inverse-background', start: '2024-03-05' }, // no in-range instance
          { id: 'e', groupId: 'h', display: 'inverse-background', start: '2024-03-06' }, // no in-range instance
        ],
      })

      it('renders one complement across both grouped defs, whole-range complements for defs without an in-range instance, after the plain background', () => {
        let calendar = initCalendar()
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

        // per row: fills are grouped by start column, in seg order within a column
        expect(getBgMarkersByRow(dayGridWrapper)).toEqual([
          ['bg-n', 'bg-g', 'bg-h', 'bg-d'], // Dec 31 - Jan 6: all start in the first column
          ['bg-g', 'bg-h', 'bg-d'], // Jan 7 - 13
          ['bg-g', 'bg-h', 'bg-d', 'bg-g'], // Jan 14 - 20: Jan 14-15, then Jan 19-20
          ['bg-g', 'bg-h', 'bg-d'], // Jan 21 - 27
          ['bg-g', 'bg-h', 'bg-d'], // Jan 28 - Feb 3
          ['bg-g', 'bg-h', 'bg-d'], // Feb 4 - 10
        ])
      })
    })
  })

  // 5. sort ties
  // -----------------------------------------------------------------------------------------------

  describe('sort ties between a single event and a recurring instance', () => {
    pushOptions({
      eventClass(info) {
        return 'ev-' + info.event.id
      },
    })

    // sliceEventStore iterates instances in store order, and expandRecurring appends recurring
    // instances after the plain ones, whichever def came first. sortEventSegs is stable
    describeValues({
      'single event first': [
        { id: 'single', title: 'Tie', start: '2024-01-16T10:00:00', end: '2024-01-16T11:00:00' },
        { id: 'rec', title: 'Tie', daysOfWeek: [2], startTime: '10:00', endTime: '11:00' },
      ],
      'recurring def first': [
        { id: 'rec', title: 'Tie', daysOfWeek: [2], startTime: '10:00', endTime: '11:00' },
        { id: 'single', title: 'Tie', start: '2024-01-16T10:00:00', end: '2024-01-16T11:00:00' },
      ],
    }, (events) => {
      it('renders the single event first in dayGridMonth', () => {
        let calendar = initCalendar({
          initialView: 'dayGridMonth',
          events,
        })
        let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
        let dayEl = dayGridWrapper.getDayEl('2024-01-16') as HTMLElement

        expect(getEventIds(dayEl)).toEqual(['single', 'rec'])
      })

      it('renders the single event first in timeGridWeek', () => {
        let calendar = initCalendar({
          initialView: 'timeGridWeek',
          events,
        })
        let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
        let colEl = timeGridWrapper.getDayEls('2024-01-16')[0]

        expect(getEventIds(colEl)).toEqual(['single', 'rec'])
      })
    })
  })

  // 6. event selection across lanes
  // -----------------------------------------------------------------------------------------------

  describe('event selection in timeGridWeek', () => {
    pushOptions({
      initialView: 'timeGridWeek',
      editable: true,
      longPressDelay: 100,
      eventClass(info) {
        return 'ev-' + info.event.id
      },
      events: [
        { id: 'allday', title: 'All-day', start: '2024-01-16' },
        { id: 'timed', title: 'Timed', start: '2024-01-16T10:00:00', end: '2024-01-16T11:00:00' },
      ],
    })

    it('marks the all-day event in the all-day row, then the timed event in its column', async () => {
      let calendar = initCalendar()
      let viewWrapper = new TimeGridViewWrapper(calendar)
      await waitTimeout()

      await touchPress(viewWrapper.dayGrid.getEventEls()[0])
      expect(getSelectedEventIds(calendar)).toEqual(['allday'])
      expect(viewWrapper.dayGrid.getEventEls()[0].classList.contains(internalClassNames.internalEventSelected)).toBe(true)

      await touchPress(viewWrapper.timeGrid.getEventEls()[0])
      expect(getSelectedEventIds(calendar)).toEqual(['timed'])
      expect(viewWrapper.timeGrid.getEventEls()[0].classList.contains(internalClassNames.internalEventSelected)).toBe(true)
    })

    // a mouse interaction clears a touch selection (EventDragging.handleDragStart)
    it('clears the selection on a mouse interaction', async () => {
      let calendar = initCalendar()
      let viewWrapper = new TimeGridViewWrapper(calendar)
      await waitTimeout()

      await touchPress(viewWrapper.dayGrid.getEventEls()[0])
      expect(getSelectedEventIds(calendar)).toEqual(['allday'])

      await mousePress(viewWrapper.timeGrid.getEventEls()[0])
      expect(getSelectedEventIds(calendar)).toEqual([])
    })
  })

  // 7. now-indicator clipping
  // -----------------------------------------------------------------------------------------------

  /*
  The now indicator is sliced against the civil active range (nextDayThreshold is passed, so
  computeActiveRange doesn't widen it by slotMinTime/slotMaxTime), but the date profile's
  activeRange is already widened by them (adjustActiveRange), so the indicator renders anywhere
  within the slot-extended day. The plan expected "no line" at 01:00 the next civil day; today's
  code renders it, consistent with legacy/nowIndicator.ts
  */
  describe('now-indicator clipping in timeGridDay', () => {
    pushOptions({
      initialView: 'timeGridDay',
      initialDate: '2024-01-16',
      nowIndicator: true,
    })

    describe('with slotMaxTime past midnight', () => {
      pushOptions({
        slotMaxTime: '26:00',
      })

      describeValues({
        'at 01:00 the next civil day': { now: '2024-01-17T01:00:00', expected: true },
        'at activeRange.end - 1s': { now: '2024-01-17T01:59:59', expected: true },
        'at activeRange.end': { now: '2024-01-17T02:00:00', expected: false },
        'past the extended end': { now: '2024-01-17T03:00:00', expected: false },
        'at activeRange.start': { now: '2024-01-16T00:00:00', expected: true },
        'before activeRange.start': { now: '2024-01-15T23:59:00', expected: false },
      }, ({ now, expected }) => {
        it(`${expected ? 'renders' : 'does not render'}`, async () => {
          let calendar = initCalendar({ now })
          await waitTimeout()
          let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid

          expect(timeGridWrapper.hasNowIndicator()).toBe(expected)
        })
      })
    })

    describe('with slotMinTime before midnight', () => {
      pushOptions({
        slotMinTime: '-02:00',
      })

      describeValues({
        'at 23:00 the previous civil day': { now: '2024-01-15T23:00:00', expected: true },
        'at activeRange.start': { now: '2024-01-15T22:00:00', expected: true },
        'before activeRange.start': { now: '2024-01-15T21:59:00', expected: false },
        'at activeRange.end - 1s': { now: '2024-01-16T23:59:59', expected: true },
        'at activeRange.end': { now: '2024-01-17T00:00:00', expected: false },
      }, ({ now, expected }) => {
        it(`${expected ? 'renders' : 'does not render'}`, async () => {
          let calendar = initCalendar({ now })
          await waitTimeout()
          let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid

          expect(timeGridWrapper.hasNowIndicator()).toBe(expected)
        })
      })
    })
  })

  // 8. cross-lane drags
  // -----------------------------------------------------------------------------------------------

  /*
  The per-lane event UI bases include a def's individual (event source) base only in the lane the
  def belongs to in the current, unmutated store. A mirror sliced in the other lane is compiled
  without it and loses the source color. Only the timed lane renders event mirrors for a drag: the
  all-day row (DayGridRow.getMirrorSegs) renders drag segs as a highlight, so the plan's
  timed-to-all-day mirror isn't observable; the reverse direction is
  */
  describe('cross-lane drags of an event from a colored source', () => {
    pushOptions({
      initialView: 'timeGridWeek',
      editable: true,
      dragScroll: false,
    })

    function buildEventClassRecorder(calls: EventClassCall[]) {
      return (info) => {
        calls.push({
          id: info.event.id,
          isMirror: info.isMirror,
          isDragging: info.isDragging,
          color: info.color,
        })
        return ''
      }
    }

    it('all-day to timed: hides the original in the all-day row and shows an uncolored mirror in the column', async () => {
      let eventClassCalls: EventClassCall[] = []
      let calendar = initCalendar({
        eventSources: [
          {
            color: 'red',
            events: [
              { id: '1', title: 'All-day', start: '2024-01-16' },
            ],
          },
        ],
        eventClass: buildEventClassRecorder(eventClassCalls),
      })
      let viewWrapper = new TimeGridViewWrapper(calendar)
      let timeGridWrapper = viewWrapper.timeGrid
      let allDayWrapper = viewWrapper.dayGrid
      await waitTimeout()

      let originalEl = allDayWrapper.getEventEls()[0]
      expect(originalEl.style.getPropertyValue('--fc-event-color')).toBe('red')

      let midDrag: any = null
      let startRect = originalEl.getBoundingClientRect()
      let endRect = timeGridWrapper.computeSpanRects(
        '2024-01-16T02:00:00',
        '2024-01-16T02:30:00',
      )[0]

      eventClassCalls.length = 0
      await simulateDrag(originalEl, startRect, endRect, () => {
        let timedMirrorEls = timeGridWrapper.getMirrorEls()
        midDrag = {
          allDayMirrorCount: allDayWrapper.getMirrorEls().length,
          allDayHighlightCount: allDayWrapper.getHighlightEls().length,
          timedMirrorCount: timedMirrorEls.length,
          originalVisibility: getComputedStyle(originalEl).visibility,
          mirrorColor: timedMirrorEls[0] && timedMirrorEls[0].style.getPropertyValue('--fc-event-color'),
          mirrorCalls: eventClassCalls.filter((call) => call.isMirror),
        }
      })

      // the all-day lane's interaction has affectedInstances and no segs: the original is hidden,
      // nothing else renders there
      expect(midDrag.originalVisibility).toBe('hidden')
      expect(midDrag.allDayMirrorCount).toBe(0)
      expect(midDrag.allDayHighlightCount).toBe(0)

      // the timed lane's interaction has the segs: one mirror, compiled with the timed lane's bases,
      // which lack the def's source base, so it falls back to the eventColor option
      let defaultColor = calendar.getOption('eventColor')
      expect(defaultColor).not.toBe('red')
      expect(midDrag.timedMirrorCount).toBe(1)
      expect(midDrag.mirrorColor).toBe(defaultColor)
      expect(midDrag.mirrorCalls.length).toBeGreaterThan(0)
      // QUIRK: the mirror's isDragging is false: the affected def is all-day, so the timed lane's
      // interaction has segs but empty affectedInstances (AllDaySplitter splits them separately)
      expect(midDrag.mirrorCalls.every((call) => call.id === '1' && !call.isDragging && call.color === defaultColor)).toBe(true)

      // the hidden original kept its source color
      expect(eventClassCalls).toContain({ id: '1', isMirror: false, isDragging: true, color: 'red' })

      let event = calendar.getEventById('1')
      expect(event.allDay).toBe(false)
      expect(event.start).toEqualDate('2024-01-16T02:00:00Z')
    })

    it('timed to all-day: hides the original in the column and highlights the all-day cell, no mirror', async () => {
      let eventClassCalls: EventClassCall[] = []
      let calendar = initCalendar({
        eventSources: [
          {
            color: 'red',
            events: [
              { id: '1', title: 'Timed', start: '2024-01-16T09:00:00', end: '2024-01-16T10:00:00' },
            ],
          },
        ],
        eventClass: buildEventClassRecorder(eventClassCalls),
      })
      let viewWrapper = new TimeGridViewWrapper(calendar)
      let timeGridWrapper = viewWrapper.timeGrid
      let allDayWrapper = viewWrapper.dayGrid
      await waitTimeout()

      let originalEl = timeGridWrapper.getEventEls()[0]
      expect(originalEl.style.getPropertyValue('--fc-event-color')).toBe('red')

      let midDrag: any = null
      let startRect = originalEl.getBoundingClientRect()
      let endRect = allDayWrapper.getDayEls('2024-01-16')[0].getBoundingClientRect()

      eventClassCalls.length = 0
      await simulateDrag(originalEl, startRect, endRect, () => {
        midDrag = {
          timedMirrorCount: timeGridWrapper.getMirrorEls().length,
          allDayMirrorCount: allDayWrapper.getMirrorEls().length,
          allDayHighlightCount: allDayWrapper.getHighlightEls().length,
          originalVisibility: getComputedStyle(originalEl).visibility,
        }
      })

      // the timed lane's interaction has affectedInstances and no segs
      expect(midDrag.originalVisibility).toBe('hidden')
      expect(midDrag.timedMirrorCount).toBe(0)

      // the all-day lane's interaction has the segs, rendered as a highlight
      expect(midDrag.allDayMirrorCount).toBe(0)
      expect(midDrag.allDayHighlightCount).toBe(1)

      // mirrors only rendered while the pointer crossed the timed lane, in the def's own lane, so
      // they kept the source color
      expect(eventClassCalls.some((call) => call.isMirror)).toBe(true)
      expect(eventClassCalls.filter((call) => call.isMirror).every((call) => call.color === 'red')).toBe(true)
      expect(eventClassCalls).toContain({ id: '1', isMirror: false, isDragging: true, color: 'red' })

      let event = calendar.getEventById('1')
      expect(event.allDay).toBe(true)
      expect(event.start).toEqualDate('2024-01-16')
    })
  })

  // 9. timed background segs in all-day rows
  // -----------------------------------------------------------------------------------------------

  describe('timed background events', () => {
    it('render in the timed columns of timeGridWeek, never in the all-day row', () => {
      let calendar = initCalendar({
        initialView: 'timeGridWeek',
        events: [
          { start: '2024-01-16T10:00:00', end: '2024-01-16T12:00:00', display: 'background' },
        ],
      })
      let viewWrapper = new TimeGridViewWrapper(calendar)

      expect(viewWrapper.dayGrid.getBgEventEls().length).toBe(0)
      expect(getBgEventCountsByCol(viewWrapper.timeGrid)).toEqual([0, 0, 1, 0, 0, 0, 0])
    })

    // DayGridRows drops bg segs whose def is timed, after slicing. this includes the complement of
    // a timed inverse-background def, which is all-day in shape but keeps the timed def
    it('are dropped by dayGridMonth, inverse-background complements included', () => {
      let calendar = initCalendar({
        initialView: 'dayGridMonth',
        events: [
          { start: '2024-01-16T10:00:00', end: '2024-01-16T12:00:00', display: 'background' },
          { start: '2024-01-17T10:00:00', end: '2024-01-17T12:00:00', display: 'inverse-background' },
          { start: '2024-01-18', display: 'background' }, // the only one that survives
        ],
      })
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid

      expect(dayGridWrapper.getBgEventEls().length).toBe(1)
    })
  })
})

// Utils
// -------------------------------------------------------------------------------------------------

function expectEventFlags(eventEl: HTMLElement, flags: { isStart: boolean, isEnd: boolean }) {
  let info = new CalendarWrapper(null).getEventElInfo(eventEl)

  expect(info.isStart).toBe(flags.isStart)
  expect(info.isEnd).toBe(flags.isEnd)
}

// the event's horizontal extent is within the cells of the given days, touching both ends
function expectEventWithinDays(eventEl: HTMLElement, dayGridWrapper: DayGridWrapper, firstDate: string, lastDate: string) {
  let eventRect = eventEl.getBoundingClientRect()
  let firstRect = dayGridWrapper.getDayEls(firstDate)[0].getBoundingClientRect()
  let lastRect = dayGridWrapper.getDayEls(lastDate)[0].getBoundingClientRect()

  expect(eventRect.left).toBeGreaterThanOrEqual(firstRect.left - 1)
  expect(eventRect.left).toBeLessThan(firstRect.right)
  expect(eventRect.right).toBeLessThanOrEqual(lastRect.right + 1)
  expect(eventRect.right).toBeGreaterThan(lastRect.left)
}

function getBgEventCountsByCol(timeGridWrapper): number[] {
  return timeGridWrapper.getAllDayEls().map((colEl) => findElements(colEl, '.fc-bg-event').length)
}

function getBgMarkersByCol(timeGridWrapper): string[][] {
  return timeGridWrapper.getAllDayEls().map((colEl) => getBgMarkers(colEl))
}

function getBgMarkersByRow(dayGridWrapper: DayGridWrapper): string[][] {
  return dayGridWrapper.getRowEls().map((rowEl) => getBgMarkers(rowEl))
}

function getBgMarkers(containerEl: HTMLElement): string[] {
  return findElements(containerEl, '.fc-bg-event').map((el) => {
    let marker = Array.from(el.classList).find((className) => className.startsWith('bg-'))
    return marker || '(none)'
  })
}

function getEventIds(containerEl: HTMLElement): string[] {
  return findElements(containerEl, '.fc-event:not(.fc-bg-event)').map((el) => {
    let marker = Array.from(el.classList).find((className) => className.startsWith('ev-'))
    return marker ? marker.replace(/^ev-/, '') : '(none)'
  })
}

function getSelectedEventIds(calendar): string[] {
  return findElements(calendar.el, '.' + internalClassNames.internalEventSelected).map((el) => {
    let marker = Array.from(el.classList).find((className) => className.startsWith('ev-'))
    return marker ? marker.replace(/^ev-/, '') : '(none)'
  })
}

// a touch long-press with no movement. selects the event (EventDragging.handleDragStart)
function touchPress(el: HTMLElement) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      isTouch: true,
      delay: 200,
      onRelease: () => resolve(),
    })
  })
}

function mousePress(el: HTMLElement) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      dy: 5,
      onRelease: () => resolve(),
    })
  })
}

function simulateDrag(el: HTMLElement, startRect, endRect, onBeforeRelease: () => void) {
  return new Promise<void>((resolve) => {
    $(el).simulate('drag', {
      point: { left: (startRect.left + startRect.right) / 2, top: (startRect.top + startRect.bottom) / 2 },
      end: { left: (endRect.left + endRect.right) / 2, top: (endRect.top + endRect.bottom) / 2 },
      onBeforeRelease,
      onRelease: () => resolve(),
    })
  })
}

interface EventClassCall {
  id: string
  isMirror: boolean
  isDragging: boolean
  color: string | undefined
}
