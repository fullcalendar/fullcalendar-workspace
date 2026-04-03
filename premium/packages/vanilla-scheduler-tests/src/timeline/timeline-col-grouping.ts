import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'
import { waitTimeout } from '@fullcalendar-tests/standard/lib/misc'

const EXPECTED_COLUMNS = [
  ['Group A', 'Group B', 'Group C'],
  ['Group 2', 'Group 1', 'Group 2', 'Group 1'],
  ['One', 'Two', 'Three', 'One', 'One', 'One'],
]

/*
TODO: write tests for text/render functions
*/
describe('timeline column grouping', () => {
  pushOptions({
    initialView: 'resourceTimelineDay',
    resourceColumns: [
      {
        group: true,
        headerContent: 'col1',
        field: 'col1',
      },
      {
        group: true,
        headerContent: 'col2',
        field: 'col2',
      },
      {
        headerContent: 'col3',
        field: 'col3',
      },
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

  it('renders row heights correctly when grouping columns', async () => {
    let calendar = initCalendar()
    await waitTimeout()
    let viewWrapper = new ResourceTimelineViewWrapper(calendar)

    let resourceDataCells = viewWrapper.dataGrid.getResourceInfo().map((info) => info.cellEl)
    let resourceLaneCells = viewWrapper.timelineGrid.getResourceLaneEls()
    expect(resourceDataCells.length).toBe(13)
    expect(resourceLaneCells.length).toBe(6)

    let columns = buildColumnStructure(resourceDataCells)
    expect(columns.length).toBe(EXPECTED_COLUMNS.length)
    expect(columns.map((column) => column.map((cell) => cell.text))).toEqual(EXPECTED_COLUMNS)

    let timelineHeight = computeTimelineHeight(resourceLaneCells)
    expect(timelineHeight).toBeGreaterThan(0)

    for (let column of columns) {
      expect(Math.abs(computeColumnHeight(column) - timelineHeight)).toBeLessThanOrEqual(1)
    }
  })
})

// Util
// ----

function buildColumnStructure(cellEls: HTMLElement[]) {
  let cells = cellEls.map((cellEl) => {
    let rect = cellEl.getBoundingClientRect()

    return {
      cellEl,
      text: getCellText(cellEl),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
    }
  })

  cells.sort((a, b) => a.left - b.left || a.top - b.top)

  let columns: typeof cells[] = []

  for (let cell of cells) {
    let column = columns.find((existingColumn) => Math.abs(existingColumn[0].left - cell.left) <= 1)

    if (!column) {
      column = []
      columns.push(column)
    }

    column.push(cell)
  }

  for (let column of columns) {
    column.sort((a, b) => a.top - b.top)
  }

  columns.sort((a, b) => a[0].left - b[0].left)

  return columns
}

function getCellText(cellEl: HTMLElement): string {
  return $(cellEl).text().trim()
}

function computeTimelineHeight(resourceLaneCells: HTMLElement[]): number {
  let firstRect = resourceLaneCells[0].getBoundingClientRect()
  let lastRect = resourceLaneCells[resourceLaneCells.length - 1].getBoundingClientRect()

  return Math.round(lastRect.bottom - firstRect.top)
}

function computeColumnHeight(column: Array<{ top: number, bottom: number }>): number {
  return column[column.length - 1].bottom - column[0].top
}
