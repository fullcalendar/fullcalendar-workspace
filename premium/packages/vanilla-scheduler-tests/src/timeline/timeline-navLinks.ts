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

    /*
    TODO: test different granularities, array, single-object
    NOTE: navlinks can get assigned regardless with `guessedSlotUnit`
    https://github.com/fullcalendar/fullcalendar/issues/8064#issuecomment-4309593371
    */
    it('has navLinks with custom slotHeaderFormat', () => {
      initCalendar({
        initialView: 'resourceTimelineWeek',
        slotDuration: { hours: 1 },
        slotHeaderFormat: [
          { year: 'numeric', month: 'numeric', day: 'numeric' },
          { hour: 'numeric' },
        ],
      })

      expect($('.fc-navlink').length).toBe(7) // navlink on each day
    })
    // similar, but with day slots
    it('has navLinks with custom slotHeaderFormat, similar', () => {
      initCalendar({
        initialView: 'resourceTimelineWeek',
        slotDuration: { days: 1 },
        slotHeaderFormat: [
            { day: 'numeric', month: 'numeric' },
            { weekday: 'short' },
        ],
      })
      expect($('.fc-navlink').length).toBe(14)
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
