import {
  EventSegUiInteractionState,
  DateComponent,
  PositionCache,
  memoize,
  addDays,
  RefMap,
  DateRange,
  NowTimer,
  DateMarker,
  DateProfile,
  Hit,
  DayTableCell,
} from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { TableSeg, splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { DayGridRow } from './DayGridRow.js'

export interface DayGridRowsProps {
  rowPositionsRef?: Ref<PositionCache> // TODO: hook up!

  dateProfile: DateProfile
  cells: DayTableCell[][] // cells-BY-ROW
  showWeekNumbers: boolean
  businessHourSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  fgEventSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventSelection: string
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean // who uses this???
  width?: number
  colWidth?: number
  viewWidth?: number // needed for hit-computations
}

export class DayGridRows extends DateComponent<DayGridRowsProps> {
  private splitBusinessHourSegs = memoize(splitSegsByRow)
  private splitBgEventSegs = memoize(splitSegsByRow)
  private splitFgEventSegs = memoize(splitSegsByRow)
  private splitDateSelectionSegs = memoize(splitSegsByRow)
  private splitEventDrag = memoize(splitInteractionByRow)
  private splitEventResize = memoize(splitInteractionByRow)
  private rootEl: HTMLElement
  private rowRefs = new RefMap<DayGridRow>()
  private rowPositions: PositionCache
  private colPositions: PositionCache // TODO: kill. use colWidth!

  render() {
    let { props } = this
    let rowCnt = props.cells.length

    let businessHourSegsByRow = this.splitBusinessHourSegs(props.businessHourSegs, rowCnt)
    let bgEventSegsByRow = this.splitBgEventSegs(props.bgEventSegs, rowCnt)
    let fgEventSegsByRow = this.splitFgEventSegs(props.fgEventSegs, rowCnt)
    let dateSelectionSegsByRow = this.splitDateSelectionSegs(props.dateSelectionSegs, rowCnt)
    let eventDragByRow = this.splitEventDrag(props.eventDrag, rowCnt)
    let eventResizeByRow = this.splitEventResize(props.eventResize, rowCnt)

    return (
      <NowTimer unit="day">{(nowDate: DateMarker, todayRange: DateRange) => (
        <div ref={this.handleRootEl} style={{ width: props.width }}>
          {props.cells.map((cells, row) => (
            <DayGridRow
              ref={this.rowRefs.createRef(row)}
              key={
                cells.length
                  ? cells[0].date.toISOString() /* best? or put key on cell? or use diff formatter? */
                  : row // in case there are no cells (like when resource view is loading)
              }
              showDayNumbers={rowCnt > 1}
              showWeekNumbers={props.showWeekNumbers}
              todayRange={todayRange}
              dateProfile={props.dateProfile}
              cells={cells}
              businessHourSegs={businessHourSegsByRow[row]}
              eventSelection={props.eventSelection}
              bgEventSegs={bgEventSegsByRow[row].filter(isSegAllDay) /* hack */}
              fgEventSegs={fgEventSegsByRow[row]}
              dateSelectionSegs={dateSelectionSegsByRow[row]}
              eventDrag={eventDragByRow[row]}
              eventResize={eventResizeByRow[row]}
              dayMaxEvents={props.dayMaxEvents}
              dayMaxEventRows={props.dayMaxEventRows}
              forPrint={props.forPrint}
              colWidth={props.colWidth}
            />
          ))}
        </div>
      )}</NowTimer>
    )
  }

  handleRootEl = (rootEl: HTMLDivElement) => {
    this.rootEl = rootEl

    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        isHitComboAllowed: this.props.isHitComboAllowed,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  // Hit System
  // ----------------------------------------------------------------------------------------------------

  prepareHits() {
    this.rowPositions = new PositionCache(
      this.rootEl,
      this.rowRefs.collect().map((rowObj) => rowObj.getCellEls()[0]), // first cell el in each row. TODO: not optimal
      false,
      true, // vertical
    )

    this.colPositions = new PositionCache(
      this.rootEl,
      this.rowRefs.currentMap[0].getCellEls(), // cell els in first row
      true, // horizontal
      false,
    )
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { colPositions, rowPositions } = this
    let col = colPositions.leftToIndex(positionLeft)
    let row = rowPositions.topToIndex(positionTop)

    if (row != null && col != null) {
      let cell = this.props.cells[row][col]

      return {
        dateProfile: this.props.dateProfile,
        dateSpan: {
          range: this.getCellRange(row, col),
          allDay: true,
          ...cell.extraDateSpan,
        },
        dayEl: this.getCellEl(row, col),
        rect: {
          left: colPositions.lefts[col],
          right: colPositions.rights[col],
          top: rowPositions.tops[row],
          bottom: rowPositions.bottoms[row],
        },
        layer: 0,
      }
    }

    return null
  }

  private getCellEl(row, col) {
    return this.rowRefs.currentMap[row].getCellEls()[col] // TODO: not optimal!!!!!!! won't work!@!!!!!!!!!!
  }

  private getCellRange(row, col) {
    let start = this.props.cells[row][col].date
    let end = addDays(start, 1)
    return { start, end }
  }
}

function isSegAllDay(seg: TableSeg) {
  return seg.eventRange.def.allDay
}
