import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  NY_TIME_ZONE, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo,
} from '../lib/dst-timeline-utils'

/*
scrollTime has WALL-CLOCK semantics: '06:00' targets the slat labeled 06:00,
not 6 elapsed real hours from midnight. The two differ on DST-transition days
(7 real hours to civil 06:00 on fall-back, 5 on spring-forward).
See timeline-dst-slots for the slat-index layout of these days.
*/
describe('timeline DST scrollTime', () => {
  pushOptions({
    timeZone: NY_TIME_ZONE,
    initialView: 'timelineDay',
    slotDuration: '00:30',
    scrollTime: '06:00',
  })

  it('scrolls to the civil time on fall-back day', async () => {
    let calendar = initCalendar({
      initialDate: FALL_BACK_DAY,
    })
    await waitTimeout()

    let viewWrapper = new TimelineViewWrapper(calendar)
    let slats = getSlatInfo(viewWrapper.timelineGrid)

    // civil 06:00 is 7 REAL hours after midnight (the fold added one) = slat 14
    expect(slats[14].dateStr).toBe('2024-11-03T06:00:00')

    let slatLeft = $(slats[14].el).position().left
    let scrollLeft = viewWrapper.getHeaderScrollEl().scrollLeft

    expect(scrollLeft).toBeGreaterThan(0)
    expect(Math.abs(scrollLeft - slatLeft)).toBeLessThan(3)
  })

  it('scrolls to the civil time on spring-forward day', async () => {
    let calendar = initCalendar({
      initialDate: SPRING_FORWARD_DAY,
    })
    await waitTimeout()

    let viewWrapper = new TimelineViewWrapper(calendar)
    let slats = getSlatInfo(viewWrapper.timelineGrid)

    // civil 06:00 is 5 REAL hours after midnight (the gap removed one) = slat 10
    expect(slats[10].dateStr).toBe('2024-03-10T06:00:00')

    let slatLeft = $(slats[10].el).position().left
    let scrollLeft = viewWrapper.getHeaderScrollEl().scrollLeft

    expect(scrollLeft).toBeGreaterThan(0)
    expect(Math.abs(scrollLeft - slatLeft)).toBeLessThan(3)
  })
})
