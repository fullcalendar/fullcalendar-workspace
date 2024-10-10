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
  computeColRanges(dateStartI: number, dateEndI: number, resourceI: number) {
    let segs = []

    for (let i = dateStartI; i < dateEndI; i += 1) {
      let col = this.computeCol(i, resourceI)

      segs.push({
        start: col,
        end: col + 1,
        isStart: i === dateStartI,
        isEnd: i === dateEndI - 1,
      })
    }

    return segs
  }
}
