
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
    'when multi-day': { defaultView: 'timelineThreeDay' },
    'when multi-month': { defaultView: 'timelineTwoMonth' }
  }, function() {
    it('has at least one navLink', function(done) {
      initCalendar({
        viewRender() {
          expect($('a[data-goto]').length).toBeGreaterThan(0)
          done()
        }
      })
    })
  })
})
