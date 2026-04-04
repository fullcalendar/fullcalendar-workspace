import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { TimelineViewWrapper } from '../lib/wrappers/TimelineViewWrapper'

describe('scrollTime', () => {
  it('has correct initial scrollTime in timelineDay', async () => {
    let calendar = initCalendar({
      initialDate: '2020-08-09',
      initialView: 'timelineDay',
      slotDuration: { minutes: 30 },
      scrollTime: '06:00',
    })
    let viewWrapper = new TimelineViewWrapper(calendar)
    let headerScrollEl = viewWrapper.getHeaderScrollEl()
    let bodyScrollEl = viewWrapper.getBodyScrollerEl()
    let headerSlotEl = viewWrapper.header.getDateElByDate('2020-08-09T06:00:00')
    let bodySlotEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T06:00:00')

    await waitTimeout()

    expect(headerSlotEl).toBeTruthy()
    expect(bodySlotEl).toBeTruthy()
    expect(
      Math.abs(
        headerScrollEl.getBoundingClientRect().left -
        headerSlotEl.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(
        bodyScrollEl.getBoundingClientRect().left -
        bodySlotEl.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1)
  })

  it('has correct initial scrollTime', async () => {
    let calendar = initCalendar({
      initialDate: '2020-08-09',
      initialView: 'resourceTimelineDay',
      slotDuration: { minutes: 30 },
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let headerScrollEl = viewWrapper.header.getScrollerEl()
    let bodyScrollEl = viewWrapper.getTimeBodyEl()
    let headerSlotEl = viewWrapper.header.getDateElByDate('2020-08-09T06:00:00')
    let bodySlotEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T06:00:00')

    await waitTimeout()

    expect(headerSlotEl).toBeTruthy()
    expect(bodySlotEl).toBeTruthy()
    expect(
      Math.abs(
        headerScrollEl.getBoundingClientRect().left -
        headerSlotEl.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(
        bodyScrollEl.getBoundingClientRect().left -
        bodySlotEl.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5351
  it('is preserved when prev/next with resources and nowIndicator', async () => {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeBodyEl()

    await waitTimeout()
    let origScroll = scrollEl.scrollLeft
    expect(origScroll).toBeGreaterThan(0)

    calendar.next()
    await waitTimeout()

    let newScroll = scrollEl.scrollLeft
    expect(newScroll).toBe(origScroll)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5351#issuecomment-667554437
  it('is preserved when returning to current-day date range', async () => {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeBodyEl()

    await waitTimeout()
    let origScroll = scrollEl.scrollLeft
    expect(origScroll).toBeGreaterThan(0)

    calendar.next()
    await waitTimeout()

    calendar.prev()
    await waitTimeout()

    let newScroll = scrollEl.scrollLeft
    expect(newScroll).toBe(origScroll)
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5645
  it('is disregarded when slots are a day or bigger', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth',
      scrollTime: '06:00',
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeBodyEl()

    await waitTimeout()
    let scroll = scrollEl.scrollLeft
    expect(scroll).toBe(0)
  })

  it('has correct scrollTime when switching timeline views', async () => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth',
      initialDate: '2020-08-09',
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    await ignoreResizeObserverLoops(async () => {
      calendar.changeView('resourceTimelineWeek')
      await waitTimeout()

      let scrollEl = viewWrapper.getTimeBodyEl()
      let slatEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T06:00:00')

      expect(
        Math.abs(
          scrollEl.getBoundingClientRect().left -
          slatEl.getBoundingClientRect().left,
        ),
      ).toBeLessThan(2)
    })
  })
})
