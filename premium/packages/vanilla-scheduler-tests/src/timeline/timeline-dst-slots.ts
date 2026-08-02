import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatDateStrs,
} from '../lib/dst-timeline-utils'

/*
The timed timeline axis enumerates a day-anchored civil grid, then resolves
each grid marker to its exact occurrence(s): fall-back renders the repeated
hour TWICE, spring-forward skips the nonexistent hour.
NOTE: uses timelineDay (not resourceTimelineDay) because it renders all slats
without virtualization, making whole-axis count assertions reliable.
*/
describe('timeline DST slot generation', () => {
  pushOptions(DST_TIMELINE_BASE_OPTIONS)

  describe('fall-back day', () => {
    pushOptions({
      initialDate: FALL_BACK_DAY,
    })

    it('renders 50 slats, with the repeated hour doubled', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      expect(slats.length).toBe(50) // 25 real hours x 2

      expect(getSlatDateStrs(slats, 0, 8)).toEqual([
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

    it('renders 25 hour labels, with the repeated hour labeled twice', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let header = new TimelineViewWrapper(calendar).header
      let hourRow = header.getDateRowCnt() - 1
      let labelEls = header.getDateEls(hourRow)

      expect(labelEls.length).toBe(25)
      expect(labelEls[1].getAttribute('data-date')).toBe('2024-11-03T01:00:00')
      expect(labelEls[2].getAttribute('data-date')).toBe('2024-11-03T01:00:00')
      expect(labelEls[3].getAttribute('data-date')).toBe('2024-11-03T02:00:00')
    })

    it('respects slotMinTime/slotMaxTime around the transition', async () => {
      let calendar = initCalendar({
        slotMinTime: '01:00',
        slotMaxTime: '04:00',
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      // civil window 01:00-04:00 contains the fold, so 4 real hours
      expect(slats.length).toBe(8)
      expect(getSlatDateStrs(slats, 0, 8)).toEqual([
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

    it('gives repeated slot lanes their exact instants and state', async () => {
      const laneMetaByDate = new Map<string, { isPast: boolean, isFuture: boolean }>()
      initCalendar({
        now: '2024-11-03T06:00:00Z', // start of the second 01:00 occurrence
        slotLaneClass(info) {
          laneMetaByDate.set(info.date.toISOString(), {
            isPast: info.isPast,
            isFuture: info.isFuture,
          })
          return ''
        },
      })
      await waitTimeout()

      expect(laneMetaByDate.get('2024-11-03T05:00:00.000Z')).toEqual({
        isPast: true,
        isFuture: false,
      })
      expect(laneMetaByDate.get('2024-11-03T06:00:00.000Z')).toEqual({
        isPast: false,
        isFuture: false,
      })
    })
  })

  describe('spring-forward day', () => {
    pushOptions({
      initialDate: SPRING_FORWARD_DAY,
    })

    it('renders 46 slats, skipping the nonexistent hour', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      expect(slats.length).toBe(46) // 23 real hours x 2

      expect(getSlatDateStrs(slats, 2, 4)).toEqual([
        '2024-03-10T01:00:00',
        '2024-03-10T01:30:00',
        '2024-03-10T03:00:00', // 02:00-03:00 does not exist
        '2024-03-10T03:30:00',
      ])
    })

    it('renders 23 hour labels with no label for the nonexistent hour', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let header = new TimelineViewWrapper(calendar).header
      let hourRow = header.getDateRowCnt() - 1
      let labelEls = header.getDateEls(hourRow)

      expect(labelEls.length).toBe(23)
      // hour labels: 0=00:00, 1=01:00, 2=03:00 (02:00 does not exist)
      expect(labelEls[1].getAttribute('data-date')).toBe('2024-03-10T01:00:00')
      expect(labelEls[2].getAttribute('data-date')).toBe('2024-03-10T03:00:00')
    })
  })

  describe('in UTC', () => { // regression guard: no DST, no change
    pushOptions({
      timeZone: 'UTC',
      initialDate: FALL_BACK_DAY,
    })

    it('renders a uniform 48-slat day', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      expect(slats.length).toBe(48)
      expect(getSlatDateStrs(slats, 2, 3)).toEqual([
        '2024-11-03T01:00:00',
        '2024-11-03T01:30:00',
        '2024-11-03T02:00:00',
      ])
    })
  })
})
