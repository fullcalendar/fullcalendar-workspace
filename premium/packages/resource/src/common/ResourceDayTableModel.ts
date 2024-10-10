import { ResourcefulDayTableModel } from './ResourcefulDayTableModel.js'

/*
resources over dates
*/
export class ResourceDayTableModel extends ResourcefulDayTableModel {
  computeCol(dateI: number, resourceI: number) {
    return resourceI * this.dayTableModel.colCnt + dateI
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
