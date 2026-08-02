import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { waitEventDrag } from '@fullcalendar-tests/standard/lib/wrappers/interaction-util'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, SPRING_FORWARD_DAY,
  FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT,
  FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT,
  getSlatInfo, getSlatStartPoint, dragEventToPoint, expectCloseTo, expectEventSpansSlats,
} from '../lib/dst-timeline-utils'

/*
Durable instant fidelity: an event whose start/end input expresses an exact instant
(ISO with offset, Date object, epoch ms) keeps that identity on its range
(EventInstanceRange.instantStartMs/instantEndMs). It renders over the correct copy of
the doubled fall-back slots, its API getters report the true instant/offset, and the
fidelity survives an eventChange -> app-state -> re-parse round trip. Civil inputs
(and recurring expansions) still resolve to the FIRST occurrence.
*/
describe('timeline DST instant fidelity', () => {
  pushOptions(DST_TIMELINE_BASE_OPTIONS)

  it('reports supplied instants through event.start/startStr for both fold copies', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:00:00-04:00', end: '2024-11-03T01:30:00-04:00', title: 'edt' },
        { start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00', title: 'est' },
      ],
    })
    await waitTimeout()

    let [edt, est] = calendar.getEvents()
    expect(edt.start.toISOString()).toBe('2024-11-03T05:00:00.000Z')
    expect(edt.end.toISOString()).toBe('2024-11-03T05:30:00.000Z')
    expect(edt.startStr).toBe('2024-11-03T01:00:00-04:00')
    expect(edt.endStr).toBe('2024-11-03T01:30:00-04:00')
    expect(est.start.toISOString()).toBe('2024-11-03T06:30:00.000Z')
    expect(est.end.toISOString()).toBe('2024-11-03T07:00:00.000Z')
    expect(est.startStr).toBe('2024-11-03T01:30:00-05:00')
    expect(est.endStr).toBe('2024-11-03T02:00:00-05:00')
  })

  it('preserves an exact end that the fold makes civilly reversed', async () => {
    // 05:30Z -> 06:00Z is 30 real minutes whose civil reading crosses the fall-back
    // boundary: the end's canonical civil form is 01:00 EST, BEFORE the start's 01:30 EDT.
    // The exact end instant is preserved (the end marker is re-expressed in the start's
    // offset reading so the civil range stays ordered)
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.start.toISOString()).toBe('2024-11-03T05:30:00.000Z')
    expect(event.end.toISOString()).toBe('2024-11-03T06:00:00.000Z')
    expect(event.startStr).toBe('2024-11-03T01:30:00-04:00')
    expect(event.endStr).toBe('2024-11-03T01:00:00-05:00') // canonical New York reading of 06:00Z

    expectEventSpansSlats(calendar, FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT)
  })

  it('round-trips a fold-compressed range through its emitted strings', async () => {
    // the startStr/endStr emitted by the test above, fed back in as input
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T01:00:00-05:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.start.toISOString()).toBe('2024-11-03T05:30:00.000Z')
    expect(event.end.toISOString()).toBe('2024-11-03T06:00:00.000Z')

    expectEventSpansSlats(calendar, FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT)
  })

  it('round-trips exact instants across the spring-forward gap', async () => {
    let calendar = initCalendar({
      initialDate: SPRING_FORWARD_DAY,
      events: [
        { start: '2024-03-10T01:30:00-05:00', end: '2024-03-10T04:00:00-04:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.start.toISOString()).toBe('2024-03-10T06:30:00.000Z')
    expect(event.end.toISOString()).toBe('2024-03-10T08:00:00.000Z')
    expect(event.startStr).toBe('2024-03-10T01:30:00-05:00')
    expect(event.endStr).toBe('2024-03-10T04:00:00-04:00')
    expectEventSpansSlats(calendar, 3, 6)
  })

  it('derives a real-duration default end from an exact fold start', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:00:00-05:00' }, // 06:00Z, second 01:00. no end given
      ],
    })
    await waitTimeout()

    // the default 1-hour duration is applied in real time from the exact start, so the
    // derived end can't re-resolve to the wrong side of the fold
    expectEventSpansSlats(calendar, FALL_BACK_SECOND_0100_SLAT, FALL_BACK_0200_SLAT)
  })

  it('setDates with exact instants moves an event onto the second copy', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    event.setDates('2024-11-03T01:30:00-05:00', '2024-11-03T02:00:00-05:00')
    await waitTimeout()

    expect(event.start.toISOString()).toBe('2024-11-03T06:30:00.000Z')
    expect(event.startStr).toBe('2024-11-03T01:30:00-05:00')
    expect(event.end.toISOString()).toBe('2024-11-03T07:00:00.000Z')

    expectEventSpansSlats(calendar, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT)
  })

  it('setEnd with an exact instant extends to the true second-occurrence time', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T00:30:00', end: '2024-11-03T01:00:00' }, // 04:30Z -> 05:00Z
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    event.setEnd('2024-11-03T01:30:00-05:00') // second 01:30 (06:30Z)
    await waitTimeout()

    expect(event.end.toISOString()).toBe('2024-11-03T06:30:00.000Z')
    expect(event.endStr).toBe('2024-11-03T01:30:00-05:00')

    expectEventSpansSlats(calendar, 1, FALL_BACK_SECOND_0130_SLAT)
  })

  it('renders Date-object and epoch-ms inputs at the second copy', async () => {
    let calendar = initCalendar({
      events: [
        {
          start: new Date('2024-11-03T06:30:00Z'), // 01:30 EST (second copy)
          end: new Date('2024-11-03T07:00:00Z'),
          title: 'date-input',
        },
        {
          start: new Date('2024-11-03T06:30:00Z').valueOf(),
          end: new Date('2024-11-03T07:00:00Z').valueOf(),
          title: 'ms-input',
        },
      ],
    })
    await waitTimeout()

    let eventEls = new TimelineViewWrapper(calendar).timelineGrid.getEventEls()
    expect(eventEls.length).toBe(2)
    expectEventSpansSlats(calendar, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT, 0)
    expectEventSpansSlats(calendar, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT, 1)
  })

  it('round-trips an emitted startStr back to the same rendering position', async () => {
    let emittedStart: string
    let emittedEnd: string
    let calendar = initCalendar({
      editable: true,
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
      ],
      eventDrop(info) {
        emittedStart = info.event.startStr
        emittedEnd = info.event.endStr
      },
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    await waitEventDrag(
      calendar,
      () => dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[FALL_BACK_SECOND_0130_SLAT])),
    )
    expect(emittedStart).toBe('2024-11-03T01:30:00-05:00')

    // feed the emitted strings back in as a brand-new event (app-state round trip)
    calendar.getEvents()[0].remove()
    calendar.addEvent({ start: emittedStart, end: emittedEnd })
    await waitTimeout()

    expectEventSpansSlats(calendar, FALL_BACK_SECOND_0130_SLAT, FALL_BACK_0200_SLAT)
  })

  it('does not falsely detect overlap between the two fold copies', async () => {
    // exact ranges over the two copies civilly read the same (01:30-02:00), but overlap
    // validation compares exact instants, so dropping onto the FIRST copy is allowed
    // even though an event occupies the SECOND
    let dropSpy
    let calendar = initCalendar({
      editable: true,
      eventOverlap: false,
      events: [
        { id: 'moving', start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
        { start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00', title: 'est' },
      ],
      eventDrop: (dropSpy = spyCall(() => {})),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    let dropInfo = await waitEventDrag(
      calendar,
      () => dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[FALL_BACK_FIRST_0130_SLAT])),
    )
    await waitTimeout()
    expect(dropInfo).not.toBe(false)
    expect(dropSpy).toHaveBeenCalled()
    expectEventSpansSlats(calendar, FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT)

    // The converse must be rejected: the second 01:30 copy is occupied.
    dropInfo = await waitEventDrag(
      calendar,
      () => dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[FALL_BACK_SECOND_0130_SLAT])),
    )
    await waitTimeout()

    expect(dropInfo).toBe(false)
    expect(dropSpy.calls.count()).toBe(1)
    expect(calendar.getEventById('moving').start.toISOString()).toBe('2024-11-03T05:30:00.000Z')
    expectEventSpansSlats(calendar, FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0100_SLAT)
  })

  it('reports exact instants to eventAllow when dropping onto the second copy', async () => {
    let allowStartStrs: string[] = []
    let dropSpy
    let calendar = initCalendar({
      editable: true,
      eventAllow(span) {
        allowStartStrs.push(span.startStr)
        return true
      },
      events: [
        { start: '2024-11-03T00:00:00', end: '2024-11-03T00:30:00', className: 'event0' },
      ],
      eventDrop: (dropSpy = spyCall(() => {})),
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)

    let dropInfo = await waitEventDrag(
      calendar,
      () => dragEventToPoint($('.event0')[0], getSlatStartPoint(slats[FALL_BACK_SECOND_0130_SLAT])),
    )
    expect(dropInfo).not.toBe(false)
    expect(dropSpy).toHaveBeenCalled()

    // the final validation before the drop saw the true second-occurrence instant
    expect(allowStartStrs.length).toBeGreaterThan(0)
    expect(allowStartStrs[allowStartStrs.length - 1]).toBe('2024-11-03T01:30:00-05:00')
  })

  it('formats and civilly mutates a fold-compressed end via its canonical form', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]

    // formatRange resolves the exact end (canonically 01:00 EST), never the
    // representational 02:00 marker
    let text = event.formatRange({ hour: '2-digit', minute: '2-digit', hour12: false })
    expect(text).toContain('01:30')
    expect(text).toContain('01:00')
    expect(text).not.toContain('02:00')

    // a civil setEnd diffs and applies against the canonical end, so the requested
    // wallclock is honored exactly
    event.setEnd('2024-11-03T03:00:00')
    await waitTimeout()
    expect(event.endStr).toBe('2024-11-03T03:00:00-05:00')
  })

  it('resolves offset-less civil input in the fold to the first occurrence', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00', end: '2024-11-03T02:00:00' },
      ],
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)
    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

    expectCloseTo(eventRect.left, slats[FALL_BACK_FIRST_0130_SLAT].left)
    expect(calendar.getEvents()[0].startStr).toBe('2024-11-03T01:30:00-04:00')
  })

  it('resolves a recurring event in the fold to the first occurrence', async () => {
    let calendar = initCalendar({
      events: [
        { daysOfWeek: [0], startTime: '01:30', endTime: '02:00' }, // sunday
      ],
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)
    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()

    expectCloseTo(eventRect.left, slats[FALL_BACK_FIRST_0130_SLAT].left)
  })

  it('strips instants when converting a timed event to all-day', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.startStr).toBe('2024-11-03T01:30:00-05:00') // instant-carrying

    event.setAllDay(true)
    expect(event.allDay).toBe(true)
    expect(event.startStr).toBe('2024-11-03') // date-only: instants gone, no offset leakage
  })

  it('produces identical output in a fixed-offset (UTC) zone', async () => {
    let calendar = initCalendar({
      timeZone: 'UTC',
      events: [
        { start: '2024-11-03T01:30:00-04:00', end: '2024-11-03T02:00:00-04:00' },
      ],
    })
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.start.toISOString()).toBe('2024-11-03T05:30:00.000Z')
    expect(event.startStr).toBe('2024-11-03T05:30:00Z') // same as pre-instant-fidelity output

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)
    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[11].left)
  })

  it('recomputes markers from instants when the timeZone option changes', async () => {
    let calendar = initCalendar({
      events: [
        { start: '2024-11-03T01:30:00-05:00', end: '2024-11-03T02:00:00-05:00' },
      ],
    })
    await waitTimeout()

    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let slats = getSlatInfo(timelineGrid)
    let eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[FALL_BACK_SECOND_0130_SLAT].left)

    calendar.setOption('timeZone', 'UTC')
    await waitTimeout()

    let event = calendar.getEvents()[0]
    expect(event.start.toISOString()).toBe('2024-11-03T06:30:00.000Z') // exact instant kept
    expect(event.startStr).toBe('2024-11-03T06:30:00Z')

    slats = getSlatInfo(timelineGrid)
    eventRect = timelineGrid.getFirstEventEl().getBoundingClientRect()
    expectCloseTo(eventRect.left, slats[13].left)
  })
})
