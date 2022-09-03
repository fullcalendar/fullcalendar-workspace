import { getLeadingBoundingRect, getTrailingBoundingRect, sortBoundingRects } from 'fullcalendar-tests/src/lib/dom-geom'
import { DayGridViewWrapper } from 'fullcalendar-tests/src/lib/wrappers/DayGridViewWrapper'

describe('dayGrid-view selection', () => {
  pushOptions({
    now: '2015-11-28',
    selectable: true,
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

    it('allows non-resource selects', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-23')
          expect(arg.end).toEqualDate('2015-11-25')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource).toBeFalsy()
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monEls = dayGridWrapper.getDowEls('mon')
      let tueEls = dayGridWrapper.getDowEls('tue')

      expect(monEls.length).toBe(1)
      expect(tueEls.length).toBe(1)
      $(monEls[0]).simulate('drag', {
        end: tueEls[0],
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows a resource selects', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-29')
          expect(arg.end).toEqualDate('2015-12-01')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('a')
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)
      let monAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('mon')).node)

      sunAEl.simulate('drag', {
        end: monAEl,
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('disallows a selection across resources', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)
      let monBEl = $(getTrailingBoundingRect(dayGridWrapper.getDowEls('mon')).node)

      sunAEl.simulate('drag', {
        end: monBEl,
        callback() {
          expect(selectCalled).toBe(false)
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

    it('allows a resource selection', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select(arg) {
          selectCalled = true
          expect(arg.start).toEqualDate('2015-11-28')
          expect(arg.end).toEqualDate('2015-12-01')
          expect(typeof arg.jsEvent).toBe('object')
          expect(typeof arg.view).toBe('object')
          expect(arg.resource.id).toBe('b')
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monRects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))
      let monBEl = $(monRects[1].node)
      let satRects = sortBoundingRects(dayGridWrapper.getDowEls('sat'))
      let satBEl = $(satRects[1].node)

      monBEl.simulate('drag', {
        end: satBEl,
        callback() {
          expect(selectCalled).toBe(true)
          done()
        },
      })
    })

    it('disallows a selection across resources', (done) => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })

      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monRects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))
      let monBEl = $(monRects[1].node)
      let satRects = sortBoundingRects(dayGridWrapper.getDowEls('sat'))
      let satAEl = $(satRects[0].node)

      monBEl.simulate('drag', {
        end: satAEl,
        callback() {
          expect(selectCalled).toBe(false)
          done()
        },
      })
    })
  })
})
