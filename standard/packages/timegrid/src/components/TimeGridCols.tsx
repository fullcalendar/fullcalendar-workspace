import { Duration } from '@fullcalendar/core'
import {
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  EventRangeProps,
  EventSegUiInteractionState,
  Hit,
  addDurations,
  isPropsEqualShallow,
  joinClassNames,
  memoize,
  multiplyDuration,
  wholeDivideDurations,
} from '@fullcalendar/core/internal'
import { computeColFromPosition, getCellEl } from '@fullcalendar/daygrid/internal'
import { createElement } from '@fullcalendar/core/preact'
import { TimeGridRange } from '../TimeColsSeg.js'
import { TimeGridCol } from './TimeGridCol.js'

export interface TimeGridColsProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  slatCnt: number
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  role?: string
  className?: string

  // content
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  nowIndicatorSegsByCol: TimeGridRange[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: EventSegUiInteractionState<TimeGridRange>[]
  eventResizeByCol: EventSegUiInteractionState<TimeGridRange>[]
  eventSelection: string

  // dimensions
  colWidth?: number
  slatHeight: number | undefined
}

export class TimeGridCols extends DateComponent<TimeGridColsProps> { // TODO: rename to TimeGridRow
  // memo
  private processSlotOptions = memoize(processSlotOptions)

  // refs
  private rootEl: HTMLElement

  render() {
    const { props } = this

    return (
      <div
        role={props.role as any /* !!! */}
        className={joinClassNames(props.className, 'fc-flex-row')}
        ref={this.handleRootEl}
      >
        {props.cells.map((cell, col) => (
          <TimeGridCol
            key={cell.key}
            dateProfile={props.dateProfile}
            nowDate={props.nowDate}
            todayRange={props.todayRange}
            date={cell.date}
            isMajor={cell.isMajor}
            slatCnt={props.slatCnt}
            renderProps={cell.renderProps}
            attrs={cell.attrs}
            dateSpanProps={cell.dateSpanProps}
            forPrint={props.forPrint}
            borderStart={Boolean(col)}

            // content
            fgEventSegs={props.fgEventSegsByCol[col]}
            bgEventSegs={props.bgEventSegsByCol[col]}
            businessHourSegs={props.businessHourSegsByCol[col]}
            nowIndicatorSegs={props.nowIndicatorSegsByCol[col]}
            dateSelectionSegs={props.dateSelectionSegsByCol[col]}
            eventDrag={props.eventDragByCol[col]}
            eventResize={props.eventResizeByCol[col]}
            eventSelection={props.eventSelection}

            // dimensions
            width={props.colWidth}
            slatHeight={props.slatHeight}
          />
        ))}
      </div>
    )
  }

  handleRootEl = (el: HTMLElement | null) => {
    this.rootEl = el

    if (el) {
      this.context.registerInteractiveComponent(this, {
        el,
        isHitComboAllowed: this.props.isHitComboAllowed,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    const { dateProfile, cells, colWidth, slatHeight } = this.props
    const { dateEnv, options, isRtl } = this.context
    const { snapDuration, snapsPerSlot } = this.processSlotOptions(options.slotDuration, options.snapDuration)

    const colCnt = cells.length
    const { col, left, right } = computeColFromPosition(positionLeft, elWidth, colWidth, colCnt, isRtl)
    const cell = cells[col]

    const slatIndex = Math.floor(positionTop / slatHeight)
    const slatTop = slatIndex * slatHeight
    const partial = (positionTop - slatTop) / slatHeight // floating point number between 0 and 1
    const localSnapIndex = Math.floor(partial * snapsPerSlot) // the snap # relative to start of slat
    const snapIndex = slatIndex + localSnapIndex * snapsPerSlot

    const time = addDurations(
      dateProfile.slotMinTime,
      multiplyDuration(snapDuration, snapIndex),
    )
    const start = dateEnv.add(cell.date, time)
    const end = dateEnv.add(start, snapDuration)

    return {
      dateProfile,
      dateSpan: {
        range: { start, end },
        allDay: false,
        ...cell.dateSpanProps,
      },
      getDayEl: () => getCellEl(this.rootEl, col),
      rect: {
        left,
        right,
        top: slatTop,
        bottom: slatTop + slatHeight,
      },
      layer: 0,
    }
  }
}

TimeGridCols.addPropsEquality({
  style: isPropsEqualShallow,
})

// Utils
// -------------------------------------------------------------------------------------------------

function processSlotOptions(slotDuration: Duration, snapDurationOverride: Duration | null) {
  let snapDuration = snapDurationOverride || slotDuration
  let snapsPerSlot = wholeDivideDurations(slotDuration, snapDuration)

  if (snapsPerSlot === null) {
    snapDuration = slotDuration
    snapsPerSlot = 1
    // TODO: say warning?
  }

  return { snapDuration, snapsPerSlot }
}
