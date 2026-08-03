import { CalendarContext, DateMarker, DayCol, DayTableCell, DayTableModel, Hit, SlicedCoordRange, startOfDay } from '@fullcalendar/preact/protected-api'
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
  hasPlaceholderCols: boolean

  private colGroupIndices: number[]

  constructor(
    public dayTableModel: DayTableModel,
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
    this.hasPlaceholderCols = resources.length > 0 && cols.some((col) => !col.resource)
    this.colGroupIndices = colGroupIndices
    this.cells = dayTableModel.rowCount === 1
      ? [cols]
      : buildResourceCells(dayTableModel, cols, context)
  }

  computeCol(dateI: DateColIndex, resourceI: number): ViewColIndex {
    let key = buildColKey(dateI, this.resources.length ? resourceI : -1)
    let col = this.colLookup[key]

    return col == null ? -1 : col
  }

  computeColRanges(
    dateStartI: DateColIndex,
    dateEndI: DateColIndex,
    resourceI: number,
    fallbackToPlaceholder = false,
  ): ViewColRange[] {
    let ranges: ViewColRange[] = []
    let currentRange: ViewColRange | null = null
    let currentGroupI = -1

    for (let dateI = dateStartI; dateI < dateEndI; dateI += 1) {
      let col = this.computeCol(dateI, resourceI)

      if (col === -1 && fallbackToPlaceholder) {
        col = this.computeCol(dateI, -1)
      }

      if (col !== -1) {
        let groupI = this.colGroupIndices[col]

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

  isHitComboAllowed(hit0: Hit, hit1: Hit, allowAcrossResources: boolean): boolean {
    if (allowAcrossResources) {
      return true
    }

    let resourceId = hit0.dateSpan.resourceId

    if (resourceId !== hit1.dateSpan.resourceId) {
      return false
    }

    let resourceI = resourceId == null ? -1 : this.resourceIndex.indicesById[resourceId]
    let dateI0 = this.computeDateI(hit0.dateSpan.range.start)
    let dateI1 = this.computeDateI(hit1.dateSpan.range.start)

    if (resourceI == null || dateI0 === -1 || dateI1 === -1) {
      return false
    }

    for (let dateI = Math.min(dateI0, dateI1); dateI <= Math.max(dateI0, dateI1); dateI += 1) {
      if (this.computeCol(dateI, resourceI) === -1) {
        return false
      }
    }

    return true
  }

  private computeDateI(date: DateMarker): DateColIndex {
    let dayStart = startOfDay(date).valueOf()

    return this.dayTableModel.headerDates.findIndex((headerDate) => headerDate.valueOf() === dayStart)
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
        key: resource.id + ':' + date.toISOString(),
        date,
        isMajor: col.isMajor,
        renderProps: { resource: new ResourceApi(context, resource) },
        attrs: { 'data-resource-id': resource.id },
        className: '',
        dateSpanProps: { resourceId: resource.id },
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
    key: resource.id + ':' + dayCol.date.toISOString(),
    dateI,
    resource,
    resourceI,
    isMajor,
    renderProps: { resource: new ResourceApi(context, resource) },
    attrs: { 'data-resource-id': resource.id },
    className: '',
    dateSpanProps: { resourceId: resource.id },
  }
}

function buildColKey(dateI: DateColIndex, resourceI: number): string {
  return dateI + ':' + resourceI
}
