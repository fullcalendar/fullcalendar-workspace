import { getLeadingBoundingRect, sortBoundingRects } from '@fullcalendar-tests/standard/lib/dom-geom'
import { DayGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/DayGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper.js'

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
        dateClick(data) {
          dateClickCalled = true
          expect(data.date).toEqualDate('2015-11-23')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource).toBeFalsy()
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
        dateClick(data) {
          dateClickCalled = true
          expect(data.date).toEqualDate('2015-11-29')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('a')
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
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
        dateClick(data) {
          dateClickCalled = true
          expect(data.date).toEqualDate('2015-11-30')
          expect(typeof data.jsEvent).toBe('object')
          expect(typeof data.view).toBe('object')
          expect(data.resource.id).toBe('b')
        },
      })

      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
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
