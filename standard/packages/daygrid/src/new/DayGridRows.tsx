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
  compareObjs,
} from '@fullcalendar/core/internal'
import { Ref, createElement } from '@fullcalendar/core/preact'
import { TableSeg, splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { DayGridRow } from './DayGridRow.js'

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
  private rowElRefMap = new RefMapKeyed<string, HTMLElement>()

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
      <div ref={this.handleRootEl} style={{ width: props.width }}>
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
            bgEventSegs={bgEventSegsByRow[row].filter(isSegAllDay) /* hack */}
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
  }

  componentDidUpdate(): void {
    this.handleSizing()
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
    // rowHeights
    // ----------

    const rowHeights: { [key: string]: number } = {}
    const { cellRows } = this.props
    let row = 0

    for (const rowEl of this.rowElRefMap.current.values()) {
      const rect = rowEl.getBoundingClientRect()
      const height = rect.bottom - rect.top
      const key = cellRows[row++][0].key

      rowHeights[key] = height
    }

    if (!this.currentRowHeights || !compareObjs(this.currentRowHeights, rowHeights)) {
      this.currentRowHeights = rowHeights
      setRef(this.props.rowHeightsRef, rowHeights)
    }
    // TODO: callers might not care if fired rapidly. if so, don't care about equality
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    let { currentRowHeights } = this
    let { cellRows, colWidth } = this.props

    let colCnt = cellRows[0].length
    let col = computeCol(positionLeft, elWidth, colWidth, colCnt)
    let hit = computeRowHit(positionTop, currentRowHeights)

    if (hit != null && col != null && col < colCnt) {
      let cell = this.props.cellRows[hit.row][col]

      return {
        dateProfile: this.props.dateProfile,
        dateSpan: {
          range: this.getCellRange(hit.row, col),
          allDay: true,
          ...cell.extraDateSpan,
        },
        dayEl: this.getCellEl(hit.row, col),
        rect: {
          left: col * colWidth,
          right: (col + 1) * colWidth, // TODO: make work with RTL
          top: hit.top,
          bottom: hit.top + hit.height,
        },
        layer: 0,
      }
    }

    return null
  }

  private getCellEl(row, col): HTMLElement {
    const rowKey = this.props.cellRows[row][0].key
    const rowEl = this.rowElRefMap.current.get(rowKey)
    return rowEl.children[col] as HTMLElement // HACK
  }

  private getCellRange(row, col) {
    let start = this.props.cellRows[row][col].date
    let end = addDays(start, 1)
    return { start, end }
  }
}

function computeCol(positionLeft: number, elWidth: number, colWidth: number | undefined, colCnt: number): number {
  return null as any // !!! -- TODO: work with RTL
}

// TODO
// TODO: iterate via cellRows?
function computeRowHit(
  positionTop: number,
  currentRowHeights: { [key: string]: number },
): { row: number, top: number, height: number } | null {
  return null // !!!
}

function isSegAllDay(seg: TableSeg) {
  return seg.eventRange.def.allDay
}
