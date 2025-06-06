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
  getIsHeightAuto,
  DayGridRange,
  EventRangeProps,
  joinClassNames,
  ViewOptionsRefined,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { splitSegsByRow, splitInteractionByRow } from '../TableSeg.js'
import { DayGridRow } from './DayGridRow.js'
import { computeColFromPosition, computeRowFromPosition, getCellEl, getRowEl } from './util.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface DayGridRowsProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className?: string

  dayMaxEvents?: number | boolean
  dayMaxEventRows?: number | boolean
  // NOTE: the forPrint prop is a bit muddled in meaning

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
  visibleWidth?: number // for row min-height
  cellIsCompact: boolean

  // refs
  rowHeightRefMap?: RefMap<string, number>
}

export class DayGridRows extends DateComponent<DayGridRowsProps> {
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

  render() {
    let { props, context, rowHeightRefMap } = this
    let { options } = context
    let rowCount = props.cellRows.length

    let fgEventSegsByRow = this.splitFgEventSegs(props.fgEventSegs, rowCount)
    let bgEventSegsByRow = this.splitBgEventSegs(props.bgEventSegs, rowCount)
    let businessHourSegsByRow = this.splitBusinessHourSegs(props.businessHourSegs, rowCount)
    let dateSelectionSegsByRow = this.splitDateSelectionSegs(props.dateSelectionSegs, rowCount)
    let eventDragByRow = this.splitEventDrag(props.eventDrag, rowCount)
    let eventResizeByRow = this.splitEventResize(props.eventResize, rowCount)

    let isHeightAuto = getIsHeightAuto(options)
    let rowHeightsRedistribute = !props.forPrint && !isHeightAuto

    let rowBasis = computeRowBasis(
      props.visibleWidth,
      rowCount,
      isHeightAuto,
      options,
    )

    return (
      <div
        role='rowgroup'
        className={joinClassNames(
          props.className,
          // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
          // https://stackoverflow.com/a/60256345
          !props.forPrint && classNames.flexCol,
        )}
        style={{ width: props.width }}
        ref={this.handleRootEl}
      >
        {props.cellRows.map((cells, row) => (
          <DayGridRow
            key={cells[0].key}
            role='row'
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            cells={cells}
            cellIsCompact={props.cellIsCompact}
            showDayNumbers={rowCount > 1}
            showWeekNumbers={rowCount > 1 && options.weekNumbers}
            forPrint={props.forPrint}

            // if not auto-height, distribute height of container somewhat evently to rows
            className={joinClassNames(
              rowHeightsRedistribute && classNames.grow,
              rowCount > 1 && classNames.breakInsideAvoid, // don't avoid breaks for single tall row
              row < rowCount - 1 ? classNames.borderOnlyB : classNames.borderNone,
            )}

            // content
            fgEventSegs={fgEventSegsByRow[row]}
            bgEventSegs={bgEventSegsByRow[row].filter(isSegAllDay) /* HACK */}
            businessHourSegs={businessHourSegsByRow[row]}
            dateSelectionSegs={dateSelectionSegsByRow[row]}
            eventSelection={props.eventSelection}
            eventDrag={eventDragByRow[row]}
            eventResize={eventResizeByRow[row]}
            dayMaxEvents={props.dayMaxEvents}
            dayMaxEventRows={props.dayMaxEventRows}

            // dimensions
            colWidth={props.colWidth}
            basis={rowBasis}

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

  // Hit System
  // -----------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    const { props, context } = this

    const colCount = props.cellRows[0].length
    const { col, left, right } = computeColFromPosition(
      positionLeft,
      elWidth,
      props.colWidth,
      colCount,
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
      getDayEl: () => getCellEl(getRowEl(this.rootEl, row), col),
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

/*
Amount of height a row should consume prior to expanding
We don't want to use min-height with flexbox because we leverage min-height:auto,
which yields value based on natural height of events
*/
export function computeRowBasis(
  visibleWidth: number | undefined, // should INCLUDE any scrollbar width to avoid oscillation
  rowCount: number,
  isHeightAuto: boolean,
  options: ViewOptionsRefined,
): number {
  if (visibleWidth != null) {
    // ensure a consistent row min-height modelled after a month with 6 rows respecting aspectRatio
    // will result in same minHeight regardless of weekends, dayMinWidth, height:auto
    const rowBasis = visibleWidth / options.aspectRatio / 6

    // don't give minHeight when single-month non-auto-height
    // TODO: better way to detect this with DateProfile?
    return (rowCount > 6 || isHeightAuto) ? rowBasis : 0
  }

  return 0
}
