import { InlineWeekNumberInfo } from '../../common/WeekNumberContainer'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { DateRange, DateMarker, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import {
  buildEventRangeKey,
  getEventRangeMeta,
  sortEventSegs,
  EventRangeProps,
} from '../../component-util/event-rendering'
import { SlicedCoordRange } from '../../coord-range'
import { DateProfile } from '../../DateProfileGenerator'
import { BgEvent, renderFill } from '../../common/bg-fill'
import { DayTableCell } from '../DayTableModel'
import { RefMap } from '../../util/RefMap'
import { createFormatter } from '../../datelib/formatting'
import { afterSize } from '../../component-util/resize-observer'
import { buildDateStr, buildNavLinkAttrs } from '../../common/nav-link'
import { joinClassNames } from '../../util/html'
import { CustomContent } from '../../content-inject/CustomContent'
import { useViewContext } from '../../hooks/useViewContext'
import { useViewOptions } from '../../hooks/useGranularContexts'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { renderText } from '../../common/render-hook'
import { ForegroundEvent, listItemEventVariant, rowEventVariant } from '../../common/events'
import { ViewContext } from '../../ViewContext'
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type Ref } from 'react'
import { useLatest } from '../../hooks/useLatest'
import { useForwardedElRef } from '../../hooks/useForwardedElRef'
import { useReportedSize } from '../../hooks/useReportedSize'
import { DayRowEventRangePart, getDayGridSegKey } from '../TableSeg'
import { DayGridCell } from './DayGridCell'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-rendering'
import { COL_BORDER_WIDTH } from '../../util/dimensions'
import { MeasuredHeightHarness } from '../../common/MeasuredHeightHarness'
import {
  type Slice,
  getSliceKey,
} from '../../seg-placement/kernel'
import {
  type DayGridPlacementColumn,
  type DayGridSourceSeg,
  DEFAULT_LEVEL_CAPACITY,
  buildDayGridPopoverSegs,
  buildDayGridLevelPlacements,
  buildDayGridPixelPlacements,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMoreLinkLevelTax,
  estimateLevelCapacity,
  resolveDayGridPlacementMode,
} from '../seg-placement-adapter'
import {
  type DayGridPrintBandSlot,
  type DayGridPrintPlan,
  buildDayGridPrintColumns,
  buildDayGridPrintPlan,
  getDayGridPrintSliceKey,
} from '../print-adapter'
import classNames from '../../styles.module.css'
import {
  DAY_GRID_BG_EVENT_Z_CLASS,
  DAY_GRID_EVENT_Z_CLASS,
  DAY_GRID_HIGHLIGHT_Z_CLASS,
  DAY_GRID_INTERACTION_Z_CLASS,
  DAY_GRID_NON_BUSINESS_Z_CLASS,
} from './z-index'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  cellIsNarrow: boolean
  cellIsMicro: boolean
  showDayNumbers: boolean
  showWeekNumbers?: boolean
  forPrint: boolean
  tableMode?: boolean // real tr/td markup, independent of print placement behavior
  borderBottom?: boolean
  className?: string
  role?: string

  // content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[]
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
  eventSelection: string
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number

  // dimensions
  colWidth?: number
  basis?: number // height before growing
  moreLinkHeight?: number

  // refs
  rootElRef?: Ref<HTMLElement> // needed by TimeGrid, to attach Hit system
  heightRef?: Ref<number>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

