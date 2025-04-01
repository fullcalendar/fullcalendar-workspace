describe('timeline navLinks', () => {
  describe('rendering', () => {
    pushOptions({
      navLinks: true,
      views: {
        timelineThreeDay: {
          type: 'timeline',
          duration: { days: 3 },
        },
        timelineTwoMonth: {
          type: 'timeline',
          duration: { months: 2 },
        },
      },
    })

    describeOptions({
      'when multi-day': { initialView: 'timelineThreeDay' },
      'when multi-month': { initialView: 'timelineTwoMonth' },
    }, () => {
      it('has at least one navLink', () => {
        initCalendar()
        expect($('a[data-navlink]').length).toBeGreaterThan(0)
      })
    })
  })

  describe('clicking', () => {
    it('correctly navigates do day-view', (done) => {
      const calendar = initCalendar({
        navLinks: true,
        initialView: 'resourceTimelineWeek',
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          // determines the views that are available to switch to
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
        },
      })
      $('a[data-navlink]').simulate('click')
      setTimeout(() => {
        expect(calendar.view.type).toBe('resourceTimelineDay')
        done()
      })
    })
  })
})
