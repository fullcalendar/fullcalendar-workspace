import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatDateStrs, expectCloseTo, expectEventSpansSlats,
} from '../lib/dst-timeline-utils'

/*
The two-hour grid is generated from civil midnight on every day. A nonexistent
grid boundary is omitted, and the surrounding rendered slot absorbs the real
time through the transition. Other slots retain their two-hour real spans.
*/
describe('timeline DST with coarse slotDuration', () => {
  pushOptions({
    ...DST_TIMELINE_BASE_OPTIONS,
    slotDuration: '02:00',
    nowIndicator: true,
    nowIndicatorSnap: false,
  })

  function getIndicatorLeft(calendar): number {
    let indicatorEl = new TimelineViewWrapper(calendar).timelineGrid.getNowIndicatorEl()
    expect(indicatorEl).toBeTruthy()
    return indicatorEl.getBoundingClientRect().left
  }

  describe('fall-back day', () => {
    pushOptions({
      initialDate: FALL_BACK_DAY,
    })

    it('renders the complete even-hour civil grid', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
      expect(slats.length).toBe(12)
      expect(getSlatDateStrs(slats, 0, 12)).toEqual([
        '2024-11-03T00:00:00',
        '2024-11-03T02:00:00',
        '2024-11-03T04:00:00',
        '2024-11-03T06:00:00',
        '2024-11-03T08:00:00',
        '2024-11-03T10:00:00',
        '2024-11-03T12:00:00',
        '2024-11-03T14:00:00',
        '2024-11-03T16:00:00',
        '2024-11-03T18:00:00',
        '2024-11-03T20:00:00',
        '2024-11-03T22:00:00',
      ])
    })

    it('interpolates within the three-hour transition slot', async () => {
      let calendar = initCalendar({
        now: '2024-11-03T05:30:00Z', // halfway from 00:00 EDT to 02:00 EST
        events: [
          { start: '2024-11-03T00:00:00-04:00', end: '2024-11-03T01:30:00-04:00' },
          { start: '2024-11-03T02:00:00-05:00', end: '2024-11-03T04:00:00-05:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let transitionEventRect = timelineGrid.getEventEls()[0].getBoundingClientRect()
      let transitionMid = (slats[0].left + slats[0].right) / 2

      expectCloseTo(transitionEventRect.right, transitionMid)
      expectCloseTo(getIndicatorLeft(calendar), transitionMid)
      expectEventSpansSlats(calendar, 1, 2, 1)
      expect(calendar.getEvents()[0].end.valueOf() - calendar.getEvents()[0].start.valueOf())
        .toBe(90 * 60 * 1000) // half the three-hour transition slot
      expect(calendar.getEvents()[1].end.valueOf() - calendar.getEvents()[1].start.valueOf())
        .toBe(2 * 60 * 60 * 1000)
    })
  })

  describe('spring-forward day', () => {
    pushOptions({
      initialDate: SPRING_FORWARD_DAY,
    })

    it('skips the nonexistent 02:00 grid boundary', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
      expect(slats.length).toBe(11)
      expect(getSlatDateStrs(slats, 0, 11)).toEqual([
        '2024-03-10T00:00:00',
        '2024-03-10T04:00:00',
        '2024-03-10T06:00:00',
        '2024-03-10T08:00:00',
        '2024-03-10T10:00:00',
        '2024-03-10T12:00:00',
        '2024-03-10T14:00:00',
        '2024-03-10T16:00:00',
        '2024-03-10T18:00:00',
        '2024-03-10T20:00:00',
        '2024-03-10T22:00:00',
      ])
    })

    it('interpolates within the three-hour transition slot', async () => {
      let calendar = initCalendar({
        now: '2024-03-10T06:30:00Z', // halfway from 00:00 EST to 04:00 EDT
        events: [
          { start: '2024-03-10T00:00:00-05:00', end: '2024-03-10T01:30:00-05:00' },
          { start: '2024-03-10T04:00:00-04:00', end: '2024-03-10T06:00:00-04:00' },
        ],
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let transitionEventRect = timelineGrid.getEventEls()[0].getBoundingClientRect()
      let transitionMid = (slats[0].left + slats[0].right) / 2

      expectCloseTo(transitionEventRect.right, transitionMid)
      expectCloseTo(getIndicatorLeft(calendar), transitionMid)
      expectEventSpansSlats(calendar, 1, 2, 1)
      expect(calendar.getEvents()[0].end.valueOf() - calendar.getEvents()[0].start.valueOf())
        .toBe(90 * 60 * 1000) // half the three-hour transition slot
      expect(calendar.getEvents()[1].end.valueOf() - calendar.getEvents()[1].start.valueOf())
        .toBe(2 * 60 * 60 * 1000)
    })
  })
})
