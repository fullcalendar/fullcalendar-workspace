import { DaySeriesModel } from './DaySeriesModel.js'
import { DateRange } from '../datelib/date-range.js'
import { DateMarker } from '../datelib/marker.js'
import { Dictionary } from '../options.js'
import { SlicedCoordRange } from '../coord-range.js'
import { DateEnv } from '../datelib/env.js'
import { isMajorUnit } from '../DateProfileGenerator.js'

export interface DayGridRange extends SlicedCoordRange {
  row: number
  // `start` is start-COLUMN
  // `end` is end-COLUMN
}

/*
TODO: move this to @fullcalendar/daygrid
TODO: DRY-up these types and utils with header-tier
*/
export interface DayTableCell {
  key: string // probably just the serialized date, but could be other metadata if this col is specific to another entity
  date: DateMarker
  isMajor: boolean
  renderProps?: Dictionary
  attrs?: Dictionary
  className?: string
  dateSpanProps?: Dictionary
}

export class DayTableModel {
  rowCnt: number
  colCnt: number
  cellRows: DayTableCell[][]
  headerDates: DateMarker[]

  private daySeries: DaySeriesModel

  constructor(
    daySeries: DaySeriesModel,
    breakOnWeeks: boolean,
    private dateEnv: DateEnv,
    private majorUnit = '',
  ) {
    let { dates } = daySeries
    let daysPerRow: number
    let firstDay: number
    let rowCnt: number

    if (breakOnWeeks) {
      // count columns until the day-of-week repeats
      firstDay = dates[0].getUTCDay()
      for (daysPerRow = 1; daysPerRow < dates.length; daysPerRow += 1) {
        if (dates[daysPerRow].getUTCDay() === firstDay) {
          break
        }
      }
      rowCnt = Math.ceil(dates.length / daysPerRow)
    } else {
      rowCnt = 1
      daysPerRow = dates.length
    }

    this.rowCnt = rowCnt
    this.colCnt = daysPerRow
    this.daySeries = daySeries
    this.cellRows = this.buildCells()
    this.headerDates = this.buildHeaderDates()
  }

  public buildCells() {
    let rows = []

    for (let row = 0; row < this.rowCnt; row += 1) {
      let cells = []

      for (let col = 0; col < this.colCnt; col += 1) {
        cells.push(
          this.buildCell(row, col),
        )
      }

      rows.push(cells)
    }

    return rows
  }

  private buildCell(row, col): DayTableCell {
    let date = this.daySeries.dates[row * this.colCnt + col]

    return {
      key: date.toISOString(),
      date,
      isMajor: this.cellIsMajor(date),
    }
  }

  protected cellIsMajor(dateMarker: DateMarker): boolean {
    return this.majorUnit && isMajorUnit(dateMarker, this.majorUnit, this.dateEnv)
  }

  private buildHeaderDates() {
    let dates = []

    for (let col = 0; col < this.colCnt; col += 1) {
      dates.push(this.cellRows[0][col].date)
    }

    return dates
  }

  sliceRange(range: DateRange): DayGridRange[] {
    let { colCnt } = this
    let seriesSeg = this.daySeries.sliceRange(range)
    let segs: DayGridRange[] = []

    if (seriesSeg) {
      const { start, end } = seriesSeg
      let index = start

      while (index < end) {
        let row = Math.floor(index / colCnt)
        let nextIndex = Math.min((row + 1) * colCnt, end)

        segs.push({
          row,
          start: index % colCnt,
          end: (nextIndex - 1) % colCnt + 1,
          isStart: seriesSeg.isStart && index === start,
          isEnd: seriesSeg.isEnd && nextIndex === end,
        })

        index = nextIndex
      }
    }

    return segs
  }
}
