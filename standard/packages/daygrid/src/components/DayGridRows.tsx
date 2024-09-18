import {
  EventSegUiInteractionState,
  DateComponent,
  memoize,
  addDays,
  DateRange,
  DateProfile,
  Hit,
  DayTableCell,
  RefMap,
  watchWidth,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { TableSeg, splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { DayGridRow } from './DayGridRow.js'
import { computeColFromPosition, computeRowFromPosition, getCellEl, getRowEl } from './util.js'

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
  width?: number | string // a CSS value

  // refs
  rowHeightRefMap?: RefMap<string, number>
}

interface DayGridRowsState {
  width?: number
}

export class DayGridRows extends DateComponent<DayGridRowsProps, DayGridRowsState> {
  // ref
  private rootEl: HTMLDivElement

  // memo
  private splitBusinessHourSegs = memoize(splitSegsByRow)
  private splitBgEventSegs = memoize(splitSegsByRow)
  private splitFgEventSegs = memoize(splitSegsByRow)
  private splitDateSelectionSegs = memoize(splitSegsByRow)
  private splitEventDrag = memoize(splitInteractionByRow)
  private splitEventResize = memoize(splitInteractionByRow)

  // internal
  private rowHeightRefMap = new RefMap<string, number>((height, key) => {
    // HACKy way of syncing RefMap results with prop
    const { rowHeightRefMap } = this.props
    if (rowHeightRefMap) {
      rowHeightRefMap.handleValue(height, key)
    }
  })
  private unwatchWidth?: () => void

  render() {
    let { props, state, context, rowHeightRefMap } = this
    let { options } = context
    let rowCnt = props.cellRows.length

    let fgEventSegsByRow = this.splitFgEventSegs(props.fgEventSegs, rowCnt)
    let bgEventSegsByRow = this.splitBgEventSegs(props.bgEventSegs, rowCnt)
    let businessHourSegsByRow = this.splitBusinessHourSegs(props.businessHourSegs, rowCnt)
    let dateSelectionSegsByRow = this.splitDateSelectionSegs(props.dateSelectionSegs, rowCnt)
    let eventDragByRow = this.splitEventDrag(props.eventDrag, rowCnt)
    let eventResizeByRow = this.splitEventResize(props.eventResize, rowCnt)

    // for DayGrid view with many rows, force a min-height on cells so doesn't appear squished
    // choose 7 because a month view will have max 6 rows
    let rowMinHeight = (rowCnt >= 7 && state.width != null) ?
      state.width / context.options.aspectRatio / 6 :
      null

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
            minHeight={rowMinHeight}

            // refs
            heightRef={rowHeightRefMap.createRef(cells[0].key)}
          />
        ))}
      </div>
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

  componentDidMount(): void {
    this.unwatchWidth = watchWidth(this.rootEl, (width) => {
      this.setState({ width })
    })
  }

  componentWillUnmount(): void {
    this.unwatchWidth()
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    const { props, context } = this

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
      this.rowHeightRefMap.current,
    )
    const cell = props.cellRows[row][col]
    const cellStartDate = cell.date
    const cellEndDate = addDays(cellStartDate, 1)

    return {
      dateProfile: props.dateProfile,
      dateSpan: {
        range: {
          start: cellStartDate,
          end: cellEndDate,
        },
        allDay: true,
        ...cell.extraDateSpan,
      },
      // HACK. TODO: This is expensive to do every hit-query
      dayEl: getCellEl(getRowEl(this.rootEl, row), col),
      rect: {
        left,
        right,
        top,
        bottom,
      },
      layer: 0,
    }
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function isSegAllDay(seg: TableSeg) {
  return seg.eventRange.def.allDay
}
