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
      let scroll = scrollEl.scrollLeft
      expect(scroll).toBeGreaterThan(0)

      calendar.next()
      setTimeout(function() {
        let newScroll = scrollEl.scrollLeft
        expect(newScroll).toBe(scroll)
        done()
      })
    })
  })

})
