import {
  EventSegUiInteractionState,
  DateComponent,
  memoize,
  addDays,
  DateRange,
  DateProfile,
  Hit,
  DayTableCell,
  setRef,
  RefMapKeyed,
  isDimMapsEqual,
} from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { TableSeg, splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { DayGridRow } from './DayGridRow.js'
import { computeColFromPosition, computeRowFromPosition } from './util.js'

export interface DayGridRowsProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // content
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string

  // dimensions
  colWidth?: number
  width?: number

  // refs
  rowHeightsRef?: Ref<{ [key: string]: number }>
}

export class DayGridRows extends DateComponent<DayGridRowsProps> {
  // memo
  private splitBusinessHourSegs = memoize(splitSegsByRow)
  private splitBgEventSegs = memoize(splitSegsByRow)
  private splitFgEventSegs = memoize(splitSegsByRow)
  private splitDateSelectionSegs = memoize(splitSegsByRow)
  private splitEventDrag = memoize(splitInteractionByRow)
  private splitEventResize = memoize(splitInteractionByRow)

  // ref
  private rowElRefMap = new RefMapKeyed<string, HTMLElement>() // keyed by first cell's key

  // internal
  private currentRowHeights: { [key: string]: number } = {}

  render() {
    let { props, context } = this
    let { options } = context
    let rowCnt = props.cellRows.length

    let fgEventSegsByRow = this.splitFgEventSegs(props.fgEventSegs, rowCnt)
    let bgEventSegsByRow = this.splitBgEventSegs(props.bgEventSegs, rowCnt)
    let businessHourSegsByRow = this.splitBusinessHourSegs(props.businessHourSegs, rowCnt)
    let dateSelectionSegsByRow = this.splitDateSelectionSegs(props.dateSelectionSegs, rowCnt)
    let eventDragByRow = this.splitEventDrag(props.eventDrag, rowCnt)
    let eventResizeByRow = this.splitEventResize(props.eventResize, rowCnt)

    return (
      <div
        className='fcnew-daygrid-rows'
        style={{ width: props.width }}
        ref={this.handleRootEl}
      >
        {props.cellRows.map((cells, row) => (
          <DayGridRow
            key={cells[0].key}
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cells={cells}
            showDayNumbers={rowCnt > 1}
            forPrint={props.forPrint}

            // content
            fgEventSegs={fgEventSegsByRow[row]}
            bgEventSegs={bgEventSegsByRow[row].filter(isSegAllDay) /* HACK */}
            businessHourSegs={businessHourSegsByRow[row]}
            dateSelectionSegs={dateSelectionSegsByRow[row]}
            eventSelection={props.eventSelection}
            eventDrag={eventDragByRow[row]}
            eventResize={eventResizeByRow[row]}
            dayMaxEvents={options.dayMaxEvents}
            dayMaxEventRows={options.dayMaxEventRows}

            // dimensions
            colWidth={props.colWidth}

            // refs
            elRef={this.rowElRefMap.createRef(cells[0].key)}
          />
        ))}
      </div>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate() {
    this.handleSizing()
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  // Handlers
  // -----------------------------------------------------------------------------------------------

  handleRootEl = (rootEl: HTMLDivElement) => {
    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        isHitComboAllowed: this.props.isHitComboAllowed,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSizing = () => {
    const rowHeights: { [key: string]: number } = {}

    for (const [cellKey, rowEl] of this.rowElRefMap.current.entries()) {
      const rect = rowEl.getBoundingClientRect()
      rowHeights[cellKey] = rect.height
    }

    if (!isDimMapsEqual(this.currentRowHeights, rowHeights)) {
      this.currentRowHeights = rowHeights
      setRef(this.props.rowHeightsRef, rowHeights)
    }
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    const { props, context, currentRowHeights } = this

    const colCnt = props.cellRows[0].length
    const { col, left, right } = computeColFromPosition(
      positionLeft,
      elWidth,
      props.colWidth,
      colCnt,
      context.isRtl
    )
    const { row, top, bottom } = computeRowFromPosition(
      positionTop,
      props.cellRows,
      currentRowHeights
    )
    const cell = props.cellRows[row][col]

    return {
      dateProfile: props.dateProfile,
      dateSpan: {
        range: this.getCellRange(row, col),
        allDay: true,
        ...cell.extraDateSpan,
      },
      dayEl: this.getCellEl(row, col),
      rect: {
        left,
        right,
        top,
        bottom,
      },
      layer: 0,
    }
  }

  private getCellEl(row, col): HTMLElement {
    const rowKey = this.props.cellRows[row][0].key
    const rowEl = this.rowElRefMap.current.get(rowKey)
    return rowEl.querySelectorAll(':scope > [role=gridcell]')[col] as HTMLElement // HACK
  }

  private getCellRange(row, col) {
    const start = this.props.cellRows[row][col].date
    const end = addDays(start, 1)
    return { start, end }
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function isSegAllDay(seg: TableSeg) {
  return seg.eventRange.def.allDay
}
