import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

describe('scrollTime', () => {
  // https://github.com/fullcalendar/fullcalendar/issues/5351
  it('is preserved when prev/next with resources and nowIndicator', (done) => {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(() => {
      let origScroll = scrollEl.scrollLeft
      expect(origScroll).toBeGreaterThan(0)

      calendar.next()
      setTimeout(() => {
        let newScroll = scrollEl.scrollLeft
        expect(newScroll).toBe(origScroll)
        done()
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5351#issuecomment-667554437
  it('is preserved when returning to current-day date range', (done) => {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(() => {
      let origScroll = scrollEl.scrollLeft
      expect(origScroll).toBeGreaterThan(0)

      calendar.next()
      setTimeout(() => {
        calendar.prev()
        setTimeout(() => {
          let newScroll = scrollEl.scrollLeft
          expect(newScroll).toBe(origScroll)
          done()
        })
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5645
  it('is disregarded when slots are a day or bigger', (done) => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth',
      scrollTime: '06:00',
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(() => {
      let scroll = scrollEl.scrollLeft
      expect(scroll).toBe(0)
      done()
    })
  })

  // TODO: to fix this, make sure the scroll assignment happens AFTER
  // the slot widths have been calculate and set. Happening in wrong order
  // https://github.com/fullcalendar/fullcalendar/issues/5686
  xit('has correct scrollTime when switching timeline views', (done) => {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth',
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    calendar.changeView('resourceTimelineWeek')
    setTimeout(() => {
      let scrollEl = viewWrapper.getTimeScrollEl()
      let slatEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T06:00:00')

      expect(
        Math.abs(
          scrollEl.getBoundingClientRect().left -
          slatEl.getBoundingClientRect().left,
        ),
      ).toBeLessThan(1)

      done()
    })
  })
})