/*
One row of day cells. Places its foreground events from the cells' and the events' measured heights,
re-rendering after size changes. See seg-placement-adapter and print-adapter
*/
export const DayGridRow = memo(function DayGridRow(props: DayGridRowProps) {
  const context = useViewContext()
  const { cells, tableMode } = props
  const { options } = context

  const [, setRenderCount] = useState(0) // to re-render after measuring
  const propsRef = useLatest(props)
  const isActiveRef = useRef(false)
  // grows only. see updateAutoPlacementRatchets
  const levelCapacityRef = useRef(DEFAULT_LEVEL_CAPACITY)

  const [measures] = useState(() => {
    const handleSegPositioning = () => {
      const props = propsRef.current

      if (isActiveRef.current && !props.forPrint) {
        updateAutoPlacementRatchets(props, measures, levelCapacityRef)
        setRenderCount(incrementCounter)
      }
    }

    // print-only. band thickness is row-wide while slots render per-cell, so this lives here
    const handlePrintSegHeights = () => {
      if (isActiveRef.current && propsRef.current.forPrint) {
        setRenderCount(incrementCounter)
      }
    }

    const measures: RowMeasures = {
      headerHeightRefMap: new RefMap<string, number>(() => {
        afterSize(handleSegPositioning)
      }),
      mainHeightRefMap: new RefMap<string, number>(() => {
        // Recorded in every screen mode so a row that becomes liquid already knows its
        // ceiling, but only a liquid row's placement depends on it.
        const { dayMaxEvents, dayMaxEventRows } = propsRef.current
        const fgLiquidHeight = dayMaxEvents === true || dayMaxEventRows === true
        if (fgLiquidHeight) {
          afterSize(handleSegPositioning)
        }
      }),
      // Every screen slice (whole or partial) reports its occupied height here.
      sliceHeightRefMap: new RefMap<string, number>(() => {
        afterSize(handleSegPositioning)
      }),
      createPrintSegHeightRefMap: () => new RefMap<string, number>(() => {
        afterSize(handlePrintSegHeights)
      }),
      printSegHeightRefMap: undefined,
    }
    measures.printSegHeightRefMap = measures.createPrintSegHeightRefMap()

    return measures
  })
  const { headerHeightRefMap, mainHeightRefMap } = measures

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  // print heights start over on each print
  useLayoutEffect(() => {
    if (!props.forPrint) {
      measures.printSegHeightRefMap = measures.createPrintSegHeightRefMap()
    }
  }, [props.forPrint])

  // the root's height goes to heightRef, and the root to rootElRef (TimeGrid attaches its hit target)
  const [, handleForwardedRootEl] = useForwardedElRef(props.rootElRef)
  const handleSizedRootEl = useReportedSize({ watchHeight: true, heightRef: props.heightRef })
  const [handleRootEl] = useState(() => (rootEl: HTMLElement | null) => {
    handleForwardedRootEl(rootEl)
    handleSizedRootEl(rootEl)
  })

  const weekDateMarker = props.cells[0].date
  const fgEventSegs = useMemo(
    () => sortEventSegs(props.fgEventSegs, options.eventOrder),
    [props.fgEventSegs, options.eventOrder],
  )
  const printPlan: DayGridPrintPlan | null = useMemo(
    () => props.forPrint
      ? buildDayGridPrintPlan(fgEventSegs, options.eventOrderStrict, options.eventSlicing, cells.length)
      : null,
    [props.forPrint, fgEventSegs, options.eventOrderStrict, options.eventSlicing, cells.length],
  )
  const hasNavLink = options.navLinks
  const weekNumberRenderProps = useMemo(
    () => buildWeekNumberRenderProps(weekDateMarker, context, props.cellIsNarrow, hasNavLink),
    [weekDateMarker, context, props.cellIsNarrow, hasNavLink],
  )

  const screenFgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true
  let printColumns: DayGridPrintBandSlot[][] | null = null
  let screenColumns: DayGridPlacementColumn[] | null = null
  let screenSliceCoords: ReadonlyMap<string, number> = new Map()
  let screenMainOffsetsByCol: (number | undefined)[] = []
  let screenHeightsByCol: (number | undefined)[] = []

  if (printPlan) {
    printColumns = buildDayGridPrintColumns(
      printPlan,
      measures.printSegHeightRefMap.current,
    )
  } else {
    const placementMode = resolveDayGridPlacementMode(
      props.dayMaxEvents,
      props.dayMaxEventRows,
    )
    const [maxMainTop, minMainHeight] = computeFgDims(props.cells, measures)
    const screenLayout = placementMode === 'auto'
      ? buildDayGridPixelPlacements(
        fgEventSegs,
        options.eventOrderStrict,
        options.eventSlicing,
        cells.length,
        minMainHeight,
        props.moreLinkHeight,
        levelCapacityRef.current,
        measures.sliceHeightRefMap.current,
      )
      : buildDayGridLevelPlacements(
        fgEventSegs,
        computeDayGridDomCandidateMaxLevels(
          placementMode,
          props.dayMaxEvents,
          props.dayMaxEventRows,
          Infinity,
        ),
        computeDayGridMoreLinkLevelTax(placementMode),
        options.eventOrderStrict,
        options.eventSlicing,
        cells.length,
        measures.sliceHeightRefMap.current,
      )
    screenColumns = screenLayout.columns
    screenSliceCoords = screenLayout.sliceCoords

    if (maxMainTop != null) {
      for (let col = 0; col < cells.length; col++) {
        const cellHeaderHeight = headerHeightRefMap.current.get(cells[col].key)
        const mainOffset = cellHeaderHeight != null
          ? maxMainTop - cellHeaderHeight
          : undefined

        screenMainOffsetsByCol.push(mainOffset)
        screenHeightsByCol.push(
          mainOffset != null
            ? screenColumns[col].contentHeight + mainOffset
            : undefined,
        )
      }
    }
  }

  const highlightSegs = getHighlightSegs(props)
  const fullWeekStr = buildDateStr(context, weekDateMarker, 'week')
  const fillsByCol: ReactElement[][] = cells.map(() => [])

  // Table mode gives this theme-positioned node a row-wide canvas hosted by the first cell.
  const weekNumberNode = (props.showWeekNumbers && !props.cellIsMicro) ? (
    <InlineWeekNumber
      attrs={{
        ...(
          hasNavLink
            ? buildNavLinkAttrs(
              context,
              weekDateMarker,
              'week',
              fullWeekStr,
              /* isTabbable = */ false,
            )
            : {}
        ),
        'role': undefined, // HACK: a 'link' role can't be child of a 'row' role
        'aria-hidden': true, // HACK: never part of a11y tree because row already has label and role not allowed
      }}
      renderProps={weekNumberRenderProps}
    />
  ) : null

  if (tableMode && weekNumberNode) {
    fillsByCol[0].push(
      <div
        key="week-number"
        className={joinClassNames(
          classNames.fillY,
          classNames.start0,
          classNames.pointerEventsNone,
        )}
        style={{
          width: computeSpanWidth(props, 0, cells.length),
        }}
      >
        {weekNumberNode}
      </div>,
    )
  }

  appendFillSegs(
    props,
    context,
    fillsByCol,
    props.businessHourSegs,
    'non-business',
    DAY_GRID_NON_BUSINESS_Z_CLASS,
  )
  appendFillSegs(
    props,
    context,
    fillsByCol,
    props.bgEventSegs,
    'bg-event',
    DAY_GRID_BG_EVENT_Z_CLASS,
  )
  appendFillSegs(
    props,
    context,
    fillsByCol,
    highlightSegs,
    'highlight',
    DAY_GRID_HIGHLIGHT_Z_CLASS,
  )

  const RowTag = tableMode ? 'tr' : 'div'

  return (
    <RowTag
      role={props.role as any /* !!! */}
      aria-label={
        props.role === 'row' // HACK
          ? fullWeekStr
          : undefined // can't have label on non-role div
      }
      className={joinClassNames(
        options.dayRowClass,
        props.className,
        tableMode && classNames.borderless,
        !tableMode && classNames.flexRow,
        !tableMode && classNames.rel, // origin for the inline week number
        !tableMode && classNames.borderlessX,
        !tableMode && classNames.borderlessTop,
        (!tableMode && !props.borderBottom) && classNames.borderlessBottom,
        classNames.isolate,
      )}
      style={{
        flexBasis: tableMode ? undefined : props.basis,
      }}
      ref={handleRootEl}
    >
      {!tableMode && weekNumberNode}
      {props.cells.map((cell, col) => {
        const printPopover = printPlan
          ? buildDayGridPopoverSegs(
            printPlan.sourceSegs,
            printPlan.hiddenSlices,
            col,
          )
          : null
        const screenRenderSlices = printPlan ? null : screenColumns![col].renderSlices
        let fg: ReactElement[]

        if (printPlan) {
          fg = renderPrintBandSlots(props, printColumns![col], measures.printSegHeightRefMap)
        } else {
          fg = [
            ...renderLevelFgSegs(
              props,
              screenMainOffsetsByCol[col],
              screenRenderSlices!,
              screenSliceCoords,
              measures.sliceHeightRefMap,
            ),
            ...renderMirrorFgSegs(
              props,
              col,
              screenMainOffsetsByCol[col],
              screenSliceCoords,
            ),
          ]
        }

        return (
          <DayGridCell
            key={cell.key}
            dateProfile={props.dateProfile}
            todayRange={props.todayRange}
            date={cell.date}
            isMajor={cell.isMajor}
            isDisabled={cell.isDisabled}
            showDayNumber={props.showDayNumbers}
            isNarrow={props.cellIsNarrow}
            isMicro={props.cellIsMicro}
            borderStart={Boolean(col)}
            borderBottom={props.borderBottom}
            tableMode={tableMode}

            // content
            fills={fillsByCol[col]}
            segs={printPopover ? printPopover.segs : screenColumns![col].segs}
            hiddenSegs={printPopover ? printPopover.hiddenSegs : screenColumns![col].hiddenSegs}
            fgLiquidHeight={printPlan ? false : screenFgLiquidHeight}
            fg={fg}
            fgIsList={Boolean(screenRenderSlices?.length)}
            eventDrag={printPlan ? null : props.eventDrag}
            eventResize={printPlan ? null : props.eventResize}
            eventSelection={props.eventSelection}

            // render hooks
            renderProps={cell.renderProps}
            dateSpanProps={cell.dateSpanProps}
            attrs={cell.attrs}
            className={cell.className}

            // dimensions
            fgHeight={printPlan ? undefined : screenHeightsByCol[col]}
            width={props.colWidth}

            // refs
            headerHeightRef={printPlan ? undefined : headerHeightRefMap.createRef(cell.key)}
            mainHeightRef={printPlan ? undefined : mainHeightRefMap.createRef(cell.key)}
          />
        )
      })}
    </RowTag>
  )
})

