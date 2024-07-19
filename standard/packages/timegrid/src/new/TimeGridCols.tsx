import { Duration } from '@fullcalendar/core'
import {
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  DayTableCell,
  EventSegUiInteractionState,
  Hit,
  RefMapKeyed,
  addDurations,
  memoize,
  multiplyDuration,
  wholeDivideDurations,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { TimeColsSeg } from '../TimeColsSeg.js'
import { TimeGridCol } from './TimeGridCol.js'

export interface TimeGridColsProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  cells: DayTableCell[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean

  // content
  fgEventSegsByCol: TimeColsSeg[][]
  bgEventSegsByCol: TimeColsSeg[][]
  businessHourSegsByCol: TimeColsSeg[][]
  nowIndicatorSegsByCol: TimeColsSeg[][]
  dateSelectionSegsByCol: TimeColsSeg[][]
  eventDragByCol: EventSegUiInteractionState[]
  eventResizeByCol: EventSegUiInteractionState[]
  eventSelection: string

  // dimensions
  colWidth: number | undefined
  colActualWidth: number | undefined // for hit processing
  slatHeight: number | undefined
}

export class TimeGridCols extends DateComponent<TimeGridColsProps> {
  // memo
  private processSlotOptions = memoize(processSlotOptions)

  // refs
  private colElRefMap = new RefMapKeyed<string, HTMLElement>()

  render() {
    const { props } = this

    return (
      <div ref={this.handleRootEl}>
        {props.cells.map((cell, col) => (
          <TimeGridCol
            key={cell.key}
            dateProfile={props.dateProfile}
            nowDate={props.nowDate}
            todayRange={props.todayRange}
            date={cell.date}
            extraRenderProps={cell.extraRenderProps}
            extraDataAttrs={cell.extraDataAttrs}
            extraDateSpan={cell.extraDateSpan}
            forPrint={props.forPrint}

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

            // refs
            elRef={this.colElRefMap.createRef(cell.key)}
          />
        ))}
      </div>
    )
  }

  handleRootEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, {
        el,
        isHitComboAllowed: this.props.isHitComboAllowed,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { dateEnv, options } = this.context
    let { dateProfile, colActualWidth } = this.props
    let { slatCoords } = this.state

    let { snapDuration, snapsPerSlot } = this.processSlotOptions(options.slotDuration, options.snapDuration)

    let colCnt = this.props.cells.length
    let colIndex = Math.floor(positionLeft / colActualWidth) // TODO: make work with RTL
    let slatIndex = slatCoords.positions.topToIndex(positionTop)

    if (colIndex != null && slatIndex != null && colIndex < colCnt) {
      let cell = this.props.cells[colIndex]
      let slatTop = slatCoords.positions.tops[slatIndex]
      let slatHeight = slatCoords.positions.getHeight(slatIndex)
      let partial = (positionTop - slatTop) / slatHeight // floating point number between 0 and 1
      let localSnapIndex = Math.floor(partial * snapsPerSlot) // the snap # relative to start of slat
      let snapIndex = slatIndex * snapsPerSlot + localSnapIndex

      let dayDate = this.props.cells[colIndex].date
      let time = addDurations(
        dateProfile.slotMinTime,
        multiplyDuration(snapDuration, snapIndex),
      )

      let start = dateEnv.add(dayDate, time)
      let end = dateEnv.add(start, snapDuration)

      return {
        dateProfile,
        dateSpan: {
          range: { start, end },
          allDay: false,
          ...cell.extraDateSpan,
        },
        dayEl: this.colElRefMap.current.get(this.props.cells[colIndex].key),
        rect: {
          left: colIndex * colActualWidth,
          right: (colIndex + 1) * colActualWidth, // TODO: make work with RTL
          top: slatTop,
          bottom: slatTop + slatHeight,
        },
        layer: 0,
      }
    }

    return null
  }
}

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
