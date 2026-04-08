import { getLeadingBoundingRect, sortBoundingRects } from '@fullcalendar-tests/standard/lib/dom-geom'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { DayGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/DayGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

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

    it('allows non-resource clicks', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-23')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource).toBeFalsy()
          clickResolve()
        },
      })

      await waitTimeout()
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monEls = dayGridWrapper.getDowEls('mon')

      expect(monEls.length).toBe(1)
      await new Promise<void>((resolve) => {
        $(monEls[0]).simulate('drag', {
          callback() {
            resolve()
          },
        })
      })
      expect(dateClickCalled).toBe(true)
      await clickPromise
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows a resource click', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-29')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource.id).toBe('a')
          clickResolve()
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)

      await new Promise<void>((resolve) => {
        sunAEl.simulate('drag', {
          callback() {
            resolve()
          },
        })
      })
      expect(dateClickCalled).toBe(true)
      await clickPromise
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a resource click', async () => {
      let dateClickCalled = false
      let clickResolve: () => void
      let clickPromise = new Promise<void>((resolve) => {
        clickResolve = resolve
      })
      let calendar = initCalendar({
        dateClick(info) {
          dateClickCalled = true
          expect(info.date).toEqualDate('2015-11-30')
          expect(typeof info.jsEvent).toBe('object')
          expect(typeof info.view).toBe('object')
          expect(info.resource.id).toBe('b')
          clickResolve()
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let rects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))

      let monBEl = $(rects[1].node)
      await new Promise<void>((resolve) => {
        monBEl.simulate('drag', {
          callback() {
            resolve()
          },
        })
      })
      expect(dateClickCalled).toBe(true)
      await clickPromise
    })
  })
})
