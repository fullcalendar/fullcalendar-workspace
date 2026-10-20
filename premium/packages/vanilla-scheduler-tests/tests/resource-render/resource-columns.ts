import { describe, expect, it, vi } from 'vitest'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/tests/lib/settle'
import { createHeldFetch } from '../lib/fetching'
import { ResourceColumnsModel } from '../lib/models/resource-columns'

/*
The resource columns of resourceTimeGrid and resourceDayGrid views: header rows, column order, and
the resource header hooks.
*/
describe('resource columns', () => {
  const MON = '2015-11-16'
  const TUE = '2015-11-17'
  const options = {
    now: MON,
    scrollTime: '00:00',
    views: {
      resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } },
      resourceDayGridTwoDay: { type: 'resourceDayGrid', duration: { days: 2 } },
    },
    resources: [
      { id: 'a', title: 'Resource A' },
      { id: 'b', title: 'Resource B' },
      { id: 'c', title: 'Resource C' },
      { id: 'd', title: 'Resource D' },
    ],
  }
  const RESOURCE_IDS = ['a', 'b', 'c', 'd']

  function getCenterX(el: HTMLElement): number {
    const rect = el.getBoundingClientRect()
    return rect.left + rect.width / 2
  }

  describe.each(['resourceTimeGrid', 'resourceDayGrid'])('in %s', (viewType) => {
    describe('a one-day view', () => {
      it('renders a column per resource, with no date row', () => {
        const calendar = initCalendar({ ...options, initialView: viewType + 'Day' })
        const columns = new ResourceColumnsModel(calendar.el)

        expect(columns.getHeaderCellInfoByRow()).toEqual([
          // the date is on the resource headers, as there's no date row
          RESOURCE_IDS.map((resourceId) => ({ date: MON, resourceId, colSpan: 1 })),
        ])
        expect(columns.getDayCellColumns()).toEqual(RESOURCE_IDS.map((resourceId) => ({ date: MON, resourceId })))
      })

      it.each([
        ['ltr', 1],
        ['rtl', -1],
      ] as const)('orders the columns in reading order (%s)', async (direction, sign) => {
        const calendar = initCalendar({ ...options, initialView: viewType + 'Day', direction })
        await waitForSettle()
        const columns = new ResourceColumnsModel(calendar.el)
        const headerXs = RESOURCE_IDS.map((resourceId) => getCenterX(columns.getResourceHeaderEls(resourceId)[0]))
        const cellXs = RESOURCE_IDS.map((resourceId) => getCenterX(columns.getDayCellEl(MON, resourceId)))

        for (let i = 1; i < RESOURCE_IDS.length; i++) {
          expect(Math.sign(headerXs[i] - headerXs[i - 1])).toBe(sign)
          expect(Math.abs(cellXs[i] - headerXs[i])).toBeLessThan(1) // each column sits under its header
        }
      })

      it('renders resources that arrive late', async () => {
        const heldResources = createHeldFetch(() => [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ])
        const calendar = initCalendar({ ...options, initialView: viewType + 'Day', resources: heldResources.fetch })
        await waitForSettle()
        const columns = new ResourceColumnsModel(calendar.el)
        expect(columns.getResourceHeaderIds()).toEqual([])

        await heldResources.releaseAll()

        expect(columns.getResourceHeaderIds()).toEqual(['a', 'b'])
        expect(columns.getResourceHeaderTitles()).toEqual(['Resource A', 'Resource B'])
      })
    })

    describe('a two-day view', () => {
      it('puts resources above dates by default', () => {
        const calendar = initCalendar({ ...options, initialView: viewType + 'TwoDay' })
        const columns = new ResourceColumnsModel(calendar.el)
        const expectedColumns = RESOURCE_IDS.flatMap((resourceId) => [MON, TUE].map((date) => ({ date, resourceId })))

        expect(columns.getHeaderCellInfoByRow()).toEqual([
          RESOURCE_IDS.map((resourceId) => ({ date: null, resourceId, colSpan: 2 })),
          expectedColumns.map((column) => ({ ...column, colSpan: 1 })),
        ])
        expect(columns.getDayCellColumns()).toEqual(expectedColumns)
      })

      it('puts dates above resources with datesAboveResources', () => {
        const calendar = initCalendar({ ...options, initialView: viewType + 'TwoDay', datesAboveResources: true })
        const columns = new ResourceColumnsModel(calendar.el)
        const expectedColumns = [MON, TUE].flatMap((date) => RESOURCE_IDS.map((resourceId) => ({ date, resourceId })))

        expect(columns.getHeaderCellInfoByRow()).toEqual([
          [MON, TUE].map((date) => ({ date, resourceId: null, colSpan: 4 })),
          expectedColumns.map((column) => ({ ...column, colSpan: 1 })),
        ])
        expect(columns.getDayCellColumns()).toEqual(expectedColumns)
      })
    })
  })

  describe('a resourceDayGridMonth view', () => {
    const monthOptions = {
      ...options,
      initialView: 'resourceDayGridMonth',
      resources: [
        { id: 'a', title: 'Resource A' },
        { id: 'b', title: 'Resource B' },
      ],
    }

    it('renders a month per resource, side by side', () => {
      const calendar = initCalendar(monthOptions)
      const columns = new ResourceColumnsModel(calendar.el)
      const headerRows = columns.getHeaderCellInfoByRow()

      expect(headerRows[0]).toEqual([
        { date: null, resourceId: 'a', colSpan: 7 },
        { date: null, resourceId: 'b', colSpan: 7 },
      ])
      expect(headerRows[1].map((cell) => cell.resourceId)).toEqual([...Array(7).fill('a'), ...Array(7).fill('b')])
      expect(queryParts(calendar.el, 'dayRow')).toHaveLength(6)
      expect(columns.getDayCellColumns()).toHaveLength(6 * 7 * 2)
    })

    it.each([
      ['ltr', 1],
      ['rtl', -1],
    ] as const)('puts the first resource\'s month first in reading order (%s)', async (direction, sign) => {
      const calendar = initCalendar({ ...monthOptions, direction })
      await waitForSettle()
      const columns = new ResourceColumnsModel(calendar.el)
      const cellRects = (resourceId: string) => columns.getDayCellEls()
        .filter((el) => el.getAttribute('data-resource-id') === resourceId)
        .map((el) => el.getBoundingClientRect())
      const aRects = cellRects('a')
      const bRects = cellRects('b')

      expect(aRects).toHaveLength(42)
      if (sign > 0) {
        expect(Math.max(...aRects.map((rect) => rect.right))).toBeLessThanOrEqual(Math.min(...bRects.map((rect) => rect.left)) + 1)
      } else {
        expect(Math.min(...aRects.map((rect) => rect.left))).toBeGreaterThanOrEqual(Math.max(...bRects.map((rect) => rect.right)) - 1)
      }
    })
  })

  describe('resourceDayHeaderDidMount', () => {
    function countMountsForA(calendarOptions: object) {
      const resourceDayHeaderDidMount = vi.fn()
      initCalendar({
        ...options,
        views: {
          ...options.views,
          resourceTimeGridThreeDay: { type: 'resourceTimeGrid', duration: { days: 3 } },
          resourceDayGridThreeDay: { type: 'resourceDayGrid', duration: { days: 3 } },
        },
        resources: [
          { id: 'a', title: 'Resource A' },
          { id: 'b', title: 'Resource B' },
        ],
        ...calendarOptions,
        resourceDayHeaderDidMount,
      })
      const infosForA = resourceDayHeaderDidMount.mock.calls.map(([info]) => info)
        .filter((info) => info.resource.id === 'a')

      for (const info of infosForA) {
        expect(info.el.textContent).toContain('Resource A')
      }
      return infosForA.length
    }

    it.each([
      ['resourceTimeGridThreeDay', false, 1],
      ['resourceDayGridThreeDay', false, 1],
      ['resourceDayGridMonth', false, 1],
      ['resourceTimeGridThreeDay', true, 3],
      ['resourceDayGridThreeDay', true, 3],
      ['resourceDayGridMonth', true, 7], // per day of the week
    ])('in %s with datesAboveResources:%s, fires %i times per resource', (initialView, datesAboveResources, count) => {
      expect(countMountsForA({ initialView, datesAboveResources })).toBe(count * strictModeFactor)
    })

    it('fires the same way in RTL', () => {
      expect(countMountsForA({ initialView: 'resourceTimeGridThreeDay', datesAboveResources: true, direction: 'rtl' }))
        .toBe(3 * strictModeFactor)
    })
  })
})