interface RowMeasures {
  headerHeightRefMap: RefMap<string, number>
  mainHeightRefMap: RefMap<string, number>
  sliceHeightRefMap: RefMap<string, number>
  printSegHeightRefMap: RefMap<string, number> // replaced on leaving print
  createPrintSegHeightRefMap: () => RefMap<string, number>
}

function incrementCounter(n: number): number {
  return n + 1
}

/** Mirrors align with kernel coordinates but bypass admission and measurement. */
function renderMirrorFgSegs(
  props: DayGridRowProps,
  col: number,
  mainOffset: number | undefined,
  sliceCoords: ReadonlyMap<string, number>,
): ReactElement[] {
  const { eventSelection } = props
  const nodes: ReactElement[] = []

  for (const seg of getMirrorSegs(props)) {
    if (seg.start !== col) {
      continue
    }

    const key = getDayGridSegKey(seg)
    const { eventRange } = seg
    const { instanceId } = eventRange.instance
    const top = mainOffset != null
      ? mainOffset + (sliceCoords.get(key) ?? 0)
      : undefined
    const isDragging = Boolean(
      props.eventDrag && props.eventDrag.affectedInstances[instanceId],
    )
    const isResizing = Boolean(
      props.eventResize && props.eventResize.affectedInstances[instanceId],
    )
    const isSelected = instanceId === eventSelection

    nodes.push(
      <MeasuredHeightHarness
        key={`mirror:${key}`}
        attrs={{ 'aria-hidden': true }}
        className={joinClassNames(
          classNames.abs,
          classNames.start0,
          DAY_GRID_INTERACTION_Z_CLASS,
        )}
        style={{
          top,
          width: computeSpanWidth(props, seg.start, seg.end),
        }}
        heightRef={null}
      >
        {renderEventContent(props, seg, eventRange, {
          isDragging,
          isResizing,
          isMirror: true,
          isSelected,
        })}
      </MeasuredHeightHarness>,
    )
  }

  return nodes
}

