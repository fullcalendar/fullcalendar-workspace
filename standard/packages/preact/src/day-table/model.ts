import { DateEnv, DateMarker, DateRange, Duration, addDays, rangeContainsMarker } from '@full-ui/headless-calendar'
import { DateProfile, isMajorUnit } from '../date-profile/DateProfileGenerator'
import { SlicedCoordRange } from '../event-segs/coord-range'
import { HiddenDays } from '../date-profile/hidden-days'
import { DayTableCell } from './day-grid-range'
import { DaySeries, buildDaySeries } from './day-series'
import { Dictionary } from '../options/options'

/*
The column model shared by every day-table view (DayGrid, TimeGrid, MultiMonth's months and the
resource views). Plain objects, built by pure functions. Standard knows nothing about resources:
a column carries an opaque `entityKey` ('' for none) and whatever render props its builder gave it.
*/

// a date column: one date of the table's first row, with its range (slot-widened in TimeGrid)
export interface DayCol {
  key: string
  date: DateMarker
  range: DateRange
  isMajor: boolean
  isDisabled: boolean
  isInert?: boolean // structural columns that cannot be interaction targets
  renderProps?: Dictionary
  attrs?: Dictionary
  className?: string
  dateSpanProps?: Dictionary
}

export interface DayColSlotRange {
  slotMinTime: Duration
  slotMaxTime: Duration
}

export interface DayTableColumn extends DayCol {
  dateI: number // index into `dayCols` (column-in-row for multi-row tables)
  entityKey: string // '' for plain views and placeholder columns. premium: the resource id
  entity: unknown // null, or premium's Resource. opaque to standard
  groupI: number // index into `groups`
}

export interface DayTableColumnGroup {
  key: string // premium: date iso or resource id. plain: ''
  date?: DateMarker // dates-above-resources, or the one-date case
  entity?: unknown // resources-above-dates
  cols: DayTableColumn[]
}

export interface DayTableModel {
  // the date dimension (the coordinates events are sliced in)
  daySeries: DaySeries
  dayCols: DayCol[] // one per date column: dates per row. same objects as `cols` in plain models
  rowCount: number

  // the view columns (the coordinates segs are projected onto)
  colCount: number // view columns per row
  cols: DayTableColumn[] // colCount long, in render order
  groups: DayTableColumnGroup[]
  cellRows: DayTableCell[][] // rowCount × colCount. DayGridLayout, hits and scrolling read these
  headerDates: DateMarker[] // cellRows[0] dates
  colsByEntityKey: { [entityKey: string]: number[] } // view-column indices per key, ascending. a participating key may have none
  keylessCols: number[] // columns with entityKey '': every column in plain and resourceless models
  dateFirstCols: number[] // the first view column per dateI
  isInert: boolean // every column inert (premium's resourceless model). plain: false

  // the entities the model was built for, in order (premium: its resources, or none after the
  // all-filtered fallback). plain: none. the keying and the header derive from this
  participants: unknown[]

  colLookup: { [dateIAndEntityKey: string]: number } // see lookUpDayTableCol
}

export const NO_PARTICIPANTS: unknown[] = []

export interface DayTableModelConfig {
  breakOnWeeks: boolean // DayGrid: rows of weeks for year/month/week ranges
  majorUnit?: string // DayGrid single-row. TimeGrid: none, keeping every column non-major
  slotRange?: DayColSlotRange // TimeGrid: the columns' ranges are slot-widened
}

