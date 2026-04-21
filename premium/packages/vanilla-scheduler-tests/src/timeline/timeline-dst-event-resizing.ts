import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  NY_TIME_ZONE, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatCenter, resizeEventToPoint, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
Resizes between timed timeline hits apply exact instant deltas: extending an
event by N slats extends its real duration by N x slotDuration, even across a
DST transition.
*/
describe('timeline DST event resizing', () => {
  pushOptions({
    timeZone: NY_TIME_ZONE,
    initialView: 'timelineDay',
    initialDate: FALL_BACK_DAY,
    scrollTime: '00:00',
    slotDuration: '00:30',
    editable: true,
  })

  it('resizes an end across the fall-back transition by exact instants', async () => {
    let resizeSpy
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
      ],
      eventResize: (resizeSpy = spyCall((info) => {
        expect(info.event.start).toEqualDate('2024-11-03T04:00:00Z')
        // end covers through second 01:30 slat -> exclusive end 02:00 EST (07:00Z).
        // 3 REAL hours even though the civil span reads 2h
        expect(info.event.end).toEqualDate('2024-11-03T07:00:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    // drop the end-resizer INSIDE the second 01:30 slat (index 5)
    await resizeEventToPoint($('.event0')[0], getSlatCenter(slats[5]))
    await waitTimeout()
    expect(resizeSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[0].left, 3)
    expectCloseTo(eventRect.right, slats[6].left, 3) // through end of slat 5
  })

  it('resizes a start backward across the fall-back transition', async () => {
    let resizeSpy
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T02:30:00', end: '2024-11-03T03:00:00', className: 'event0' },
      ],
      eventResize: (resizeSpy = spyCall((info) => {
        // start pulled to the first 01:00 slat: 05:00Z (01:00 EDT).
        // end unchanged at civil 03:00 (08:00Z) -> 3 REAL hours duration
        expect(info.event.start).toEqualDate('2024-11-03T05:00:00Z')
        expect(info.event.end).toEqualDate('2024-11-03T08:00:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await resizeEventToPoint($('.event0')[0], getSlatCenter(slats[2]), true) // first 01:00
    await waitTimeout()
    expect(resizeSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[2].left, 3)
  })

  it('resizes an end across the spring-forward gap by exact instants', async () => {
    let resizeSpy
    let calendar = initCalendar({
      initialDate: SPRING_FORWARD_DAY,
      events: [
        { start: '2024-03-10T01:00:00', end: '2024-03-10T01:30:00', className: 'event0' },
      ],
      eventResize: (resizeSpy = spyCall((info) => {
        // end covers through the 03:00 slat -> exclusive end 03:30 (07:30Z).
        // only 1.5 REAL hours even though the civil span reads 2.5h
        expect(info.event.end).toEqualDate('2024-03-10T07:30:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await resizeEventToPoint($('.event0')[0], getSlatCenter(slats[4])) // 03:00 (post-gap)
    await waitTimeout()
    expect(resizeSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.right, slats[5].left, 3) // through end of the 03:00 slat
  })
})
