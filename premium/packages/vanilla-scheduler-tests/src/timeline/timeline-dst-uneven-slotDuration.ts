import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatDateStrs, clickPoint, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
A 90-minute civil grid does not divide New York's one-hour DST shift. Grid
starts remain wall-clock-aligned, while the slot containing the transition has
an irregular real span: 1 hour on fall-back and 30 minutes on spring-forward.
The irregular slot still renders at full width, so positioning interpolates
within its real span and snap zones beyond that span are dead.
*/
describe('timeline DST with slotDuration not dividing the DST shift', () => {
  pushOptions({
    ...DST_TIMELINE_BASE_OPTIONS,
    slotDuration: '01:30',
  })

  describe('fall-back day', () => {
    pushOptions({
      initialDate: FALL_BACK_DAY,
    })

    it('keeps the civil grid and doubles its ambiguous 01:30 boundary', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)

      expect(slats.length).toBe(17)
      expect(getSlatDateStrs(slats, 0, 5)).toEqual([
        '2024-11-03T00:00:00',
        '2024-11-03T01:30:00', // first copy (EDT)
        '2024-11-03T01:30:00', // second copy (EST)
        '2024-11-03T03:00:00',
        '2024-11-03T04:30:00',
      ])
      expect(slats[16].dateStr).toBe('2024-11-03T22:30:00')
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

      expectCloseTo(eventRect.left, slats[0].left)
      expectCloseTo(eventRect.right, slats[16].right)
    })

    it('stretches time within the one-hour transition slot', async () => {
      let calendar = initCalendar({
        events: [
          // 06:00Z is halfway from first 01:30 (05:30Z) to second 01:30 (06:30Z).
          { start: '2024-11-03T00:00:00', end: '2024-11-03T01:00:00-05:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.right, (slats[1].left + slats[1].right) / 2)
    })

    it('hit-detects the transition slot, with a dead zone past its real span', async () => {
      let clickSpy
      let calendar = initCalendar({
        snapDuration: '00:30', // 3 nominal snap zones, but the transition slot has only 2 real ones
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-11-03T05:30:00Z')
          expect(info.dateStr).toBe('2024-11-03T01:30:00-04:00')
        })),
      })
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
      let transitionSlat = slats[1]
      let midTop = (transitionSlat.top + transitionSlat.bottom) / 2

      await clickPoint({
        left: transitionSlat.left + (transitionSlat.right - transitionSlat.left) * 0.15,
        top: midTop,
      })
      expect(clickSpy).toHaveBeenCalled()

      await clickPoint({
        left: transitionSlat.left + (transitionSlat.right - transitionSlat.left) * 0.85,
        top: midTop,
      })
      expect(clickSpy.calls.count()).toBe(1)
    })
  })

  describe('spring-forward day', () => {
    pushOptions({
      initialDate: SPRING_FORWARD_DAY,
    })

    it('keeps the civil grid around the gap', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)

      expect(slats.length).toBe(16)
      expect(getSlatDateStrs(slats, 0, 4)).toEqual([
        '2024-03-10T00:00:00',
        '2024-03-10T01:30:00',
        '2024-03-10T03:00:00',
        '2024-03-10T04:30:00',
      ])
      expect(slats[15].dateStr).toBe('2024-03-10T22:30:00')
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

      expectCloseTo(eventRect.left, slats[0].left)
      expectCloseTo(eventRect.right, slats[15].right)
    })

    it('stretches time within the 30-minute transition slot', async () => {
      let calendar = initCalendar({
        events: [
          // 06:45Z is halfway from 01:30 EST (06:30Z) to 03:00 EDT (07:00Z).
          { start: '2024-03-10T00:00:00', end: '2024-03-10T06:45:00Z' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expectCloseTo(eventRect.right, (slats[1].left + slats[1].right) / 2)
    })

    it('hit-detects the transition slot, with dead zones past its real span', async () => {
      let clickSpy
      let calendar = initCalendar({
        snapDuration: '00:30', // 3 nominal snap zones, but only the first has real time
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-03-10T06:30:00Z')
          expect(info.dateStr).toBe('2024-03-10T01:30:00-05:00')
        })),
      })
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
      let transitionSlat = slats[1]
      let midTop = (transitionSlat.top + transitionSlat.bottom) / 2

      await clickPoint({
        left: transitionSlat.left + (transitionSlat.right - transitionSlat.left) * 0.15,
        top: midTop,
      })
      expect(clickSpy).toHaveBeenCalled()

      await clickPoint({
        left: transitionSlat.left + (transitionSlat.right - transitionSlat.left) * 0.5,
        top: midTop,
      })
      expect(clickSpy.calls.count()).toBe(1)
    })
  })

  describe('in UTC', () => {
    pushOptions({
      timeZone: 'UTC',
      initialDate: FALL_BACK_DAY,
    })

    it('renders a uniform 16-slat day', async () => {
      let calendar = initCalendar({
        events: [
          { start: '2024-11-03T00:00:00', end: '2024-11-04T00:00:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

      expect(slats.length).toBe(16)
      expectCloseTo(eventRect.left, slats[0].left)
      expectCloseTo(eventRect.right, slats[15].right)
    })
  })
})
