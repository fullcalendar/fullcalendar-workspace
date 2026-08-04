import { CalendarContext, DateMarker, DayCol, DayTableCell, DayTableModel, Hit, SlicedCoordRange } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../api/ResourceApi'
import { Resource } from '../structs/resource'
import { ResourceIndex } from './ResourceIndex'

export type DateColIndex = number // index in the date-level DayCol list
export type ViewColIndex = number // index in the final resource-expanded column list
export type ViewColRange = SlicedCoordRange // range in the final resource-expanded column list

export interface ResourceDayCol extends DayCol {
  dateI: DateColIndex
  resource: Resource | null
  resourceI: number
}

export interface ResourceDayGroup {
  date?: DateMarker
  resource?: Resource
  cols: ResourceDayCol[]
}

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
export class AbstractResourceDayTableModel {
  cells: DayTableCell[][]
  resourceIndex: ResourceIndex
  colCount: number
  cols: ResourceDayCol[]
  colLookup: { [key: string]: ViewColIndex }
  dateFirstCols: ViewColIndex[]

  private colGroupIndices: number[]

  constructor(
    public dayCols: DayCol[],
    // null for timegrid, which is a flat row of columns. daygrid passes one because its
    // columns can repeat across week rows, and only it needs the 2D `cells` projection.
    // residual seam: `cells` and `cols` describe the same columns at different dimensions
    public dayTableModel: DayTableModel | null,
    public resources: Resource[],
    public groups: ResourceDayGroup[],
    public datesAboveResources: boolean,
    context: CalendarContext,
  ) {
    let cols: ResourceDayCol[] = []
    let colLookup = {}
    let dateFirstCols = []
    let colGroupIndices = []

    for (let groupI = 0; groupI < groups.length; groupI += 1) {
      for (let col of groups[groupI].cols) {
        let colI = cols.length

        cols.push(col)
        colLookup[buildColKey(col.dateI, col.resourceI)] = colI
        colGroupIndices.push(groupI)

        if (dateFirstCols[col.dateI] == null) {
          dateFirstCols[col.dateI] = colI
        }
      }
    }

    this.resourceIndex = new ResourceIndex(resources)
    this.colCount = cols.length
    this.cols = cols
    this.colLookup = colLookup
    this.dateFirstCols = dateFirstCols
    this.colGroupIndices = colGroupIndices
    this.cells = !dayTableModel || dayTableModel.rowCount === 1
      ? [cols]
      : buildResourceCells(dayTableModel, cols, context)
  }

  /*
  -1 means the pair has no column: either per-date filtering dropped it, or the whole date
  was omitted. Callers must handle that — a seg aimed at a missing pair is discarded, which
  is how filtered layouts avoid rendering events into columns that don't exist.
  */
  computeCol(dateI: DateColIndex, resourceI: number): ViewColIndex {
    // the resourceless model keys every column under -1, so lookups succeed no matter which
    // resource index a splitter happens to pass in
    let key = buildColKey(dateI, this.resources.length ? resourceI : -1)
    let col = this.colLookup[key]

    return col == null ? -1 : col
  }

  computeColRanges(
    dateStartI: DateColIndex,
    dateEndI: DateColIndex,
    resourceI: number,
  ): ViewColRange[] {
    let ranges: ViewColRange[] = []
    let currentRange: ViewColRange | null = null
    let currentGroupI = -1

    for (let dateI = dateStartI; dateI < dateEndI; dateI += 1) {
      let col = this.computeCol(dateI, resourceI)

      if (col !== -1) {
        let groupI = this.colGroupIndices[col]

        // adjacency alone isn't enough to merge: with dates above resources, one resource's
        // columns for consecutive dates ARE adjacent but belong to different date groups, and
        // a seg spanning them must break so each date renders its own segment
        if (currentRange && currentRange.end === col && currentGroupI === groupI) {
          currentRange.end = col + 1
          currentRange.isEnd = dateI === dateEndI - 1
        } else {
          currentRange = {
            start: col,
            end: col + 1,
            isStart: dateI === dateStartI,
            isEnd: dateI === dateEndI - 1,
          }
          currentGroupI = groupI
          ranges.push(currentRange)
        }
      } else {
        currentRange = null
        currentGroupI = -1
      }
    }

    return ranges
  }

  /*
  dates missing this resource's column (filtered-out or fully-omitted) don't break the span.
  the highlight simply skips them while the reported range stays continuous, like a hidden day
  */
  isHitComboAllowed(hit0: Hit, hit1: Hit, allowAcrossResources: boolean): boolean {
    return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
  }
}

function buildResourceCells(
  dayTableModel: DayTableModel,
  cols: ResourceDayCol[],
  context: CalendarContext,
): DayTableCell[][] {
  let rows: DayTableCell[][] = []

  for (let row = 0; row < dayTableModel.rowCount; row += 1) {
    rows.push(cols.map((col) => {
      let date = dayTableModel.cellRows[row][col.dateI].date
      let { resource } = col

      if (!resource) {
        return {
          key: date.toISOString(),
          date,
          isMajor: col.isMajor,
        }
      }

      return {
        ...buildResourceCellFields(resource, date, context),
        date,
        isMajor: col.isMajor,
      }
    }))
  }

  return rows
}

export function buildResourceDayCol(
  dayCol: DayCol,
  dateI: DateColIndex,
  resource: Resource | null,
  resourceI: number,
  isMajor: boolean,
  context: CalendarContext,
): ResourceDayCol {
  if (!resource) {
    return {
      ...dayCol,
      dateI,
      resource: null,
      resourceI,
      isMajor,
    }
  }

  return {
    ...dayCol,
    ...buildResourceCellFields(resource, dayCol.date, context),
    dateI,
    resource,
    resourceI,
    isMajor,
  }
}

/*
What makes a day cell resource-specific. A fresh ResourceApi per cell is deliberate: in
multi-row daygrid the same column is rebuilt for each week row.
*/
function buildResourceCellFields(resource: Resource, date: DateMarker, context: CalendarContext) {
  return {
    key: resource.id + ':' + date.toISOString(),
    renderProps: { resource: new ResourceApi(context, resource) },
    attrs: { 'data-resource-id': resource.id },
    className: '',
    dateSpanProps: { resourceId: resource.id },
  }
}

function buildColKey(dateI: DateColIndex, resourceI: number): string {
  return dateI + ':' + resourceI
}
