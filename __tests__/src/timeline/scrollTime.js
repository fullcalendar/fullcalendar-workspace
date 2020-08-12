import { ResourceTimelineViewWrapper } from "../lib/wrappers/ResourceTimelineViewWrapper"

describe('scrollTime', function() {

  // https://github.com/fullcalendar/fullcalendar/issues/5351
  it('is preserved when prev/next with resources and nowIndicator', function(done) {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00'
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(function() {
      let origScroll = scrollEl.scrollLeft
      expect(origScroll).toBeGreaterThan(0)

      calendar.next()
      setTimeout(function() {
        let newScroll = scrollEl.scrollLeft
        expect(newScroll).toBe(origScroll)
        done()
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5351#issuecomment-667554437
  it('is preserved when returning to current-day date range', function(done) {
    let calendar = initCalendar({
      now: '2020-07-07T23:00:00',
      nowIndicator: true,
      initialView: 'resourceTimelineDay',
      scrollTime: '06:00'
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(function() {
      let origScroll = scrollEl.scrollLeft
      expect(origScroll).toBeGreaterThan(0)

      calendar.next()
      setTimeout(function() {

        calendar.prev()
        setTimeout(function() {
          let newScroll = scrollEl.scrollLeft
          expect(newScroll).toBe(origScroll)
          done()
        })
      })
    })
  })

  // https://github.com/fullcalendar/fullcalendar/issues/5645
  it('is disregarded when slots are a day or bigger', function(done) {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth',
      scrollTime: '06:00'
    })

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollEl = viewWrapper.getTimeScrollEl()

    setTimeout(function() {
      let scroll = scrollEl.scrollLeft
      expect(scroll).toBe(0)
      done()
    })
  })

  // TODO: to fix this, make sure the scroll assignment happens AFTER
  // the slot widths have been calculate and set. Happening in wrong order
  // https://github.com/fullcalendar/fullcalendar/issues/5686
  xit('has correct scrollTime when switching timeline views', function(done) {
    let calendar = initCalendar({
      initialView: 'resourceTimelineMonth'
    })
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    calendar.changeView('resourceTimelineWeek')
    setTimeout(function() {

      let scrollEl = viewWrapper.getTimeScrollEl()
      let slatEl = viewWrapper.timelineGrid.getSlatElByDate('2020-08-09T06:00:00')

      expect(
        Math.abs(
          scrollEl.getBoundingClientRect().left -
          slatEl.getBoundingClientRect().left
        )
      ).toBeLessThan(1)

      done()
    })
  })

})