/** Renders every kernel slice with its own measurement ref. */
function renderLevelFgSegs(
  props: DayGridRowProps,
  mainOffset: number | undefined,
  slices: Slice<DayGridSourceSeg>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightRefMap: RefMap<string, number>,
): ReactElement[] {
  const { eventSelection } = props
  const nodes: ReactElement[] = []

  for (const slice of slices) {
    const key = getSliceKey(slice)
    const sliceTop = sliceCoords.get(key)
    const { eventRange } = slice.sourceSeg
    const { instanceId } = eventRange.instance
    const top = mainOffset != null && sliceTop != null
      ? mainOffset + sliceTop
      : undefined
    const isDragging = Boolean(
      props.eventDrag && props.eventDrag.affectedInstances[instanceId],
    )
    const isResizing = Boolean(
      props.eventResize && props.eventResize.affectedInstances[instanceId],
    )
    const isInvisible = isDragging || isResizing || top == null
    const isSelected = instanceId === eventSelection

    nodes.push(
      <MeasuredHeightHarness
        key={key}
        attrs={{ role: 'listitem' }}
        className={joinClassNames(
          classNames.abs,
          classNames.start0,
          isSelected ? DAY_GRID_INTERACTION_Z_CLASS : DAY_GRID_EVENT_Z_CLASS,
        )}
        style={{
          visibility: isInvisible ? 'hidden' : undefined,
          top,
          width: computeSpanWidth(props, slice.start, slice.end),
        }}
        heightRef={sliceHeightRefMap.createRef(key)}
      >
        {renderEventContent(props, slice, eventRange, {
          isDragging,
          isResizing,
          isSelected,
        })}
      </MeasuredHeightHarness>,
    )
  }

  return nodes
}

