import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  NY_TIME_ZONE, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
Events are positioned by exact instants (real elapsed time), not civil-marker
arithmetic, so events spanning a DST transition occupy the correct real-time
slats. See timeline-dst-slots for the slat-index layout of these days.
*/
describe('timeline DST event rendering', () => {
  pushOptions({
    timeZone: NY_TIME_ZONE,
    initialView: 'timelineDay',
    scrollTime: '00:00',
    slotDuration: '00:30',
  })

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

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.left, slats[1].left, 3)
      expectCloseTo(eventRect.right, slats[9].left, 3) // 03:30 slat is index 9
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

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventEls = timelineGrid.getEventEls()

      expect(eventEls.length).toBe(2)
      let edtRect = eventEls[0].getBoundingClientRect()
      let estRect = eventEls[1].getBoundingClientRect()
      expectCloseTo(edtRect.left, slats[3].left, 3) // first copy (05:30Z -> 06:00Z)
      expectCloseTo(edtRect.right, slats[4].left, 3)
      expectCloseTo(estRect.left, slats[5].left, 3) // second copy (06:30Z -> 07:00Z)
      expectCloseTo(estRect.right, slats[6].left, 3)
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

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.left, slats[3].left, 3) // 01:30
      expectCloseTo(eventRect.right, slats[5].left, 3) // up to 03:30 (index 5)
    })

    it('normalizes an event starting at a nonexistent time', async () => {
      let calendar = initCalendar({
        events: [
          // 02:30 doesn't exist. resolves forward to 03:30 real time
          { start: '2024-03-10T02:30:00', end: '2024-03-10T04:00:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.left, slats[5].left, 3) // 03:30 slat
      expectCloseTo(eventRect.right, slats[6].left, 3) // ends AT 04:00 (slat index 6)
    })
  })
})
