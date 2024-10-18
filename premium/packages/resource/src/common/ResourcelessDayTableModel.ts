import { DayTableModel, DayTableCell, SlicedCoordRange } from '@fullcalendar/core/internal'
import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel.js'

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
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

  computeColRanges(dateStartI: number, dateEndI: number, _resourceI: number): SlicedCoordRange[] {
    return [
      {
        start: dateStartI,
        end: dateEndI,
        isStart: true,
        isEnd: true,
      },
    ]
  }

  buildCells(): DayTableCell[][] {
    return this.dayTableModel.buildCells()
  }
}
