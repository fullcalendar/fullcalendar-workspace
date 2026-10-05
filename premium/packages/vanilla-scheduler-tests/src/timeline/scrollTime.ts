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

  // https://github.com/fullcalendar/fullcalendar/issues/8093
  // When the whole timeline fits without scrolling, a time-based scroll is a no-op that fires no
  // scroll event. Whether initial render hits this depends on layout timing, so scrollToTime()
  // and a rerender are used to reproduce it deterministically.
  it('renders leading slots when virtualized and too wide to scroll', async () => {
    let el = document.createElement('div')
    el.style.width = '3000px' // wide enough for the whole day to fit without scrolling
    el.style.maxWidth = 'none' // override test stylesheet
    document.body.appendChild(el)

    await ignoreResizeObserverLoops(async () => {
      let calendar = initCalendar({
        initialDate: '2020-08-09',
        initialView: 'resourceTimelineDay',
        scrollTime: '12:00',
        virtualization: true,
        resources: [{ id: 'a', title: 'Resource A' }],
        events: [
          { resourceId: 'a', start: '2020-08-09T00:00:00', end: '2020-08-09T23:00:00', title: 'event' },
        ],
      }, el)

      try {
        await waitTimeout()
        expectLeadingSlotsRendered(calendar)

        calendar.scrollToTime('12:00')
        calendar.addEvent({ resourceId: 'a', start: '2020-08-09T23:00:00', title: 'rerender trigger' })
        await waitTimeout()
        expectLeadingSlotsRendered(calendar)
      } finally {
        calendar.destroy()
        el.remove()
      }
    })

    function expectLeadingSlotsRendered(calendar) {
      let viewWrapper = new ResourceTimelineViewWrapper(calendar)
      let headerScrollEl = viewWrapper.header.getScrollerEl()
      let bodyScrollEl = viewWrapper.getTimeBodyEl()
      let headerSlotEl = viewWrapper.header.getDateElByDate('2020-08-09T00:00:00')
      let bodySlotEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T00:00:00')
      let eventEl = viewWrapper.timelineGrid.getFirstEventEl()

      expect(bodyScrollEl.scrollWidth).toBeLessThanOrEqual(bodyScrollEl.clientWidth)
      expect(headerSlotEl).toBeTruthy()
      expect(bodySlotEl).toBeTruthy()
      expect(eventEl).toBeTruthy()

      if (headerSlotEl && bodySlotEl && eventEl) {
        let headerScrollLeft = headerScrollEl.getBoundingClientRect().left
        let bodyScrollLeft = bodyScrollEl.getBoundingClientRect().left

        expect(Math.abs(headerScrollLeft - headerSlotEl.getBoundingClientRect().left)).toBeLessThanOrEqual(1)
        expect(Math.abs(bodyScrollLeft - bodySlotEl.getBoundingClientRect().left)).toBeLessThanOrEqual(1)
        expect(Math.abs(bodyScrollLeft - eventEl.getBoundingClientRect().left)).toBeLessThanOrEqual(2)
      }
    }
  })

  // https://github.com/fullcalendar/fullcalendar/issues/8093
  // Print clips the canvas to the recorded on-screen scroll position, which must not exceed
  // what the screen could actually scroll to. Initial render sometimes corrects itself via an
  // incidental scroll event, so scrollToTime() is used to reproduce deterministically.
  describeOptions('initialView', {
    'with resource timeline': 'resourceTimelineDay',
    'with plain timeline': 'timelineDay',
  }, () => {
    it('prints leading slots when too wide to scroll', async () => {
      let el = document.createElement('div')
      el.style.width = '3000px' // wide enough for the whole day to fit without scrolling
      el.style.maxWidth = 'none' // override test stylesheet
      document.body.appendChild(el)

      await ignoreResizeObserverLoops(async () => {
        let calendar = initCalendar({
          initialDate: '2020-08-09',
          scrollTime: '12:00',
          resources: [{ id: 'a', title: 'Resource A' }],
        }, el)

        try {
          await waitTimeout()
          calendar.scrollToTime('12:00')
          await waitTimeout()
          calendar.trigger('_beforeprint')
          await waitTimeout()

          let headerSlotEl = el.querySelector('th [data-date="2020-08-09T00:00:00"]') as HTMLElement
          expect(headerSlotEl).toBeTruthy()

          if (headerSlotEl) {
            let cropEl = headerSlotEl.closest('th')
            expect(
              Math.abs(cropEl.getBoundingClientRect().left - headerSlotEl.getBoundingClientRect().left),
            ).toBeLessThanOrEqual(1)
          }
        } finally {
          calendar.trigger('_afterprint')
          calendar.destroy()
          el.remove()
        }
      })
    })
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

    await ignoreResizeObserverLoops(async () => {
      calendar.next()
      await waitTimeout()

      let newScroll = scrollEl.scrollLeft
      expect(newScroll).toBe(origScroll)
    })
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

    await ignoreResizeObserverLoops(async () => {
      calendar.next()
      await waitTimeout()

      calendar.prev()
      await waitTimeout()

      let newScroll = scrollEl.scrollLeft
      expect(newScroll).toBe(origScroll)
    })
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
