import { Duration, DateMarker, DateRange } from '@full-ui/headless-calendar'
import { ViewOptions } from '../../options/options'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DayTableCell } from '../../day-table/day-grid-range'
import { EventRangeProps } from '../../event-segs/event-ranges'
import { SlicedEventInteraction } from '../../interactions/event-interaction-state'
import { Hit } from '../../interactions/hit'
import { ScrollerInterface } from '../../scrollgrid/scroller-types'
import { SlicedCoordRange } from '../../event-segs/coord-range'
import { ViewContainer } from '../../views/ViewContainer'
import { afterSize } from '../../layout/resize-observer'
import { joinClassNames } from '../../util/html'
import { generateClassName } from '../../render-hook/render-hook-types'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useViewContext } from '../../context/useViewContext'
import { useInitialScroll } from '../../scrollgrid/useInitialScroll'
import classNames from '../../styles.module.css'
import { buildSlatMetas } from '../time-slat-meta'
import { TimeGridRange } from '../../day-table/time-grid-range'
import { TimeGridLayoutPannable } from './TimeGridLayoutPannable'
import { TimeGridLayoutNormal } from './TimeGridLayoutNormal'
import { computeTimeTopFrac } from './time-geometry'
import { RowConfig } from '../../day-table/header-tier'
import { computeViewBorderless } from '../../views/view-borderless'

export interface TimeGridLayoutProps {
  labelId: string | undefined
  labelStr: string | undefined

  dateProfile: DateProfile
  nowDate: DateMarker
  nowMs?: number
  todayRange: DateRange
  cells: DayTableCell[]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

  // header content
  headerTiers: RowConfig<any, { text: string, isDisabled: boolean }>[]

  // all-day content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[],
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[],
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[],
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[],
  eventDrag: SlicedEventInteraction<SlicedCoordRange> | null,
  eventResize: SlicedEventInteraction<SlicedCoordRange> | null,

  // timed content
  fgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  bgEventSegsByCol: (TimeGridRange & EventRangeProps)[][]
  businessHourSegsByCol: (TimeGridRange & EventRangeProps)[][]
  nowIndicatorSegsByCol: TimeGridRange[][]
  dateSelectionSegsByCol: (TimeGridRange & EventRangeProps)[][]
  eventDragByCol: SlicedEventInteraction<TimeGridRange>[]
  eventResizeByCol: SlicedEventInteraction<TimeGridRange>[]

  // universal content
  eventSelection: string
}

function buildEmptySegCols<T>(segsByCol: T[][]): T[][] {
  return segsByCol.map(() => [])
}

function buildEmptyInteractionCols<T>(
  interactionsByCol: SlicedEventInteraction<T>[],
): SlicedEventInteraction<T>[] {
  return interactionsByCol.map(() => null as any)
}