/*
A plain model: one column per date, no entities
*/
export function buildDayTableModel(
  dateProfile: DateProfile,
  hiddenDays: HiddenDays, // the generator's, so a subclass's isHiddenDay applies
  dateEnv: DateEnv,
  config: DayTableModelConfig,
): DayTableModel {
  const daySeries = buildDaySeries(dateProfile.renderRange, hiddenDays)
  const { activeRange } = dateProfile
  const { majorUnit, slotRange } = config
  const { dates } = daySeries
  let daysPerRow: number
  let rowCount: number

  if (config.breakOnWeeks) {
    // count columns until the day-of-week repeats
    let firstDay = dates[0].getUTCDay()

    for (daysPerRow = 1; daysPerRow < dates.length; daysPerRow += 1) {
      if (dates[daysPerRow].getUTCDay() === firstDay) {
        break
      }
    }
    rowCount = Math.ceil(dates.length / daysPerRow)
  } else {
    rowCount = 1
    daysPerRow = dates.length
  }

  const cellRows: DayTableCell[][] = []

  for (let row = 0; row < rowCount; row += 1) {
    let cells: DayTableCell[] = []

    for (let col = 0; col < daysPerRow; col += 1) {
      let date = dates[row * daysPerRow + col]

      cells.push({
        key: date.toISOString(),
        date,
        isMajor: majorUnit ? isMajorUnit(date, majorUnit, dateEnv) : false,
        isDisabled: activeRange === null || (
          activeRange !== undefined && !rangeContainsMarker(activeRange, date)
        ),
      })
    }

    cellRows.push(cells)
  }

  const cols: DayTableColumn[] = cellRows[0].map((cell, dateI) => ({
    ...cell,
    range: slotRange
      ? {
          start: dateEnv.add(cell.date, slotRange.slotMinTime),
          end: dateEnv.add(cell.date, slotRange.slotMaxTime),
        }
      : {
          start: cell.date,
          end: addDays(cell.date, 1),
        },
    dateI,
    entityKey: '',
    entity: null,
    groupI: 0,
  }))

  return buildModelFromCols(
    daySeries,
    cols, // the plain model's columns ARE its date columns
    rowCount,
    [{ key: '', cols }],
    cellRows,
    NO_PARTICIPANTS,
    false,
  )
}

/*
Indexes a model's columns. For builders of non-plain models (premium) too
*/
export function buildModelFromCols(
  daySeries: DaySeries,
  dayCols: DayCol[],
  rowCount: number,
  groups: DayTableColumnGroup[],
  cellRows: DayTableCell[][] | null, // null: one row, the columns themselves
  participants: unknown[],
  isInert: boolean,
): DayTableModel {
  let cols: DayTableColumn[] = []
  let colsByEntityKey: { [entityKey: string]: number[] } = {}
  let keylessCols: number[] = []
  let dateFirstCols: number[] = []
  let colLookup: { [dateIAndEntityKey: string]: number } = {}

  for (let group of groups) {
    for (let col of group.cols) {
      let colI = cols.length

      cols.push(col)
      colLookup[buildColLookupKey(col.dateI, col.entityKey)] = colI

      if (col.entityKey) {
        (colsByEntityKey[col.entityKey] || (colsByEntityKey[col.entityKey] = [])).push(colI)
      } else {
        keylessCols.push(colI)
      }

      if (dateFirstCols[col.dateI] == null) {
        dateFirstCols[col.dateI] = colI
      }
    }
  }

  return {
    daySeries,
    dayCols,
    rowCount,
    colCount: cols.length,
    cols,
    groups,
    cellRows: cellRows || [cols],
    headerDates: (cellRows ? cellRows[0] : cols).map((cell) => cell.date),
    colsByEntityKey,
    keylessCols,
    dateFirstCols,
    isInert,
    participants,
    colLookup,
  }
}

/*
The view column of a date column and an entity, -1 if there's none (per-date filtering dropped
it). '' finds the keyless (placeholder) column of that date
*/
export function lookUpDayTableCol(model: DayTableModel, dateI: number, entityKey: string): number {
  let colI = model.colLookup[buildColLookupKey(dateI, entityKey)]

  return colI == null ? -1 : colI
}

/*
The view-column ranges a date-column range [dateStartI, dateEndI) covers for an entity. Adjacent
columns merge only within a group: with dates above resources, one resource's columns for
consecutive dates ARE adjacent but belong to different date groups, and a seg spanning them must
break so each date renders its own segment. A missing column breaks the range too
*/
export function computeDayTableColRanges(
  model: DayTableModel,
  dateStartI: number,
  dateEndI: number,
  entityKey: string,
): SlicedCoordRange[] {
  let ranges: SlicedCoordRange[] = []
  let currentRange: SlicedCoordRange | null = null
  let currentGroupI = -1

  for (let dateI = dateStartI; dateI < dateEndI; dateI += 1) {
    let colI = lookUpDayTableCol(model, dateI, entityKey)

    if (colI !== -1) {
      let { groupI } = model.cols[colI]

      if (currentRange && currentRange.end === colI && currentGroupI === groupI) {
        currentRange.end = colI + 1
        currentRange.isEnd = dateI === dateEndI - 1
      } else {
        currentRange = {
          start: colI,
          end: colI + 1,
          isStart: dateI === dateStartI,
          isEnd: dateI === dateEndI - 1,
        }
        currentGroupI = groupI
        ranges.push(currentRange)
      }
    } else {
      currentRange = null
      currentGroupI = -1
    }
  }

  return ranges
}

function buildColLookupKey(dateI: number, entityKey: string): string {
  return dateI + ':' + entityKey
}
