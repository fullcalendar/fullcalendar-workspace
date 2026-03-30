import { getLeadingBoundingRect, getTrailingBoundingRect, sortBoundingRects } from '@fullcalendar-tests/standard/lib/dom-geom'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { DayGridViewWrapper } from '@fullcalendar-tests/standard/lib/wrappers/DayGridViewWrapper'
import { ResourceDayGridViewWrapper } from '../lib/wrappers/ResourceDayGridViewWrapper'

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

    it('allows non-resource selects', async () => {
      let selectCalled = false
      let selectData = null
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          selectData = data
        },
      })

      await waitTimeout()
      let dayGridWrapper = new DayGridViewWrapper(calendar).dayGrid
      let monEls = dayGridWrapper.getDowEls('mon')
      let tueEls = dayGridWrapper.getDowEls('tue')

      expect(monEls.length).toBe(1)
      expect(tueEls.length).toBe(1)
      await new Promise<void>((resolve) => {
        $(monEls[0]).simulate('drag', {
          end: tueEls[0],
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectData).toBeTruthy()
      expect(selectData.start).toEqualDate('2015-11-23')
      expect(selectData.end).toEqualDate('2015-11-25')
      expect(typeof selectData.jsEvent).toBe('object')
      expect(typeof selectData.view).toBe('object')
      expect(selectData.resource).toBeFalsy()
    })
  })

  describe('with resource columns above date columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
    })

    it('allows a resource selects', async () => {
      let selectCalled = false
      let selectData = null
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          selectData = data
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)
      let monAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('mon')).node)

      await new Promise<void>((resolve) => {
        sunAEl.simulate('drag', {
          end: monAEl,
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectData).toBeTruthy()
      expect(selectData.start).toEqualDate('2015-11-29')
      expect(selectData.end).toEqualDate('2015-12-01')
      expect(typeof selectData.jsEvent).toBe('object')
      expect(typeof selectData.view).toBe('object')
      expect(selectData.resource.id).toBe('a')
    })

    it('disallows a selection across resources', async () => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let sunAEl = $(getLeadingBoundingRect(dayGridWrapper.getDowEls('sun')).node)
      let monBEl = $(getTrailingBoundingRect(dayGridWrapper.getDowEls('mon')).node)

      await new Promise<void>((resolve) => {
        sunAEl.simulate('drag', {
          end: monBEl,
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(false)
    })
  })

  describe('with date columns above resource columns', () => {
    pushOptions({
      initialView: 'resourceDayGridThreeDay',
      datesAboveResources: true,
    })

    it('allows a resource selection', async () => {
      let selectCalled = false
      let selectData = null
      let calendar = initCalendar({
        select(data) {
          selectCalled = true
          selectData = data
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let monRects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))
      let monBEl = $(monRects[1].node)
      let satRects = sortBoundingRects(dayGridWrapper.getDowEls('sat'))
      let satBEl = $(satRects[1].node)

      await new Promise<void>((resolve) => {
        monBEl.simulate('drag', {
          end: satBEl,
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(true)
      expect(selectData).toBeTruthy()
      expect(selectData.start).toEqualDate('2015-11-28')
      expect(selectData.end).toEqualDate('2015-12-01')
      expect(typeof selectData.jsEvent).toBe('object')
      expect(typeof selectData.view).toBe('object')
      expect(selectData.resource.id).toBe('b')
    })

    it('disallows a selection across resources', async () => {
      let selectCalled = false
      let calendar = initCalendar({
        select() {
          selectCalled = true
        },
      })

      await waitTimeout()
      let dayGridWrapper = new ResourceDayGridViewWrapper(calendar).dayGrid
      let monRects = sortBoundingRects(dayGridWrapper.getDowEls('mon'))
      let monBEl = $(monRects[1].node)
      let satRects = sortBoundingRects(dayGridWrapper.getDowEls('sat'))
      let satAEl = $(satRects[0].node)

      await new Promise<void>((resolve) => {
        monBEl.simulate('drag', {
          end: satAEl,
          callback() {
            resolve()
          },
        })
      })

      expect(selectCalled).toBe(false)
    })
  })
})
