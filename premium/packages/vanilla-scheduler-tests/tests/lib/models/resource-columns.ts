import { queryPart, queryParts } from '@fullcalendar-tests/standard/tests/lib/models/events'

/*
A header cell of a resource timeGrid/dayGrid view: a date header, a resource header, or a blank cell
(a filterResourcesWithEvents placeholder). Null where the cell has no date or no resource.
*/
export interface HeaderCellInfo {
  date: string | null
  resourceId: string | null
  colSpan: number
}

/*
A body column: a timeGrid day lane or a dayGrid day cell. resourceId is null for a column without
a resource (a non-resource view, or a filterResourcesWithEvents placeholder).
*/
export interface ColumnInfo {
  date: string
  resourceId: string | null
}

/*
The header and columns of a resourceTimeGrid or resourceDayGrid view (or their non-resource
fallbacks). Columns are listed in DOM order, which is visual order in LTR.
*/
export class ResourceColumnsModel {
  constructor(public root: HTMLElement) {
  }

  getHeaderEl(): HTMLElement {
    return queryPart(this.root, 'tableHeader')!
  }

  /*
  The header cells of each header row that carry a date or a resource. The axis cell and
  week-number cell are left out, and so are rows with no such cells.
  */
  getHeaderCellElsByRow(): HTMLElement[][] {
    return Array.from(this.getHeaderEl().querySelectorAll<HTMLElement>('[role=row]'))
      .map((rowEl) => (
        Array.from(rowEl.querySelectorAll<HTMLElement>('[role=columnheader], [role=cell]')).filter((cellEl) => (
          cellEl.hasAttribute('data-date') || cellEl.hasAttribute('data-resource-id')
        ))
      ))
      .filter((cellEls) => cellEls.length)
  }

  getHeaderCellInfoByRow(): HeaderCellInfo[][] {
    return this.getHeaderCellElsByRow().map((cellEls) => cellEls.map((cellEl) => ({
      date: cellEl.getAttribute('data-date'),
      resourceId: cellEl.getAttribute('data-resource-id'),
      colSpan: Number(cellEl.getAttribute('aria-colspan') || 1),
    })))
  }

  /*
  Resource header cells (one per resource, or one per resource per date when dates are above
  resources), optionally only the resource's.
  */
  getResourceHeaderEls(resourceId?: string): HTMLElement[] {
    return queryParts(this.getHeaderEl(), 'resourceDayHeader').filter((el) => (
      resourceId == null || el.getAttribute('data-resource-id') === resourceId
    ))
  }

  getResourceHeaderIds(): string[] {
    return this.getResourceHeaderEls().map((el) => el.getAttribute('data-resource-id')!)
  }

  getResourceHeaderTitles(): string[] {
    return this.getResourceHeaderEls().map((el) => el.textContent!.trim())
  }

  /*
  Date header cells, optionally only the date's.
  */
  getDateHeaderEls(date?: string): HTMLElement[] {
    return queryParts(this.getHeaderEl(), 'dayHeader').filter((el) => (
      date == null || el.getAttribute('data-date') === date
    ))
  }

  /*
  The timeGrid's day lanes (one per column). Lanes disabled by validRange have no data-date and
  are left out, and so are header cells that take the dayLane part (a placeholder's blank cell).
  */
  getDayLaneEls(): HTMLElement[] {
    return this.queryBodyParts('dayLane')
  }

  getDayLaneColumns(): ColumnInfo[] {
    return this.getDayLaneEls().map(getColumnInfo)
  }

  getDayLaneEl(date: string, resourceId: string | null): HTMLElement {
    return findColumnEl(this.getDayLaneEls(), date, resourceId, 'day lane')
  }

  /*
  The dayGrid's day cells, or a timeGrid's all-day cells.
  */
  getDayCellEls(): HTMLElement[] {
    return this.queryBodyParts('dayCell')
  }

  getDayCellColumns(): ColumnInfo[] {
    return this.getDayCellEls().map(getColumnInfo)
  }

  getDayCellEl(date: string, resourceId: string | null): HTMLElement {
    return findColumnEl(this.getDayCellEls(), date, resourceId, 'day cell')
  }

  /*
  The header's blank cell for a placeholder column (with filterResourcesWithEvents): in the bottom
  header row, it has the date but no resource.
  */
  getBlankHeaderCellEl(date: string): HTMLElement {
    const cellElsByRow = this.getHeaderCellElsByRow()
    const cellEl = cellElsByRow[cellElsByRow.length - 1].find((el) => (
      el.getAttribute('data-date') === date && !el.hasAttribute('data-resource-id')
    ))

    if (!cellEl) {
      throw new Error(`No blank header cell for ${date}`)
    }
    return cellEl
  }

  private queryBodyParts(part: string): HTMLElement[] {
    const headerEl = this.getHeaderEl()
    return queryParts(this.root, part).filter((el) => el.hasAttribute('data-date') && !headerEl.contains(el))
  }
}

/*
The resources a resource timeline shows, in row order.
*/
export function getTimelineResourceIds(root: HTMLElement): string[] {
  return queryParts(root, 'resourceLane').map((el) => el.getAttribute('data-resource-id')!)
}

/*
The title text of each resource a resource timeline shows, in row order.
*/
export function getTimelineResourceTitles(root: HTMLElement): string[] {
  return queryParts(root, 'resourceCell').map((el) => el.textContent!.trim())
}

function getColumnInfo(el: HTMLElement): ColumnInfo {
  return {
    date: el.getAttribute('data-date')!,
    resourceId: el.getAttribute('data-resource-id'),
  }
}

function findColumnEl(els: HTMLElement[], date: string, resourceId: string | null, what: string): HTMLElement {
  const matches = els.filter((el) => (
    el.getAttribute('data-date') === date && el.getAttribute('data-resource-id') === resourceId
  ))

  if (matches.length !== 1) {
    throw new Error(`Expected one ${what} for ${date} (resource ${resourceId}), found ${matches.length}`)
  }
  return matches[0]
}
