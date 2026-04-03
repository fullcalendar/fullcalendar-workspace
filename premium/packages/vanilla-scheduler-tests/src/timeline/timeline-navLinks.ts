import { waitTimeout, ignoreResizeObserverLoops } from '@fullcalendar-tests/standard/lib/misc'

describe('timeline navLinks', () => {
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

  describe('rendering', () => {
    describeOptions({
      'when multi-day': { initialView: 'timelineThreeDay' },
      'when multi-month': { initialView: 'timelineTwoMonth' },
    }, () => {
      it('has at least one navLink', () => {
        initCalendar()
        expect($('.fc-navlink').length).toBeGreaterThan(0)
      })
    })
  })

  describeOptions({
    'when multi-day': { initialView: 'timelineThreeDay' },
    'when multi-month': { initialView: 'timelineTwoMonth' },
  }, () => {
    it('has at least one navLink', () => {
      initCalendar()
      expect($('.fc-navlink').length).toBeGreaterThan(0)
    })
  })

  describe('clicking', () => {
    it('correctly navigates do day-view', async () => {
      const calendar = initCalendar({
        navLinks: true,
        initialView: 'resourceTimelineWeek',
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          // determines the views that are available to switch to
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
        },
      })
      await ignoreResizeObserverLoops(async () => {
        $('.fc-navlink').simulate('click')
        await waitTimeout()

        expect(calendar.view.type).toBe('resourceTimelineDay')
      })
    })
  })
})
