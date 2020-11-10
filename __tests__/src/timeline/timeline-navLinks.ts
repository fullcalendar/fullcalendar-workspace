
describe('timeline navLinks', function() {
  pushOptions({
    navLinks: true,
    views: {
      timelineThreeDay: {
        type: 'timeline',
        duration: { days: 3 }
      },
      timelineTwoMonth: {
        type: 'timeline',
        duration: { months: 2 }
      }
    }
  })

  describeOptions({
    'when multi-day': { initialView: 'timelineThreeDay' },
    'when multi-month': { initialView: 'timelineTwoMonth' }
  }, function() {
    it('has at least one navLink', function() {
      initCalendar()
      expect($('a[data-navlink]').length).toBeGreaterThan(0)
    })
  })
})
