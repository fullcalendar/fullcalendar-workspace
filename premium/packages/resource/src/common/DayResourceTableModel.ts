import { ResourcefulDayTableModel } from './ResourcefulDayTableModel.js'

/*
dates over resources
*/
export class DayResourceTableModel extends ResourcefulDayTableModel {
  computeCol(dateI, resourceI) {
    return dateI * this.resources.length + resourceI
  }

  /*
  every single day is broken up
  */
  computeColRanges(dateStartI, dateEndI, resourceI) {
    let segs = []

    for (let i = dateStartI; i <= dateEndI; i += 1) {
      let col = this.computeCol(i, resourceI)

      segs.push({
        firstCol: col,
        lastCol: col,
        isStart: i === dateStartI,
        isEnd: i === dateEndI,
      })
    }

    return segs
  }
}