/*
The shell of the TimeGrid layouts. Chooses between pannable (dayMinWidth) and normal, and owns the
scroll to a time: the initial scrollTime, scroll requests, and where the user scrolled to
*/
export const TimeGridLayout = memo(function TimeGridLayout(props: TimeGridLayoutProps) {
  const context = useViewContext()
  const { dateProfile } = props
  const { options, dateEnv, emitter } = context
  const { dayMinWidth } = options
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  const slatMetas = useMemo(
    () => buildSlatMetas(
      dateProfile.slotMinTime,
      dateProfile.slotMaxTime,
      options.slotHeaderInterval,
      options.slotDuration,
      dateEnv,
    ),
    [dateProfile.slotMinTime, dateProfile.slotMaxTime, options.slotHeaderInterval, options.slotDuration, dateEnv],
  )

  const dayScrollerRef = useRef<ScrollerInterface | null>(null)
  const timeScrollerRef = useRef<ScrollerInterface | null>(null)
  const slatHeightRef = useRef<number | null>(null)
  const scroll = useInitialScroll<Duration>({
    scrollerRef: timeScrollerRef,
    resetXScrollerRef: dayScrollerRef, // pannable only
    isEnabled: !props.forPrint,
    createInitial: () => options.scrollTime,
    resetKey: dateProfile,
    isResetOnChange: options.scrollTimeReset,
    project(time) {
      const slatHeight = slatHeightRef.current

      if (slatHeight != null) {
        let y = computeTimeTopFrac(time, dateProfile) * (slatHeight * slatMetas.length)

        if (y) {
          y++ // overcome top border
        }
        return { y }
      }
    },
    isUserScroll: (isDevice) => isDevice,
    // only y. Pannable's time scroller syncs the axis too, which doesn't scroll in x
    readPosition: (scroller) => ({ y: scroller.y }),
  })
  const [handleSlatHeight] = useState(() => (slatHeight: number | null) => {
    slatHeightRef.current = slatHeight

    if (slatHeight != null) {
      afterSize(scroll.handleGeometry)
    }
  })

  useLayoutEffect(() => {
    emitter.on('_timeScrollRequest', scroll.scrollToLogical)

    return () => {
      emitter.off('_timeScrollRequest', scroll.scrollToLogical)
    }
  }, [emitter])

  const dateSelectionSegs = props.forPrint ? [] : props.dateSelectionSegs
  const eventDrag = props.forPrint ? null : props.eventDrag
  const eventResize = props.forPrint ? null : props.eventResize
  const dateSelectionSegsByCol = props.forPrint ? buildEmptySegCols(props.dateSelectionSegsByCol) : props.dateSelectionSegsByCol
  const eventDragByCol = props.forPrint ? buildEmptyInteractionCols(props.eventDragByCol) : props.eventDragByCol
  const eventResizeByCol = props.forPrint ? buildEmptyInteractionCols(props.eventResizeByCol) : props.eventResizeByCol

  const commonLayoutProps = {
    dateProfile: dateProfile,
    nowDate: props.nowDate,
    nowMs: props.nowMs,
    todayRange: props.todayRange,
    cells: props.cells,
    slatMetas,
    forPrint: props.forPrint,
    isHitComboAllowed: props.isHitComboAllowed,

    // header content
    headerTiers: props.headerTiers,

    // all-day content
    fgEventSegs: props.fgEventSegs,
    bgEventSegs: props.bgEventSegs,
    businessHourSegs: props.businessHourSegs,
    dateSelectionSegs,
    eventDrag,
    eventResize,
    ...getAllDayMaxEventProps(options),

    // timed content
    fgEventSegsByCol: props.fgEventSegsByCol,
    bgEventSegsByCol: props.bgEventSegsByCol,
    businessHourSegsByCol: props.businessHourSegsByCol,
    nowIndicatorSegsByCol: props.nowIndicatorSegsByCol,
    dateSelectionSegsByCol,
    eventDragByCol,
    eventResizeByCol,

    // universal content
    eventSelection: props.eventSelection,

    // refs
    timeScrollerRef,
    slatHeightRef: handleSlatHeight,
  }

  return (
    <ViewContainer
      attrs={{
        role: 'table',
        'aria-colcount': props.cells.length,
        'aria-labelledby': props.labelId,
        'aria-label': props.labelStr,
      }}
      className={joinClassNames(
        props.className,
        generateClassName(options.tableClass, {
          borderlessX,
          borderlessTop,
          borderlessBottom,
          multiMonthColumns: 0,
        }),
        // We don't use the repeating-header print treatment here because it works poorly:
        // - Firefox >85ish CAN have flexboxes within it, but those cannot do absolute positioning
        // - Chrome works okay, but abs-positioned events cover the repeated header
        //   Also, there's weird padding on the last page at bottom of container, which matches
        //   the height of the repeated header
        // - Safari was never able to do repeated headers in the first place
        !props.forPrint && classNames.flexCol,
        classNames.isolate, // for inner z-index of layout. somehow move to layouts?
      )}
      viewSpec={context.viewSpec}
    >
      {dayMinWidth ? (
        <TimeGridLayoutPannable
          {...commonLayoutProps}
          dayMinWidth={dayMinWidth}
          dayScrollerRef={dayScrollerRef}
        />
      ) : (
        <TimeGridLayoutNormal {...commonLayoutProps} />
      )}
    </ViewContainer>
  )
})

// Utils
// -----------------------------------------------------------------------------------------------

const AUTO_ALL_DAY_MAX_EVENT_ROWS = 5

function getAllDayMaxEventProps(options: ViewOptions) {
  let { dayMaxEvents, dayMaxEventRows } = options

  if (dayMaxEvents === true || dayMaxEventRows === true) { // is auto?
    dayMaxEvents = undefined
    dayMaxEventRows = AUTO_ALL_DAY_MAX_EVENT_ROWS // make sure "auto" goes to a real number
  }

  return { dayMaxEvents, dayMaxEventRows }
}
