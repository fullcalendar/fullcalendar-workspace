import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  NY_TIME_ZONE, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatDateStrs, clickPoint, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
A DST-transition day is not evenly divisible by every slotDuration. With 2-hour
slots, New York's 25-hour fall-back day yields 12 full slots plus a TRUNCATED
final slot representing only 1 real hour (rendered at full width, so time is
stretched inside it, the same way hidden days make the scale non-uniform).
Slot starts are epoch-stepped, so after the transition they land on ODD civil
hours. These tests pin the geometry: canvas width, event edge alignment, and
hit-detection must all agree on the visible slot count.
*/
describe('timeline DST with slotDuration not dividing the transition day', () => {
  pushOptions({
    timeZone: NY_TIME_ZONE,
    initialView: 'timelineDay',
    scrollTime: '00:00',
    slotDuration: '02:00',
  })

  describe('fall-back day (25 real hours)', () => {
    pushOptions({
      initialDate: FALL_BACK_DAY,
    })

    it('renders 13 slats, epoch-stepped past the fold', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      expect(slats.length).toBe(13) // ceil(25 real hours / 2)
      expect(getSlatDateStrs(slats, 0, 4)).toEqual([
        '2024-11-03T00:00:00', // EDT
        '2024-11-03T01:00:00', // the SECOND occurrence (EST). 2 real hours after midnight
        '2024-11-03T03:00:00',
        '2024-11-03T05:00:00',
      ])
      expect(slats[12].dateStr).toBe('2024-11-03T23:00:00') // truncated: only 1 real hour
    })

    it('renders a full-day event spanning all slats edge-to-edge', async () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-11-03T00:00:00', end: '2024-11-04T00:00:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.left, slats[0].left, 3)
      // the truncated final slot renders at full width, so the axis end is the slat's right edge
      expectCloseTo(eventRect.right, slats[12].right, 3)
    })

    it('stretches time within the truncated final slot', async () => {
      let calendar = initCalendar({
        events: [
          // ends halfway through the truncated slot's 1 REAL hour (23:00-00:00 EST),
          // which renders as half the slat's full width
          { start: '2024-11-03T22:00:00', end: '2024-11-03T23:30:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.right, (slats[12].left + slats[12].right) / 2, 3)
    })

    it('hit-detects the truncated slot, with a dead zone past its real span', async () => {
      let clickSpy
      let calendar = initCalendar({
        snapDuration: '01:00', // 2 snap zones per slat, but the truncated slat has 1 real hour
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-11-04T04:00:00Z') // 23:00 EST
          expect(info.dateStr).toBe('2024-11-03T23:00:00-05:00')
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let last = slats[12]
      let midTop = (last.top + last.bottom) / 2

      // first snap zone: the slot's real hour
      await clickPoint({ left: last.left + (last.right - last.left) * 0.25, top: midTop })
      expect(clickSpy).toHaveBeenCalled()

      // second snap zone: no real time behind it. no dateClick
      await clickPoint({ left: last.left + (last.right - last.left) * 0.75, top: midTop })
      expect(clickSpy.calls.count()).toBe(1)
    })
  })

  describe('spring-forward day (23 real hours)', () => {
    pushOptions({
      initialDate: SPRING_FORWARD_DAY,
    })

    it('renders 12 slats, epoch-stepped past the gap', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      expect(slats.length).toBe(12) // ceil(23 real hours / 2)
      expect(getSlatDateStrs(slats, 0, 3)).toEqual([
        '2024-03-10T00:00:00', // EST
        '2024-03-10T03:00:00', // 2 real hours later. 01:00 is skipped by stepping, 02:00 doesn't exist
        '2024-03-10T05:00:00',
      ])
      expect(slats[11].dateStr).toBe('2024-03-10T23:00:00') // truncated: only 1 real hour
    })

    it('renders a full-day event spanning all slats edge-to-edge', async () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-03-10T00:00:00', end: '2024-03-11T00:00:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.left, slats[0].left, 3)
      expectCloseTo(eventRect.right, slats[11].right, 3)
    })
  })

  describe('in UTC', () => { // regression guard: no DST, no truncation
    pushOptions({
      timeZone: 'UTC',
      initialDate: FALL_BACK_DAY,
    })

    it('renders a uniform 12-slat day', async () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-11-03T00:00:00', end: '2024-11-04T00:00:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expect(slats.length).toBe(12)
      expectCloseTo(eventRect.left, slats[0].left, 3)
      expectCloseTo(eventRect.right, slats[11].right, 3)
    })
  })
})
