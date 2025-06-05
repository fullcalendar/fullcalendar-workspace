import { CalendarContext, DayTableModel, DayTableCell, SlicedCoordRange } from '@fullcalendar/core/internal'
import { Resource } from '../structs/resource.js'
import { ResourceApi } from '../api/ResourceApi.js'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel.js'

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
export abstract class ResourcefulDayTableModel extends AbstractResourceDayTableModel {
  constructor(
    dayTableModel: DayTableModel,
    resources: Resource[],
    private context: CalendarContext,
  ) {
    super(
      dayTableModel,
      resources,
      dayTableModel.rowCount, // rowCount
      dayTableModel.colCount * resources.length, // colCount
    )
  }

  abstract computeCol(dateI: number, resourceI: number): number

  abstract colIsMajor(col: number): boolean

  abstract computeColRanges(dateStartI: number, dateEndI: number, resourceI: number): SlicedCoordRange[]

  buildCells(): DayTableCell[][] {
    let { rowCount, dayTableModel, resources } = this
    let rows: DayTableCell[][] = []
    let hasMajor = resources.length > 1 && dayTableModel.colCount > 1

    for (let row = 0; row < rowCount; row += 1) {
      let rowCells: DayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTableModel.colCount; dateCol += 1) {
        for (let resourceCol = 0; resourceCol < resources.length; resourceCol += 1) {
          let resource = resources[resourceCol]
          let date = dayTableModel.cellRows[row][dateCol].date
          let renderProps = { resource: new ResourceApi(this.context, resource) }
          let attrs = { 'data-resource-id': resource.id }
          let dateSpanProps = { resourceId: resource.id }
          let realCol = this.computeCol(dateCol, resourceCol)

          rowCells[realCol] = {
            key: resource.id + ':' + date.toISOString(), // TODO: DRY up this logic with header-tier somehow
            date,
            isMajor: hasMajor && this.colIsMajor(realCol),
            renderProps,
            attrs,
            className: '', // kill this property?
            dateSpanProps,
          }
        }
      }

      rows.push(rowCells)
    }

    return rows
  }
}
