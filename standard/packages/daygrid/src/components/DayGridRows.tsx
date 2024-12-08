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
  getIsHeightAuto,
  DayGridRange,
  EventRangeProps,
  joinClassNames,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { COMPACT_CELL_WIDTH, DayGridRow } from './DayGridRow.js'
import { computeColFromPosition, computeRowFromPosition, getCellEl, getRowEl } from './util.js'

export interface DayGridRowsProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className?: string

  // content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
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
  private disconnectWidth?: () => void

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

    // whether the ROW should expand in height
    // (not to be confused with whether the fg events within the row should be molded by height of row)
    let isHeightAuto = props.forPrint || getIsHeightAuto(options)

    // maintain at least aspectRatio for cells?
    let rowMinHeight = (
      state.width != null && (
        rowCnt >= 7 || // TODO: better way to infer if across single-month boundary
        isHeightAuto
      )
    ) ? state.width / context.options.aspectRatio / 6 // okay to hardcode 6 (weeks) ?
      : null

    return (
      <div
        className={joinClassNames(
          'fc-ps-col',
          props.className,
        )}
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
            showWeekNumbers={options.weekNumbers}
            forPrint={props.forPrint}
            isCompact={state.width != null && (state.width / cells.length) < COMPACT_CELL_WIDTH}

            // if not auto-height, distribute height of container somewhat evently to rows
            // (treat all as zero, distribute height, then ensure min-heights -- the inner content height)
            className={joinClassNames(
              !isHeightAuto && 'fc-grow fc-basis0',
              rowCnt > 1 && 'fc-break-inside-avoid', // don't avoid breaks for single tall row
              row < rowCnt - 1 && 'fc-border-b',
            )}

            // content
            fgEventSegs={fgEventSegsByRow[row]}
            bgEventSegs={bgEventSegsByRow[row].filter(isSegAllDay) /* HACK */}
            businessHourSegs={businessHourSegsByRow[row]}
            dateSelectionSegs={dateSelectionSegsByRow[row]}
            eventSelection={props.eventSelection}
            eventDrag={eventDragByRow[row]}
            eventResize={eventResizeByRow[row]}
            dayMaxEvents={props.forPrint ? undefined : options.dayMaxEvents}
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
    this.disconnectWidth = watchWidth(this.rootEl, (width) => {
      this.setState({ width })
    })
  }

  componentWillUnmount(): void {
    this.disconnectWidth()
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
        ...cell.dateSpanProps,
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

function isSegAllDay(seg: EventRangeProps): boolean {
  return seg.eventRange.def.allDay
}