/**
 * The inner event, identical on both placement routes. Only the wrapper
 * around it differs: the screen route positions it, print lets it sit at the
 * static top of its band slot.
*/
function renderEventContent(
  props: DayGridRowProps,
  range: SlicedCoordRange,
  eventRange: EventRangeProps['eventRange'],
  interaction: {
    isDragging?: boolean
    isResizing?: boolean
    isMirror?: boolean
    isSelected?: boolean
  },
): ReactElement {
  const isListItem = hasListItemDisplay(range, eventRange)
  // the range's starting cell supplies extra render props
  const cellRenderProps = props.cells[range.start]?.renderProps

  return (
    <ForegroundEvent
      variant={isListItem ? listItemEventVariant : rowEventVariant}
      eventRange={eventRange}
      isStart={range.isStart}
      isEnd={range.isEnd}
      isDragging={Boolean(interaction.isDragging)}
      isResizing={Boolean(interaction.isResizing)}
      isMirror={Boolean(interaction.isMirror)}
      isSelected={Boolean(interaction.isSelected)}
      isNarrow={props.cellIsNarrow}
      defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
      defaultDisplayEventEnd={props.cells.length === 1}
      disableResizing={isListItem}
      forcedTimeText={props.cellIsMicro ? '' : undefined}
      renderProps={cellRenderProps}
      {...getEventRangeMeta(eventRange, props.todayRange)}
    />
  )
}

