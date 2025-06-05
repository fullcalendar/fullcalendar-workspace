import { ResourcefulDayTableModel } from './ResourcefulDayTableModel.js'

/*
resources over dates
*/
export class ResourceDayTableModel extends ResourcefulDayTableModel {
  computeCol(dateI: number, resourceI: number) {
    return resourceI * this.dayTableModel.colCount + dateI
  }

  colIsMajor(col: number): boolean {
    const dayCnt = this.dayTableModel.colCount
    return dayCnt > 1 && !(col % dayCnt)
  }

  /*
  all date ranges are intact
  */
  computeColRanges(dateStartI: number, dateEndI: number, resourceI: number) {
    return [
      {
        start: this.computeCol(dateStartI, resourceI),
        end: this.computeCol(dateEndI, resourceI),
        isStart: true,
        isEnd: true,
      },
    ]
  }
}
