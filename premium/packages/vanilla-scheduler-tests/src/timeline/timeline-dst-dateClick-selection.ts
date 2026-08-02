import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, SPRING_FORWARD_DAY,
  FALL_BACK_FIRST_0100_SLAT, FALL_BACK_FIRST_0130_SLAT,
  FALL_BACK_SECOND_0100_SLAT, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT,
  getSlatInfo, getSlatCenter, clickPoint, dragFromPointToPoint, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
Hits carry exact instants, so the two copies of a fall-back repeated hour are
individually addressable: dateClick/select on the second copy report the true
second-occurrence instant with the post-transition offset.
*/
describe('timeline DST dateClick and selection', () => {
  pushOptions({
    ...DST_TIMELINE_BASE_OPTIONS,
    selectable: true,
  })

  describe('dateClick', () => {
    it('reports the first copy of a repeated wallclock with pre-transition offset', async () => {
      let clickSpy
      let calendar = initCalendar({
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-11-03T05:30:00Z') // 01:30 EDT
          expect(info.dateStr).toBe('2024-11-03T01:30:00-04:00')
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      await clickPoint(getSlatCenter(slats[FALL_BACK_FIRST_0130_SLAT]))
      expect(clickSpy).toHaveBeenCalled()
    })

    it('reports the second copy of a repeated wallclock with post-transition offset', async () => {
      let clickSpy
      let calendar = initCalendar({
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-11-03T06:30:00Z') // 01:30 EST, one REAL hour later
          expect(info.dateStr).toBe('2024-11-03T01:30:00-05:00')
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      await clickPoint(getSlatCenter(slats[FALL_BACK_SECOND_0130_SLAT]))
      expect(clickSpy).toHaveBeenCalled()
    })

    it('reports post-gap times correctly on spring-forward day', async () => {
      let clickSpy
      let calendar = initCalendar({
        initialDate: SPRING_FORWARD_DAY,
        dateClick: (clickSpy = spyCall((info) => {
          expect(info.date).toEqualDate('2024-03-10T07:30:00Z') // 03:30 EDT
          expect(info.dateStr).toBe('2024-03-10T03:30:00-04:00')
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      await clickPoint(getSlatCenter(slats[5])) // 03:30 (index 5. gap hour absent)
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('selection', () => {
    it('spans the fold with real instants and correct offsets', async () => {
      let selectSpy
      let calendar = initCalendar({
        select: (selectSpy = spyCall((info) => {
          expect(info.start).toEqualDate('2024-11-03T05:00:00Z') // 01:00 EDT
          expect(info.end).toEqualDate('2024-11-03T07:00:00Z') // 02:00 EST. 2 REAL hours
          expect(info.startStr).toBe('2024-11-03T01:00:00-04:00')
          expect(info.endStr).toBe('2024-11-03T02:00:00-05:00')
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      // drag first 01:00 slat through second 01:30 slat
      await dragFromPointToPoint(
        getSlatCenter(slats[FALL_BACK_FIRST_0100_SLAT]),
        getSlatCenter(slats[FALL_BACK_SECOND_0130_SLAT]),
      )
      expect(selectSpy).toHaveBeenCalled()
    })

    it('highlights exactly the dragged slats, including the second copy', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      // select ONLY the second copy of the repeated hour
      await dragFromPointToPoint(
        getSlatCenter(slats[FALL_BACK_SECOND_0100_SLAT]),
        getSlatCenter(slats[FALL_BACK_SECOND_0130_SLAT]),
      )

      let highlightEls = timelineGrid.getHighlightEls()
      expect(highlightEls.length).toBeGreaterThanOrEqual(1)

      let rect = highlightEls[0].getBoundingClientRect()
      expectCloseTo(rect.left, slats[FALL_BACK_SECOND_0100_SLAT].left)
      expectCloseTo(rect.right, slats[FALL_BACK_SECOND_0130_SLAT].right)
    })

    it('resolves a programmatic select of an ambiguous civil time to the first copy', async () => {
      let calendar = initCalendar()
      await waitTimeout()

      // covers the derive-instants-from-markers path (no hit instants involved)
      calendar.select('2024-11-03T01:00:00', '2024-11-03T02:00:00')
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)
      let highlightEls = timelineGrid.getHighlightEls()

      expect(highlightEls.length).toBeGreaterThanOrEqual(1)
      let rect = highlightEls[0].getBoundingClientRect()
      // start resolves to first 01:00 (05:00Z), end to 02:00 (07:00Z):
      // 2 REAL hours, covering both copies of the repeated hour
      expectCloseTo(rect.left, slats[FALL_BACK_FIRST_0100_SLAT].left)
      expectCloseTo(rect.right, slats[FALL_BACK_0200_SLAT].left)
    })

    it('spans the gap with real instants on spring-forward day', async () => {
      let selectSpy
      let calendar = initCalendar({
        initialDate: SPRING_FORWARD_DAY,
        select: (selectSpy = spyCall((info) => {
          expect(info.start).toEqualDate('2024-03-10T06:00:00Z') // 01:00 EST
          expect(info.end).toEqualDate('2024-03-10T08:00:00Z') // 04:00 EDT. 2 REAL hours
        })),
      })
      await waitTimeout()

      let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
      let slats = getSlatInfo(timelineGrid)

      // drag 01:00 through 03:30 (civil span looks like 3h, real span is 2h)
      await dragFromPointToPoint(getSlatCenter(slats[2]), getSlatCenter(slats[5]))
      expect(selectSpy).toHaveBeenCalled()
    })
  })
})
