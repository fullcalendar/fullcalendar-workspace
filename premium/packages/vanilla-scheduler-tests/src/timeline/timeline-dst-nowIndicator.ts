import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'
import {
  DST_TIMELINE_BASE_OPTIONS, SPRING_FORWARD_DAY,
  FALL_BACK_FIRST_0130_SLAT, FALL_BACK_SECOND_0130_SLAT,
  getSlatInfo, expectCloseTo,
} from '../lib/dst-timeline-utils'

/*
The now-indicator is positioned from the exact instant of "now" (threaded via
NowTimer's nowMs), not from a civil marker, so it sweeps the full 25-hour
fall-back day monotonically.
*/
describe('timeline DST now-indicator', () => {
  pushOptions({
    ...DST_TIMELINE_BASE_OPTIONS,
    nowIndicator: true,
  })

  function getIndicatorLeft(calendar): number {
    let timelineGrid = new TimelineViewWrapper(calendar).timelineGrid
    let indicatorEl = timelineGrid.getNowIndicatorEl()
    expect(indicatorEl).toBeTruthy()
    return indicatorEl.getBoundingClientRect().left
  }

  it('positions at an unambiguous time', async () => {
    let calendar = initCalendar({
      now: '2024-11-03T00:30:00', // civil, unambiguous (04:30Z)
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[1].left)
  })

  it('positions in the FIRST pass of the fold', async () => {
    let calendar = initCalendar({
      now: '2024-11-03T05:30:00Z', // 01:30 EDT (first occurrence)
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[FALL_BACK_FIRST_0130_SLAT].left)
  })

  it('positions in the SECOND pass of the fold', async () => {
    let calendar = initCalendar({
      now: '2024-11-03T06:30:00Z', // 01:30 EST (second occurrence)
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[FALL_BACK_SECOND_0130_SLAT].left)
  })

  it('positions after the fold with real-time offset', async () => {
    let calendar = initCalendar({
      now: '2024-11-03T02:30:00', // civil, unambiguous again (07:30Z EST)
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[7].left)
  })

  it('positions after the gap on spring-forward day', async () => {
    let calendar = initCalendar({
      initialDate: SPRING_FORWARD_DAY,
      now: '2024-03-10T03:30:00', // 07:30Z EDT
    })
    await waitTimeout()

    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[5].left)
  })

  it('snaps to the correct slot with hour slots', async () => {
    let calendar = initCalendar({
      slotDuration: '01:00', // unit value 1 -> nowIndicatorSnap auto-enables
      now: '2024-11-03T06:40:00Z', // second 01:40, after the fold
    })
    await waitTimeout()

    // hour slats: 0=00:00, 1=01:00 EDT, 2=01:00 EST, 3=02:00 ...
    let slats = getSlatInfo(new TimelineViewWrapper(calendar).timelineGrid)
    expectCloseTo(getIndicatorLeft(calendar), slats[2].left)
  })
})
