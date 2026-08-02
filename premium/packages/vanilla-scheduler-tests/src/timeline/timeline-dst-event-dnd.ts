import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import {
  NY_TIME_ZONE, FALL_BACK_DAY, SPRING_FORWARD_DAY,
  getSlatInfo, getSlatStartPoint, dragEventToPoint, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
Drags between timed timeline hits move events by exact instant deltas
(slats dragged x real slot duration), never by civil-wallclock arithmetic —
so dragging across a DST transition lands exactly under the cursor.
*/
describe('timeline DST event drag-n-drop', () => {
  pushOptions({
    timeZone: NY_TIME_ZONE,
    initialView: 'timelineDay',
    initialDate: FALL_BACK_DAY,
    scrollTime: '00:00',
    slotDuration: '00:30',
    editable: true,
  })

  it('drags across the fall-back transition by exact instants', async () => {
    let dropSpy
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
      ],
      eventDrop: (dropSpy = spyCall((info) => {
        // moved 6 slats = 3 REAL hours: 04:00Z -> 07:00Z (civil 02:00 EST)
        expect(info.event.start).toEqualDate('2024-11-03T07:00:00Z')
        expect(info.event.end).toEqualDate('2024-11-03T07:30:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[6])) // 02:00 EST
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[6].left, 3)
  })

  it('drops onto the second copy of a repeated wallclock: stays there', async () => {
    // the drop's exact instant is persisted on the event range
    // (instantStartMs/instantEndMs), so the event renders over the second copy
    // and its reported instant/offset is the true second occurrence
    let dropSpy
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
      ],
      eventDrop: (dropSpy = spyCall((info) => {
        expect(info.event.start).toEqualDate('2024-11-03T06:30:00Z') // second 01:30 (EST)
        expect(info.event.startStr).toBe('2024-11-03T01:30:00-05:00')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[5])) // second 01:30
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[5].left, 3) // second copy
  })

  it('drags across the spring-forward gap by exact instants', async () => {
    let dropSpy
    let calendar = initCalendar({
      initialDate: SPRING_FORWARD_DAY,
      events: [
        { start: '2024-03-10T00:00:00', end: '2024-03-10T00:30:00', className: 'event0' },
      ],
      eventDrop: (dropSpy = spyCall((info) => {
        // moved 4 slats = 2 REAL hours: 05:00Z -> 07:00Z (civil 03:00 EDT)
        expect(info.event.start).toEqualDate('2024-03-10T07:00:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[4])) // 03:00 (post-gap)
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()

    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[4].left, 3)
  })

  it('drags across the fall-back transition in resource-timeline', async () => {
    // exercises the OTHER queryHit implementation (ResourceTimelineLayoutNormal)
    let dropSpy
    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      resources: [
        { id: 'a', title: 'Resource A' },
      ],
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', resourceId: 'a', className: 'event0' },
      ],
      eventDrop: (dropSpy = spyCall((info) => {
        expect(info.event.start).toEqualDate('2024-11-03T07:00:00Z')
      })),
    })
    await waitTimeout()

    let timelineGrid = new ResourceTimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid.base)
    let laneRect = timelineGrid.getResourceLaneEl('a').getBoundingClientRect()

    await dragEventToPoint($('.event0')[0], {
      left: slats[6].left + 1, // 02:00 EST
      top: (laneRect.top + laneRect.bottom) / 2,
    })
    await waitTimeout()
    expect(dropSpy).toHaveBeenCalled()
  })
})
