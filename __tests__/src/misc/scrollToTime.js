describe('scrollToTime method', function() {

  describe('when in timeline', function() {
    pushOptions({
      defaultView: 'timelineMonth',
      slotDuration: { hours: 12 }
    })

    it('can scroll to a date', function() {
      initCalendar()
      currentCalendar.scrollToTime({ days: 2 })

      var slotCell = $('.fc-body .fc-slats td:eq(4)') // day 3 slot
      var slotLeft = slotCell.position().left
      var scrollContainer = $('.fc-body .fc-time-area .fc-scroller')
      var scrollLeft = scrollContainer.scrollLeft()
      var diff = Math.abs(scrollLeft - slotLeft)
      expect(slotLeft).toBeGreaterThan(0)
      expect(scrollLeft).toBeGreaterThan(0)
      expect(diff).toBeLessThan(3)
    })
  })
})