/** Renders aligned print slots with in-flow event wrappers that can paginate with their bands. */
function renderPrintBandSlots(
  props: DayGridRowProps,
  slots: DayGridPrintBandSlot[],
  printSegHeightRefMap: RefMap<string, number>,
): ReactElement[] {
  return slots.map((slot) => {
    const { slice } = slot
    let eventNode: ReactElement | null = null

    if (slice) {
      const sliceKey = getDayGridPrintSliceKey(slice)

      eventNode = (
        <MeasuredHeightHarness
          key={sliceKey}
          className={joinClassNames(
            classNames.rel,
            classNames.flowRoot,
            DAY_GRID_EVENT_Z_CLASS,
          )}
          style={{
            width: computeSpanWidth(props, slice.start, slice.end),
          }}
          heightRef={printSegHeightRefMap.createRef(sliceKey)}
        >
          {/* print has no interaction state at all */}
          {renderEventContent(props, slice, slice.sourceSeg.eventRange, {})}
        </MeasuredHeightHarness>
      )
    }

    return (
      <div
        key={slot.levelIndex}
        className={classNames.breakInsideAvoid}
        style={{ height: slot.thickness }}
      >
        {eventNode}
      </div>
    )
  })
}

function computeSpanWidth(props: DayGridRowProps, start: number, end: number) {
  const span = end - start
  const percentWidth = `${span * 100}%`

  // Flex cells have uniform inner widths, so spans must add crossed borders.
  // Fixed-table cells have uniform outer widths; the borderless first cell's inner
  // width already includes that space, so no border compensation is needed.
  const crossedBorderWidth = props.tableMode && start === 0
    ? 0
    : Math.max(0, span - 1) * COL_BORDER_WIDTH

  return crossedBorderWidth
    ? `calc(${percentWidth} + ${crossedBorderWidth}px)`
    : percentWidth
}

/** Places each fill in its first cell while allowing its wrapper to span subsequent cells. */
function appendFillSegs(
  props: DayGridRowProps,
  context: ViewContext,
  fillsByCol: ReactElement[][],
  segs: DayRowEventRangePart[],
  fillType: string,
  zClassName: string,
): void {
  const { todayRange } = props

  for (const seg of segs) {
    fillsByCol[seg.start].push(
      <div
        key={`${fillType}:${buildEventRangeKey(seg.eventRange)}:${seg.start}:${seg.end}`}
        aria-hidden // fills, including bg events, are decorative. hidden from screen readers
        className={joinClassNames(classNames.fillY, classNames.start0, zClassName)}
        style={{
          width: computeSpanWidth(props, seg.start, seg.end),
        }}
      >
        {fillType === 'bg-event' ?
          <BgEvent
            eventRange={seg.eventRange}
            isStart={seg.isStart}
            isEnd={seg.isEnd}
            isNarrow={props.cellIsNarrow}
            isVertical={false}
            renderProps={props.cells[seg.start]?.renderProps}
            {...getEventRangeMeta(seg.eventRange, todayRange)}
          /> : (
            renderFill(fillType, context.options)
          )
        }
      </div>,
    )
  }
}

// Sizing
// -------------------------------------------------------------------------------------------------

