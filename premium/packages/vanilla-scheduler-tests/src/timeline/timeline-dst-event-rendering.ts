import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT,
  FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT,
  getSlatInfo, expectCloseTo, expectEventSpansSlats,
} from '../lib/dst-timeline-utils'

/*
Events are positioned by exact instants (real elapsed time), not civil-marker
arithmetic, so events spanning a DST transition occupy the correct real-time
slats. See timeline-dst-slots for the slat-index layout of these days.
*/
describe('timeline DST event rendering', () => {
  pushOptions(DST_TIMELINE_BASE_OPTIONS)

  describe('fall-back day', () => {
    pushOptions({
      initialDate: FALL_BACK_DAY,
    })

    it('renders an event spanning the fold with real-time width', async () => {
      let calendar = initCalendar({
        events: [
          // civil 00:30-03:30, but 4 REAL hours (fold adds an hour) = 8 slats
          { start: '2024-11-03T00:30:00', end: '2024-11-03T03:30:00' },
        ],
      })
      await waitTimeout()

      expectEventSpansSlats(calendar, 1, 9)
    })

    it('renders explicit-offset events in the fold at the correct copy', async () => {
      // event data stores exact instants alongside civil markers
      // (EventInstanceRange.instantStartMs/instantEndMs), so each event renders
      // over the copy of the doubled slots matching its real instant
      let calendar = initCalendar({
        events: [
          { start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00', title: 'edt' },
          { start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00', title: 'est' },
        ],
      })
      await waitTimeout()

      let eventEls = new TimelineViewWrapper(calendar).timelineGrid.getEventEls()
      expect(eventEls.length).toBe(2)
      expectEventSpansSlats(calendar, FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT, 0)
      expectEventSpansSlats(calendar, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT, 1)
    })

    it('reports a first-pass event as past during the second pass', async () => {
      let eventMeta: { isPast: boolean, isFuture: boolean } | undefined
      initCalendar({
        now: '2024-11-03T06:15:00Z', // 01:15 EST (second occurrence)
        events: [
          {
            title: 'first-pass',
            start: '2024-11-03T01:00:00-04:00',
            end: '2024-11-03T01:30:00-04:00',
          },
        ],
        eventClass(info) {
          if (info.event.title === 'first-pass') {
            eventMeta = {
              isPast: info.isPast,
              isFuture: info.isFuture,
            }
          }
          return ''
        },
      })
      await waitTimeout()

      expect(eventMeta).toEqual({
        isPast: true,
        isFuture: false,
      })
    })

    it('renders a background event spanning the fold with real-time width', async () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-11-03T00:30:00', end: '2024-11-03T03:30:00', display: 'background' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let bgEls = timelineGrid.getBgEventEls()

      expect(bgEls.length).toBe(1)
      let bgRect = bgEls[0].getBoundingClientRect()
      expectCloseTo(bgRect.left, slats[1].left)
      expectCloseTo(bgRect.right, slats[9].left)
    })

    it('renders businessHours around the transition with real-time width', async () => {
      let calendar = initCalendar({
        businessHours: {
          daysOfWeek: [0], // sunday
          startTime: '00:30',
          endTime: '03:30',
        },
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let nonBusinessEls = timelineGrid.getNonBusinessDayEls()

      // two non-business strips: day-start to 00:30, and 03:30 to day-end
      expect(nonBusinessEls.length).toBe(2)
      let rect0 = nonBusinessEls[0].getBoundingClientRect()
      let rect1 = nonBusinessEls[1].getBoundingClientRect()
      expectCloseTo(rect0.left, slats[0].left)
      expectCloseTo(rect0.right, slats[1].left)
      expectCloseTo(rect1.left, slats[9].left)
      expectCloseTo(rect1.right, slats[49].right)
    })
  })

  describe('spring-forward day', () => {
    pushOptions({
      initialDate: SPRING_FORWARD_DAY,
    })

    it('renders an event spanning the gap with real-time width', async () => {
      let calendar = initCalendar({
        events: [
          // civil 01:30-03:30, but only 1 REAL hour (gap removes an hour) = 2 slats
          { start: '2024-03-10T01:30:00', end: '2024-03-10T03:30:00' },
        ],
      })
      await waitTimeout()

      expectEventSpansSlats(calendar, 3, 5)
    })

    it('normalizes an event starting at a nonexistent time', async () => {
      let calendar = initCalendar({
        events: [
          // 02:30 doesn't exist. resolves forward to 03:30 real time
          { start: '2024-03-10T02:30:00', end: '2024-03-10T04:00:00' },
        ],
      })
      await waitTimeout()

      expectEventSpansSlats(calendar, 5, 6)
    })
  })
})
