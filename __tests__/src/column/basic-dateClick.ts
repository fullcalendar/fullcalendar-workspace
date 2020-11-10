import { getLeadingBoundingRect, sortBoundingRects } from 'fullcalendar-tests/src/lib/dom-geom'
import { DayGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/DayGridViewWrapper'

describe('dayGrid-view dateClick', () => {
  pushOptions({
    now: '2015-11-28',
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
    ],
    views: {
      resourceDayGridThreeDay: {
        type: 'resourceDayGrid',
        duration: { days: 3 },
      },
    },
  })

  describe('when there are no resource columns', () => {
    pushOptions({
      initialView: 'dayGridWeek',
    })

    it('allows non-resource clicks', (done) => {
      let dateClickCalled = false
      let calendar = initCalendar({
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-23')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource).toBeFalsy()
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monEls = dayGridWrapper.getDowEls('mon')

      expect(monEls.length).toBe(1)
      $(monEls[0]).simulate('drag', {
        callback() {
          expect(dateClickCalled).toBe(true)
          done()
        },
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows a resource click', (done) => {
      let dateClickCalled = false
      let calendar = initCalendar({
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-29')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('a')
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)

      sunAEl.simulate('drag', {
        callback() {
          expect(dateClickCalled).toBe(true)
          done()
        },
      })
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a resource click', (done) => {
      let dateClickCalled = false
      let calendar = initCalendar({
        dateClick(arg) {
          dateClickCalled = true
          expect(arg.date).toEqualDate('2015-11-30')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let rects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))

      let monBEl = $(rects[1].node)
      monBEl.simulate('drag', {
        callback() {
          expect(dateClickCalled).toBe(true)
          done()
        },
      })
    })
  })
})
