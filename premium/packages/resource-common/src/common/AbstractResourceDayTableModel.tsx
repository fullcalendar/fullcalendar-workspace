import { CalendarContext, DayTableModel, DayTableCell } from '@fullcalendar/common'
import { __assign } from 'tslib'
import { Resource } from '../structs/resource'
import { ResourceApi } from '../api/ResourceApi'
import { ResourceIndex } from './ResourceIndex'

export abstract class AbstractResourceDayTableModel {
  cells: DayTableCell[][]
  rowCnt: number
  colCnt: number
  resourceIndex: ResourceIndex

  constructor(
    public dayTableModel: DayTableModel,
    public resources: Resource[],
    private context: CalendarContext,
  ) {
    this.resourceIndex = new ResourceIndex(resources)
    this.rowCnt = dayTableModel.rowCnt
    this.colCnt = dayTableModel.colCnt * resources.length
    this.cells = this.buildCells()
  }

  abstract computeCol(dateI, resourceI): number
  abstract computeColRanges(dateStartI, dateEndI, resourceI): {
    firstCol: number,
    lastCol: number,
    isStart: boolean,
    isEnd: boolean
  }[]

  buildCells(): DayTableCell[][] {
    let { rowCnt, dayTableModel, resources } = this
    let rows: DayTableCell[][] = []

    for (let row = 0; row < rowCnt; row += 1) {
      let rowCells: DayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTableModel.colCnt; dateCol += 1) {
        for (let resourceCol = 0; resourceCol < resources.length; resourceCol += 1) {
          let resource = resources[resourceCol]
          let extraHookProps = { resource: new ResourceApi(this.context, resource) }
          let extraDataAttrs = { 'data-resource-id': resource.id }
          let extraClassNames = ['fc-resource']
          let extraDateSpan = { resourceId: resource.id }
          let date = dayTableModel.cells[row][dateCol].date

          rowCells[
            this.computeCol(dateCol, resourceCol)
          ] = {
            key: resource.id + ':' + date.toISOString(),
            date,
            extraHookProps,
            extraDataAttrs,
            extraClassNames,
            extraDateSpan,
          }
        }
      }

      rows.push(rowCells)
    }

    return rows
  }
}
