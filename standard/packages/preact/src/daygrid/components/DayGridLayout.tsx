import { afterSize } from '../../layout/resize-observer'
import { DateRange } from '@full-ui/headless-calendar'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { DayTableCell, DayGridRange } from '../../day-table/day-grid-range'
import { EventSegUiInteractionState } from '../../interactions/event-interaction-state'
import { Hit } from '../../interactions/hit'
import { RefMap } from '../../util/RefMap'
import { ScrollerInterface } from '../../scrollgrid/scroller-types'
import { Ruler } from '../../scrollgrid/Ruler'
import { ViewContainer } from '../../views/ViewContainer'
import { EventRangeProps } from '../../event-segs/event-rendering'
import { joinClassNames } from '../../util/html'
import { generateClassName } from '../../render-hook/render-hook-types'
import { useViewContext } from '../../context/useViewContext'
import { useViewOptions } from '../../context/useGranularContexts'
import { useInitialScroll } from '../../scrollgrid/useInitialScroll'
import { useMeasuredState } from '../../layout/useMeasuredState'
import { memo, useRef } from 'react'
import { DayGridLayoutNormal } from './DayGridLayoutNormal'
import { DayGridLayoutPannable } from './DayGridLayoutPannable'
import { DayGridLayoutPrint } from './DayGridLayoutPrint'
import { computeDayGridColumns, computeTopFromDate } from './util'
import { RowConfig } from '../header-tier'
import classNames from '../../styles.module.css'
import { computeViewBorderless } from '../../util/misc'

export interface DayGridLayoutProps {
  labelId: string | undefined
  labelStr: string | undefined

  dateProfile: DateProfile
  todayRange: DateRange
  cellRows: DayTableCell[][]
  forPrint: boolean
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  className: string

  // header content
  headerTiers: RowConfig<any, { text: string, isDisabled: boolean }>[]

  // body content
  fgEventSegs: (DayGridRange & EventRangeProps)[]
  bgEventSegs: (DayGridRange & EventRangeProps)[]
  businessHourSegs: (DayGridRange & EventRangeProps)[]
  dateSelectionSegs: (DayGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<DayGridRange> | null
  eventResize: EventSegUiInteractionState<DayGridRange> | null
  eventSelection: string
}

/*
The shell of the DayGrid layouts. Chooses between print, pannable (dayMinWidth) and normal, and owns
what they share: the width measurements, which print reuses from the screen, and the initial scroll.
*/
export const DayGridLayout = memo(function DayGridLayout(props: DayGridLayoutProps) {
  const context = useViewContext()
  const { options } = context
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  return (
    <ViewContainer
      viewSpec={context.viewSpec}
      attrs={{
        role: 'table',
        'aria-rowcount': props.headerTiers.length + props.cellRows.length,
        'aria-colcount': props.cellRows[0].length,
        'aria-labelledby': props.labelId,
        'aria-label': props.labelStr,
      }}
      className={joinClassNames(
        props.className,
        !props.forPrint && classNames.flexCol,
        !props.forPrint && generateClassName(options.tableClass, {
          borderlessX,
          borderlessTop,
          borderlessBottom,
          multiMonthColumns: 0,
        }),
      )}
    >
      <DayGridLayoutBody {...props} />
    </ViewContainer>
  )
})

/*
Inside the ViewContainer, so measurements re-render only this, as when the layouts held them
*/
function DayGridLayoutBody(props: DayGridLayoutProps) {
  const options = useViewOptions()
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  // measured on screen. kept while printing, which doesn't measure. print uses totalWidth for row
  // min-heights (see the roadmap's phase 7 catch)
  const [totalWidth, handleTotalWidth] = useMeasuredState()
  const [clientWidth, handleClientWidth] = useMeasuredState()

  const scrollerRef = useRef<ScrollerInterface | null>(null) // the body scroller
  const xScrollerRef = useRef<ScrollerInterface | null>(null) // pannable's syncer
  const rowHeightRefMapRef = useRef<RefMap<string, number>>(null)
  const scroll = useInitialScroll({
    scrollerRef,
    resetXScrollerRef: xScrollerRef,
    isEnabled: !props.forPrint,
    createInitial: () => props.dateProfile.currentDate,
    resetKey: props.dateProfile,
    isResetOnChange: options.scrollTimeReset,
    project(scrollDate) {
      let scrollTop = computeTopFromDate(scrollDate, props.cellRows, rowHeightRefMapRef.current.current)

      if (scrollTop != null) {
        if (scrollTop) {
          scrollTop++ // clear top border
        }
        return { y: scrollTop }
      }
    },
    isUserScroll: (isDevice) => isDevice,
  })
  rowHeightRefMapRef.current ??= new RefMap<string, number>(() => {
    afterSize(scroll.handleGeometry)
  })
  const rowHeightRefMap = rowHeightRefMapRef.current

  const colCount = props.cellRows[0].length
  const columns = computeDayGridColumns(
    colCount,
    // print has no scroller, so no client width. its cells were never narrow, so keep that
    props.forPrint ? undefined : clientWidth,
    options.dayMinWidth,
    options,
  )

  if (props.forPrint) {
    return (
      <DayGridLayoutPrint
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        cellRows={props.cellRows}
        headerTiers={props.headerTiers}
        showHeader={Boolean(options.dayHeaders)}
        fgEventSegs={props.fgEventSegs}
        bgEventSegs={props.bgEventSegs}
        businessHourSegs={props.businessHourSegs}
        eventSelection={props.eventSelection}
        dayMaxEventRows={options.dayMaxEventRows}
        borderlessX={borderlessX}
        borderlessTop={borderlessTop}
        borderlessBottom={borderlessBottom}
        multiMonthColumns={0}
        visibleWidth={totalWidth}
        cellIsNarrow={columns.cellIsNarrow}
        cellIsMicro={columns.cellIsMicro}
        rowHeightRefMap={rowHeightRefMap}
      />
    )
  }

  const screenLayoutProps = {
    dateProfile: props.dateProfile,
    todayRange: props.todayRange,
    cellRows: props.cellRows,
    isHitComboAllowed: props.isHitComboAllowed,
    headerTiers: props.headerTiers,
    fgEventSegs: props.fgEventSegs,
    bgEventSegs: props.bgEventSegs,
    businessHourSegs: props.businessHourSegs,
    dateSelectionSegs: props.dateSelectionSegs,
    eventDrag: props.eventDrag,
    eventResize: props.eventResize,
    eventSelection: props.eventSelection,
    totalWidth,
    clientWidth,
    canvasWidth: columns.canvasWidth,
    appliedColWidth: columns.appliedColWidth,
    cellIsNarrow: columns.cellIsNarrow,
    cellIsMicro: columns.cellIsMicro,
    clientWidthRef: handleClientWidth,
    scrollerRef,
    rowHeightRefMap,
  }

  return (
    <>
      {options.dayMinWidth
        ? <DayGridLayoutPannable {...screenLayoutProps} xScrollerRef={xScrollerRef} />
        : <DayGridLayoutNormal {...screenLayoutProps} />}
      <Ruler widthRef={handleTotalWidth} />
    </>
  )
}
