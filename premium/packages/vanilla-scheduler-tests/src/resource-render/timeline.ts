import { describe, expect, it } from 'vitest'
import { CalendarOptions } from 'fullcalendar'
import { strictModeFactor } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { queryPart, queryParts } from '@fullcalendar-tests/standard/src/lib/models/events'
import { getRectCenter, pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
import {
  getResourceAreaRows, getResourceCells, getResourceColumnHeaders, getResourceLane, getResourceLanes, getText,
} from '../lib/models/timeline-layout'

/*
The nearest ancestor that scrolls vertically.
*/
function getVerticalScroller(el: HTMLElement): HTMLElement {
  for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const { overflowY } = getComputedStyle(ancestor)

    if (overflowY === 'auto' || overflowY === 'scroll') {
      return ancestor
    }
  }
  throw new Error('No vertical scroller')
}

function getWidths(els: HTMLElement[]): number[] {
  return els.map((el) => Math.round(el.getBoundingClientRect().width))
}

describe('resource timeline resource area', () => {
  describe('width', () => {
    function getResourceAreaWidth(root: HTMLElement): number {
      return queryParts(root, 'tableHeader')[0].getBoundingClientRect().width // the resource area's header
    }

    it('can be changed with resourceColumnsWidth after init', async () => {
      const calendar = initCalendar({ initialView: 'resourceTimelineDay', resourceColumnsWidth: 200 })
      await waitForSettle()
      expect(Math.abs(getResourceAreaWidth(calendar.el) - 200)).toBeLessThan(2)

      calendar.setOption('resourceColumnsWidth', 300)
      await waitForSettle()
      expect(Math.abs(getResourceAreaWidth(calendar.el) - 300)).toBeLessThan(2)
    })
  })

  describe('columns', () => {
    const options: CalendarOptions = {
      initialView: 'resourceTimelineDay',
      resourceColumnsWidth: 230,
      resourceColumns: [
        { headerContent: 'Room', field: 'title' },
        { headerContent: 'Occupancy', field: 'occupancy' },
      ],
      resources: [
        { id: 'a', occupancy: 40, building: '460 Bryant', title: 'Auditorium A' },
        { id: 'b', occupancy: 40, building: '460 Bryant', title: 'Auditorium B' },
      ],
    }

    function expectColumnWidthsInSync(root: HTMLElement): number[] {
      const headerWidths = getWidths(getResourceColumnHeaders(root))
      expect(headerWidths).toHaveLength(2)
      expect(getWidths(getResourceCells(root, 'a'))).toEqual(headerWidths)
      return headerWidths
    }

    it.each([
      ['', {}],
      [', with resources grouped by row', { resourceGroupField: 'building' }],
    ])('resizes a column by dragging its resizer%s', async (_desc, moreOptions) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()
      const origWidths = expectColumnWidthsInSync(calendar.el)

      const resizerEl = queryPart(getResourceColumnHeaders(calendar.el)[0], 'resourceColumnResizer')!
      const grabPoint = getRectCenter(resizerEl.getBoundingClientRect())
      await pointer.press(grabPoint, async () => {
        await pointer.move({ x: grabPoint.x + 20, y: grabPoint.y })
        await waitForSettle()
      })
      await waitForSettle()

      const newWidths = expectColumnWidthsInSync(calendar.el)
      expect(Math.abs(newWidths[0] - (origWidths[0] + 20))).toBeLessThanOrEqual(1)
    })

    it('applies resourceColumns widths set after init', async () => {
      const calendar = initCalendar(options)
      await waitForSettle()
      const origWidths = expectColumnWidthsInSync(calendar.el)

      calendar.setOption('resourceColumns', [
        { headerContent: 'Room', field: 'title', width: 350 },
        { headerContent: 'Occupancy', field: 'occupancy', width: 50 },
      ])
      await waitForSettle()

      const newWidths = expectColumnWidthsInSync(calendar.el)
      expect(newWidths[0]).toBeGreaterThan(origWidths[0]) // proportions follow the widths
      expect(newWidths[1]).toBeLessThan(origWidths[1])
    })
  })

  describe('resourceCellContent', () => {
    // https://github.com/fullcalendar/fullcalendar/issues/5586
    it('injects new content when the calendar renders again', async () => {
      let renderCnt = 0
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceCellContent: () => ({ html: 'test' + Math.trunc(renderCnt++ / strictModeFactor) }),
        resources: [{ id: 'a', title: 'Resource A' }],
      })
      await waitForSettle()
      expect(getText(getResourceCells(calendar.el, 'a')[0])).toBe('test0')

      calendar.render()
      await waitForSettle()
      expect(getText(getResourceCells(calendar.el, 'a')[0])).toBe('test1')
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5586
    it('resizes the row and its lane when new content is taller', async () => {
      let isBig = false
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resources: [{ id: 'a', title: 'Resource A' }, { id: 'b', title: 'Resource B' }],
        resourceCellContent: (info) => ({
          html: 'line0<br>line1' + (info.resource.id === 'a' && isBig ? '<br>line2<br>line3' : ''),
        }),
      })
      await waitForSettle()

      const cellEl = getResourceCells(calendar.el, 'a')[0]
      const laneEl = getResourceLane(calendar.el, 'a')
      const origHeight = cellEl.offsetHeight
      // the bottom border is on the cell in the resource area, but on the row in the lanes
      expect(Math.abs(origHeight - laneEl.offsetHeight)).toBeLessThanOrEqual(1)

      isBig = true
      calendar.render()
      await waitForSettle()

      const newCellEl = getResourceCells(calendar.el, 'a')[0]
      expect(newCellEl.offsetHeight).toBeGreaterThan(origHeight)
      expect(Math.abs(newCellEl.offsetHeight - getResourceLane(calendar.el, 'a').offsetHeight)).toBeLessThanOrEqual(1)
    })
  })

  describe('grouping by row', () => {
    const options: CalendarOptions = {
      initialView: 'resourceTimelineDay',
      resourceGroupField: 'groupId',
      resources: [
        { id: 'A', groupId: '1', title: 'Resource A' },
        { id: 'B', groupId: '1', title: 'Resource B' },
        { id: 'C', groupId: '2', title: 'Resource C' },
      ],
    }

    function describeRows(root: HTMLElement): string[] {
      return getResourceAreaRows(root).map((row) => (row.type === 'group' ? `group ${row.text}` : row.resourceId!))
    }

    it('renders a group header above each group\'s resources', async () => {
      const calendar = initCalendar(options)
      await waitForSettle()

      expect(describeRows(calendar.el)).toEqual(['group 1', 'A', 'B', 'group 2', 'C'])
    })

    it('renders group headers with resourceGroupHeaderContent', async () => {
      const calendar = initCalendar({ ...options, resourceGroupHeaderContent: (info) => `Group ${info.fieldValue}` })
      await waitForSettle()

      expect(describeRows(calendar.el)).toEqual(['group Group 1', 'A', 'B', 'group Group 2', 'C'])
    })

    // https://github.com/fullcalendar/fullcalendar-scheduler/issues/490
    it('orders collapsed groups by resourceOrder', async () => {
      const buildings = ['Delta', 'Delta', 'Beta', 'Beta', 'Alpha', 'Gamma', 'Epsilon', 'Beta', 'Beta', 'Epsilon', 'Gamma',
        'Gamma', 'Epsilon', 'Alpha', 'Epsilon', 'Epsilon', 'Beta', 'Alpha', 'Alpha', 'Delta', 'Alpha', 'Alpha', 'Beta',
        'Gamma', 'Epsilon', 'Epsilon']
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceOrder: 'building',
        resourceGroupField: 'building',
        resourcesInitiallyExpanded: false,
        resourceColumnHeaderContent: 'Rooms',
        resources: buildings.map((building, i) => {
          const letter = String.fromCharCode(97 + i)
          return { id: letter, title: `Room ${letter.toUpperCase()}`, building }
        }),
      })
      await waitForSettle()

      expect(describeRows(calendar.el)).toEqual(
        ['Alpha', 'Beta', 'Delta', 'Epsilon', 'Gamma'].map((building) => `group ${building}`),
      )
    })
  })

  describe('grouping by column', () => {
    it('spans group cells over their resources\' rows, as tall as the lanes', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        resourceColumns: [
          { group: true, headerContent: 'col1', field: 'col1' },
          { group: true, headerContent: 'col2', field: 'col2' },
          { headerContent: 'col3', field: 'col3' },
        ],
        resources: [
          { id: 'a', col1: 'Group A', col2: 'Group 2', col3: 'One' },
          { id: 'b', col1: 'Group A', col2: 'Group 2', col3: 'Two' },
          { id: 'c', col1: 'Group A', col2: 'Group 2', col3: 'Three' },
          { id: 'd', col1: 'Group B', col2: 'Group 1', col3: 'One' },
          { id: 'e', col1: 'Group B', col2: 'Group 2', col3: 'One' },
          { id: 'f', col1: 'Group C', col2: 'Group 1', col3: 'One' },
        ],
      })
      await waitForSettle()

      // group cells are row headers too, so collect every cell in the resource area by column
      const cellEls = queryParts(calendar.el, 'resourceCell').concat(queryParts(calendar.el, 'resourceGroupHeader'))
      const columnLefts = [...new Set(cellEls.map((el) => Math.round(el.getBoundingClientRect().left)))].sort((a, b) => a - b)
      const columns = columnLefts.map((left) => cellEls
        .filter((el) => Math.abs(el.getBoundingClientRect().left - left) <= 1)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top))

      expect(columns.map((column) => column.map(getText))).toEqual([
        ['Group A', 'Group B', 'Group C'],
        ['Group 2', 'Group 1', 'Group 2', 'Group 1'],
        ['One', 'Two', 'Three', 'One', 'One', 'One'],
      ])

      const laneEls = getResourceLanes(calendar.el)
      expect(laneEls).toHaveLength(6)
      const lanesTop = laneEls[0].getBoundingClientRect().top
      const lanesBottom = laneEls[5].getBoundingClientRect().bottom
      for (const column of columns) {
        expect(Math.abs(column[0].getBoundingClientRect().top - lanesTop)).toBeLessThanOrEqual(1)
        expect(Math.abs(column.at(-1)!.getBoundingClientRect().bottom - lanesBottom)).toBeLessThanOrEqual(1)
      }
    })
  })

  /*
  Without roving tabindex, a flat resource timeline is a table (a grid makes JAWS switch to forms
  mode when focus lands on an event). With nesting, it stays a treegrid to convey the hierarchy.
  */
  describe('table roles', () => {
    const options: CalendarOptions = {
      initialView: 'resourceTimelineDay',
      initialDate: '2023-04-03',
      resourceColumns: [
        { field: 'title', headerContent: 'Room' },
        { field: 'occupancy', headerContent: 'Occupancy' },
      ],
    }

    it('renders a table with cells when resources are flat', async () => {
      const calendar = initCalendar({
        ...options,
        resources: [
          { id: 'a', title: 'Room A', occupancy: 40 },
          { id: 'b', title: 'Room B', occupancy: 60 },
        ],
      })
      await waitForSettle()

      expect(calendar.el.querySelector('[role=table]')).not.toBeNull()
      expect(calendar.el.querySelector('[role=grid], [role=treegrid], [role=gridcell]')).toBeNull()
      expect(getResourceLane(calendar.el, 'a').getAttribute('role')).toBe('cell')
      expect(getResourceCells(calendar.el, 'a').map((el) => el.getAttribute('role'))).toEqual(['rowheader', 'cell'])
    })

    it.each([
      ['nested', {
        resources: [{ id: 'a', title: 'Room A', occupancy: 40, children: [{ id: 'a1', title: 'Room A1', occupancy: 10 }] }],
      }, 'a1'],
      ['grouped by row', {
        resourceGroupField: 'building',
        resources: [
          { id: 'a1', title: 'Room A', occupancy: 40, building: 'East' },
          { id: 'b', title: 'Room B', occupancy: 60, building: 'West' },
        ],
      }, 'a1'],
    ])('renders a treegrid with gridcells when resources are %s', async (_desc, moreOptions, resourceId) => {
      const calendar = initCalendar({ ...options, ...moreOptions })
      await waitForSettle()

      expect(calendar.el.querySelector('[role=treegrid]')).not.toBeNull()
      expect(calendar.el.querySelector('[role=table], [role=cell]')).toBeNull()
      expect(getResourceLane(calendar.el, resourceId).getAttribute('role')).toBe('gridcell')
      expect(getResourceCells(calendar.el, resourceId).map((el) => el.getAttribute('role'))).toEqual(['rowheader', 'gridcell'])
    })
  })

  describe('sizing', () => {
    function buildResources(count: number) {
      return Array.from({ length: count }, (_, i) => ({ id: `r${i}`, title: `resource${i}` }))
    }

    it('scrolls the resource area and the lanes by the same height, leaving room for the scrollbar', async () => {
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        initialDate: '2017-10-27',
        resources: buildResources(50),
      })
      await waitForSettle()

      const areaScrollerEl = getVerticalScroller(getResourceCells(calendar.el, 'r0')[0])
      const laneScrollerEl = getVerticalScroller(getResourceLane(calendar.el, 'r0'))
      expect(areaScrollerEl).not.toBe(laneScrollerEl)
      expect(laneScrollerEl.scrollHeight).toBeGreaterThan(laneScrollerEl.clientHeight) // it scrolls

      const gutter = laneScrollerEl.clientHeight - areaScrollerEl.clientHeight
      expect(areaScrollerEl.scrollHeight + gutter).toBe(laneScrollerEl.scrollHeight)
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5545
    it('sizes the resource area and lanes alike with height:auto and resources that load late', async () => {
      let succeedFetch!: (resources: object[]) => void
      const calendar = initCalendar({
        initialView: 'resourceTimelineDay',
        initialDate: '2017-10-27',
        height: 'auto',
        resources: (_info, successCallback) => {
          succeedFetch = successCallback
        },
      })
      await waitForSettle()
      expect(getResourceLanes(calendar.el)).toHaveLength(0)

      succeedFetch(buildResources(20))
      await waitForSettle()

      const lanes = getResourceLanes(calendar.el)
      expect(lanes).toHaveLength(20)
      const areaBodyEl = getResourceCells(calendar.el, 'r0')[0].closest('[data-fc-part~="tableBody"]') as HTMLElement
      const laneBodyEl = lanes[0].closest('[data-fc-part~="tableBody"]') as HTMLElement
      expect(areaBodyEl.offsetHeight).toBeGreaterThan(20 * 30)
      expect(Math.abs(areaBodyEl.offsetHeight - laneBodyEl.offsetHeight)).toBeLessThan(20) // disregarding a scrollbar
    })
  })
})
