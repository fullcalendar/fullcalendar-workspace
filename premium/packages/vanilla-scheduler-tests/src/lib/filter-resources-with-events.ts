import { expect } from 'vitest'
import { ColumnInfo, HeaderCellInfo, ResourceColumnsModel } from './models/resource-columns'

/*
Expected layouts for filterResourcesWithEvents in multi-day resource column views, where each date
gets only the resources with events on it.
*/

export type ResourceIdsByDate = { [date: string]: string[] }

/*
The body columns, in order. With dates above resources, a date with no resources gets one
resource-less placeholder column. With resources above dates, it gets nothing.
*/
export function buildExpectedColumns(
  dates: string[],
  resourceIdsByDate: ResourceIdsByDate,
  resourceOrder: string[],
  datesAboveResources: boolean,
): ColumnInfo[] {
  const columns: ColumnInfo[] = []

  if (datesAboveResources) {
    for (const date of dates) {
      const resourceIds = resourceIdsByDate[date]

      if (resourceIds.length) {
        for (const resourceId of resourceIds) {
          columns.push({ date, resourceId })
        }
      } else {
        columns.push({ date, resourceId: null }) // inert placeholder
      }
    }
  } else {
    for (const resourceId of resourceOrder) {
      for (const date of dates) {
        if (resourceIdsByDate[date].includes(resourceId)) {
          columns.push({ date, resourceId })
        }
      }
    }
  }

  return columns
}

export function buildExpectedHeaderRows(
  dates: string[],
  resourceIdsByDate: ResourceIdsByDate,
  resourceOrder: string[],
  datesAboveResources: boolean,
): HeaderCellInfo[][] {
  const topRow: HeaderCellInfo[] = []
  let bottomRow: HeaderCellInfo[] = []

  if (datesAboveResources) {
    for (const date of dates) {
      topRow.push({
        date,
        resourceId: null,
        colSpan: resourceIdsByDate[date].length || 1, // a date with no resources spans its placeholder
      })
    }

    bottomRow = buildExpectedColumns(dates, resourceIdsByDate, resourceOrder, true).map((column) => ({
      ...column,
      colSpan: 1,
    }))
  } else {
    for (const resourceId of resourceOrder) {
      const resourceDates = dates.filter((date) => resourceIdsByDate[date].includes(resourceId))

      if (resourceDates.length) {
        topRow.push({ date: null, resourceId, colSpan: resourceDates.length })

        for (const date of resourceDates) {
          bottomRow.push({ date, resourceId, colSpan: 1 })
        }
      }
    }
  }

  return [topRow, bottomRow]
}

/*
The bottom header row has one colSpan-1 cell per column, so it's a stand-in for the body columns.
Cells in the rows above must line up with the cells they span, which is only true if their width
tracks colSpan. With ragged groups, equal-share sizing doesn't.
*/
export function expectHeaderRowsAlign(columns: ResourceColumnsModel): void {
  const cellElsByRow = columns.getHeaderCellElsByRow()
  const colEls = cellElsByRow[cellElsByRow.length - 1]

  expect(cellElsByRow.length).toBeGreaterThan(1)

  for (const cellEls of cellElsByRow.slice(0, -1)) {
    let colI = 0

    for (const cellEl of cellEls) {
      const colSpan = Number(cellEl.getAttribute('aria-colspan') || 1)
      const coveredWidth = colEls.slice(colI, colI + colSpan).reduce(
        (total, colEl) => total + colEl.getBoundingClientRect().width,
        0,
      )

      // tolerance for sub-pixel layout rounding
      expect(Math.abs(cellEl.getBoundingClientRect().width - coveredWidth)).toBeLessThan(1)
      colI += colSpan
    }

    expect(colI).toBe(colEls.length)
  }
}

/*
Keyed by date and resource id (empty for a placeholder). Later calls overwrite earlier ones.
*/
export function buildIsMajorByColumn(
  calls: { date: Date, resource?: { id: string }, isMajor: boolean }[][],
): { [key: string]: boolean } {
  const isMajorByColumn: { [key: string]: boolean } = {}

  for (const [info] of calls) {
    const key = info.date.toISOString().slice(0, 10) + ':' + (info.resource ? info.resource.id : '')
    isMajorByColumn[key] = info.isMajor
  }

  return isMajorByColumn
}