function computeFgDims(
  cells: DayTableCell[],
  measures: RowMeasures,
): [maxMainTop: number | undefined, minMainHeight: number | undefined] {
  const headerHeightMap = measures.headerHeightRefMap.current
  const mainHeightMap = measures.mainHeightRefMap.current
  let maxMainTop: number | undefined
  let minMainBottom: number | undefined
  let isComplete = true

  for (const cell of cells) {
    if (cell.isDisabled) {
      continue
    }

    const mainTop = headerHeightMap.get(cell.key)
    const mainHeight = mainHeightMap.get(cell.key)

    if (mainTop == null || mainHeight == null) {
      isComplete = false
    }

    if (mainTop != null) {
      if (maxMainTop === undefined || mainTop > maxMainTop) {
        maxMainTop = mainTop
      }

      if (mainHeight != null) {
        const mainBottom = mainTop + mainHeight

        if (minMainBottom === undefined || mainBottom < minMainBottom) {
          minMainBottom = mainBottom
        }
      }
    }
  }

  return [
    maxMainTop,
    isComplete && minMainBottom != null && maxMainTop != null
      ? minMainBottom - maxMainTop
      : undefined,
  ]
}

/**
 * Grows the row-local DOM candidate frontier from one post-size snapshot.
 * This is the only monotone state auto placement needs: the engine itself
 * consumes exact measurements and never predicts a thickness.
 */
function updateAutoPlacementRatchets(
  props: DayGridRowProps,
  measures: RowMeasures,
  levelCapacityRef: { current: number },
): void {
  if (resolveDayGridPlacementMode(
    props.dayMaxEvents,
    props.dayMaxEventRows,
  ) !== 'auto') {
    return
  }

  const [, canvasHeight] = computeFgDims(props.cells, measures)
  if (canvasHeight != null) {
    const smallestSliceHeight = Math.min(...measures.sliceHeightRefMap.current.values())
    levelCapacityRef.current = Math.max(
      levelCapacityRef.current,
      estimateLevelCapacity(canvasHeight, smallestSliceHeight),
    )
  }
}

// Internal Utils
// -------------------------------------------------------------------------------------------------

function getMirrorSegs(props: DayGridRowProps): (SlicedCoordRange & EventRangeProps)[] {
  if (props.eventResize && props.eventResize.segs.length) { // messy check
    return props.eventResize.segs
  }

  return []
}

function getHighlightSegs(props: DayGridRowProps): (SlicedCoordRange & EventRangeProps)[] {
  if (props.eventDrag && props.eventDrag.segs.length) { // messy check
    return props.eventDrag.segs
  }

  if (props.eventResize && props.eventResize.segs.length) { // messy check
    return props.eventResize.segs
  }

  return props.dateSelectionSegs
}

// the inline week number, with its inlineWeekNumber* render hooks
function InlineWeekNumber(props: { attrs: Record<string, any>, renderProps: InlineWeekNumberInfo }) {
  const options = useViewOptions()
  const renderHookEl = useRenderHookEl({
    classGenerator: options.inlineWeekNumberClass,
    didMount: options.inlineWeekNumberDidMount,
    willUnmount: options.inlineWeekNumberWillUnmount,
    renderProps: props.renderProps,
  })

  return (
    <CustomContent<InlineWeekNumberInfo>
      tag="div"
      attrs={props.attrs}
      className={joinClassNames(DAY_GRID_EVENT_Z_CLASS, renderHookEl.className)}
      elRef={renderHookEl.ref}
      renderProps={props.renderProps}
      generatorName="inlineWeekNumberContent"
      generator={options.inlineWeekNumberContent}
      fallback={renderText}
    />
  )
}

function buildWeekNumberRenderProps(
  weekDateMarker: DateMarker,
  context: ViewContext,
  isNarrow: boolean,
  hasNavLink: boolean,
): InlineWeekNumberInfo {
  const { dateEnv, options } = context
  const weekNum = dateEnv.computeWeekNumber(weekDateMarker)
  const weekNumTextParts = dateEnv.formatToParts(
    weekDateMarker,
    options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT,
  )
  const weekNumText = joinDateTimeFormatParts(weekNumTextParts)
  const weekDateZoned = dateEnv.toDate(weekDateMarker)
  return {
    num: weekNum,
    text: weekNumText,
    textParts: weekNumTextParts,
    date: weekDateZoned,
    isNarrow,
    hasNavLink,
  }
}
