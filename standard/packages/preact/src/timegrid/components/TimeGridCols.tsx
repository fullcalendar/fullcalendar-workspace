import { Duration, DateMarker, DateRange, addDurations, multiplyDuration, wholeDivideDurations } from '@full-ui/headless-calendar'
import { joinClassNames } from '../../util/html'
import { SlicedEventInteraction } from '../../interactions/event-interaction-state'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DayTableCell } from '../../day-table/day-grid-range'
import { EventRangeProps } from '../../event-segs/event-ranges'
import { Hit } from '../../interactions/hit'
import { memo, useMemo, useRef } from 'react'
import { useDateEnv, useViewOptions } from '../../context/useGranularContexts'
import { useHitTarget } from '../../interactions/useHitTarget'
import { computeColFromPosition, getCellEl } from '../../day-table/grid-positions'
import classNames from '../../styles.module.css'
import { TimeGridRange } from '../../day-table/time-grid-range'
import { TimeGridCol } from './TimeGridCol'

export interface TimeGridColsProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  nowMs?: number
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
  eventDragByCol: SlicedEventInteraction<TimeGridRange>[]
  eventResizeByCol: SlicedEventInteraction<TimeGridRange>[]
  eventSelection: string

  // dimensions
  colWidth?: number
  slatHeight: number | undefined
  cellIsNarrow: boolean
  cellIsMicro: boolean
}

export const TimeGridCols = memo(function TimeGridCols(props: TimeGridColsProps) { // TODO: rename to TimeGridRow
  const dateEnv = useDateEnv()
  const options = useViewOptions()
  const rootElRef = useRef<HTMLElement | null>(null)
  const { snapDuration, snapsPerSlot } = useMemo(
    () => processSlotOptions(options.slotDuration, options.snapDuration),
    [options.slotDuration, options.snapDuration],
  )

  useHitTarget(rootElRef, {
    isHitComboAllowed: props.isHitComboAllowed,
    eventSelection: props.eventSelection,
    queryHit(isRtl, positionLeft, positionTop, elWidth): Hit | null {
      const { dateProfile, cells, colWidth, slatHeight } = props

      const colCount = cells.length
      const { col, left, right } = computeColFromPosition(positionLeft, elWidth, colWidth, colCount, isRtl)
      const cell = cells[col]

      if (cell.isInert) {
        return null
      }

      const slatIndex = Math.floor(positionTop / slatHeight)
      const slatTop = slatIndex * slatHeight
      const partial = (positionTop - slatTop) / slatHeight // floating point number between 0 and 1
      const localSnapIndex = Math.floor(partial * snapsPerSlot) // the snap # relative to start of slat
      const snapIndex = slatIndex * snapsPerSlot + localSnapIndex

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
        getDayEl: () => getCellEl(rootElRef.current, col),
        rect: {
          left,
          right,
          top: slatTop,
          bottom: slatTop + slatHeight,
        },
        layer: 0,
      }
    },
  })

  return (
    <div
      role={props.role as any /* !!! */}
      className={joinClassNames(props.className, classNames.flexRow)}
      ref={rootElRef as any}
    >
      {props.cells.map((cell, col) => (
        <TimeGridCol
          key={cell.key}
          dateProfile={props.dateProfile}
          nowDate={props.nowDate}
          nowMs={props.nowMs}
          todayRange={props.todayRange}
          date={cell.date}
          isMajor={cell.isMajor}
          slatCnt={props.slatCnt}
          renderProps={cell.renderProps}
          attrs={cell.attrs}
          dateSpanProps={cell.dateSpanProps}
          forPrint={props.forPrint}
          borderStart={Boolean(col)}
          isNarrow={props.cellIsNarrow}
          isMicro={props.cellIsMicro}

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
