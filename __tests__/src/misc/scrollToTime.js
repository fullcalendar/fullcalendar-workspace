import TimelineViewWrapper from "../lib/wrappers/TimelineViewWrapper"

describe('scrollToTime method', function() {

  describe('when in timeline', function() {
    pushOptions({
      defaultView: 'timelineMonth',
      slotDuration: { hours: 12 }
    })

    it('can scroll to a date', function() {
      let calendar = initCalendar()
      currentCalendar.scrollToTime({ days: 2 })

      let viewWrapper = new TimelineViewWrapper(calendar)
      let timelineGridWrapper = viewWrapper.timelineGrid

      let slotCell = timelineGridWrapper.getSlatEls()[4] // day 3 slot
      let slotLeft = $(slotCell).position().left
      let scrollContainer = viewWrapper.getHeaderScrollEl()
      let scrollLeft = scrollContainer.scrollLeft
      let diff = Math.abs(scrollLeft - slotLeft)

      expect(slotLeft).toBeGreaterThan(0)
      expect(scrollLeft).toBeGreaterThan(0)
      expect(diff).toBeLessThan(3)
    })
  })
})
