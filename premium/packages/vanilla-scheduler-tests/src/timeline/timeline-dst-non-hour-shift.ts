import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS,
  getSlatInfo, getSlatDateStrs, expectEventSpansSlats,
} from '../lib/dst-timeline-utils'

describe('timeline DST in zones with other transition rules', () => {
  describe('Australia/Lord_Howe with hour slots', () => {
    pushOptions({
      ...DST_TIMELINE_BASE_OPTIONS,
      timeZone: 'Australia/Lord_Howe',
      slotDuration: '01:00',
    })

    describe('spring-forward day', () => {
      pushOptions({
        initialDate: '2024-10-06', // 02:00 +10:30 -> 02:30 +11:00
      })

      it('keeps whole-hour grid starts and absorbs the half-hour shift', async () => {
        let calendar = initCalendar({
          events: [
            { start: '2024-10-06T01:00:00+10:30', end: '2024-10-06T03:00:00+11:00' },
            { start: '2024-10-06T03:00:00+11:00', end: '2024-10-06T04:00:00+11:00' },
          ],
        })
        await waitTimeout()

        let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
        let events = calendar.getEvents()

        expect(slats.length).toBe(23)
        expect(getSlatDateStrs(slats, 0, 4)).toEqual([
          '2024-10-06T00:00:00',
          '2024-10-06T01:00:00',
          '2024-10-06T03:00:00', // nonexistent 02:00 is skipped
          '2024-10-06T04:00:00',
        ])
        expect(slats.every((slat) => /:00:00$/.test(slat.dateStr))).toBe(true)
        expect(events[0].end.valueOf() - events[0].start.valueOf()).toBe(90 * 60 * 1000)
        expect(events[1].end.valueOf() - events[1].start.valueOf()).toBe(60 * 60 * 1000)
        expectEventSpansSlats(calendar, 1, 2, 0)
        expectEventSpansSlats(calendar, 2, 3, 1)
      })
    })

    describe('fall-back day', () => {
      pushOptions({
        initialDate: '2025-04-06', // 02:00 +11:00 -> 01:30 +10:30
      })

      it('keeps whole-hour grid starts and absorbs the half-hour shift', async () => {
        let calendar = initCalendar({
          events: [
            { start: '2025-04-06T01:00:00+11:00', end: '2025-04-06T02:00:00+10:30' },
            { start: '2025-04-06T02:00:00+10:30', end: '2025-04-06T03:00:00+10:30' },
          ],
        })
        await waitTimeout()

        let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
        let events = calendar.getEvents()

        expect(slats.length).toBe(24)
        expect(getSlatDateStrs(slats, 0, 4)).toEqual([
          '2025-04-06T00:00:00',
          '2025-04-06T01:00:00',
          '2025-04-06T02:00:00',
          '2025-04-06T03:00:00',
        ])
        expect(slats.every((slat) => /:00:00$/.test(slat.dateStr))).toBe(true)
        expect(events[0].end.valueOf() - events[0].start.valueOf()).toBe(90 * 60 * 1000)
        expect(events[1].end.valueOf() - events[1].start.valueOf()).toBe(60 * 60 * 1000)
        expectEventSpansSlats(calendar, 1, 2, 0)
        expectEventSpansSlats(calendar, 2, 3, 1)
      })
    })
  })

  describe('Australia/Sydney fall-back with 30-minute slots', () => {
    pushOptions({
      ...DST_TIMELINE_BASE_OPTIONS,
      timeZone: 'Australia/Sydney',
      initialDate: '2025-04-06', // 03:00 AEDT -> 02:00 AEST
    })

    it('doubles the repeated 02:00 hour', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
      expect(slats.length).toBe(50)
      expect(getSlatDateStrs(slats, 4, 5)).toEqual([
        '2025-04-06T02:00:00', // first copy (AEDT)
        '2025-04-06T02:30:00',
        '2025-04-06T02:00:00', // second copy (AEST)
        '2025-04-06T02:30:00',
        '2025-04-06T03:00:00',
      ])
    })
  })
})
