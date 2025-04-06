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
      dayTableModel.rowCnt, // rowCnt
      dayTableModel.colCnt * resources.length, // colCnt
    )
  }

  abstract computeCol(dateI: number, resourceI: number): number

  abstract colIsMajor(col: number): boolean

  abstract computeColRanges(dateStartI: number, dateEndI: number, resourceI: number): SlicedCoordRange[]

  buildCells(): DayTableCell[][] {
    let { rowCnt, dayTableModel, resources } = this
    let rows: DayTableCell[][] = []
    let hasMajor = resources.length > 1 && dayTableModel.colCnt > 1

    for (let row = 0; row < rowCnt; row += 1) {
      let rowCells: DayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTableModel.colCnt; dateCol += 1) {
        for (let resourceCol = 0; resourceCol < resources.length; resourceCol += 1) {
          let resource = resources[resourceCol]
          let date = dayTableModel.cellRows[row][dateCol].date
          let renderProps = { resource: new ResourceApi(this.context, resource) }
          let attrs = { 'data-resource-id': resource.id }
          let className = 'fc-resource'
          let dateSpanProps = { resourceId: resource.id }
          let realCol = this.computeCol(dateCol, resourceCol)

          rowCells[realCol] = {
            key: resource.id + ':' + date.toISOString(), // TODO: DRY up this logic with header-tier somehow
            date,
            isMajor: hasMajor && this.colIsMajor(realCol),
            renderProps,
            attrs,
            className,
            dateSpanProps,
          }
        }
      }

      rows.push(rowCells)
    }

    return rows
  }
}
