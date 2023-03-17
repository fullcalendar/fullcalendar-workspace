import { AbstractResourceDayTableModel } from './AbstractResourceDayTableModel.js'

/*
resources over dates
*/
export class ResourceDayTableModel extends AbstractResourceDayTableModel {
  computeCol(dateI, resourceI) {
    return resourceI * this.dayTableModel.colCnt + dateI
  }

  /*
  all date ranges are intact
  */
  computeColRanges(dateStartI, dateEndI, resourceI) {
    return [
      {
        firstCol: this.computeCol(dateStartI, resourceI),
        lastCol: this.computeCol(dateEndI, resourceI),
        isStart: true,
        isEnd: true,
      },
    ]
  }
}
