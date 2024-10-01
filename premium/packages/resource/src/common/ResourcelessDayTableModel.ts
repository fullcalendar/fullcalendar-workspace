import { DayTableModel, DayTableCell } from '@fullcalendar/core/internal'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel.js'

export class ResourcelessDayTableModel extends AbstractResourceDayTableModel {
  constructor(dayTableModel: DayTableModel) {
    super(
      dayTableModel,
      [], // resources
      dayTableModel.rowCnt, // rowCnt
      dayTableModel.colCnt, // colCnt
    )
  }

  computeCol(dateI: number, _resourceI: number): number {
    return dateI
  }

  computeColRanges(dateStartI: number, dateEndI: number, _resourceI: number): {
    firstCol: number,
    lastCol: number,
    isStart: boolean,
    isEnd: boolean
  }[] {
    return [
      {
        firstCol: dateStartI,
        lastCol: dateEndI,
        isStart: true,
        isEnd: true,
      },
    ]
  }

  buildCells(): DayTableCell[][] {
    return this.dayTableModel.buildCells()
  }
}
