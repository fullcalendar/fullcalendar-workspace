import { InlineWeekNumberInfo } from '../../common/WeekNumberContainer'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { BaseComponent, setRef } from '../../vdom-util'
import { DateRange, DateMarker, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { getEventRangeMeta, sortEventSegs, EventRangeProps } from '../../component-util/event-rendering'
import { SlicedCoordRange } from '../../coord-range'
import { DateProfile } from '../../DateProfileGenerator'
import { BgEvent, renderFill } from '../../common/bg-fill'
import { DayTableCell } from '../DayTableModel'
import { RefMap } from '../../util/RefMap'
import { createFormatter } from '../../datelib/formatting'
import { watchHeight, afterSize } from '../../component-util/resize-observer'
import { buildDateStr, buildNavLinkAttrs } from '../../common/nav-link'
import { joinClassNames } from '../../util/html'
import { renderText, ContentContainer } from '../../content-inject/ContentContainer'
import { StandardEvent } from '../../common/StandardEvent'
import { memoize } from '../../util/memoize'
import { ViewContext } from '../../ViewContext'
import { type ReactElement, type Ref } from 'react'
import { DayRowEventRangePart, getEventPartKey } from '../TableSeg'
import { DayGridCell } from './DayGridCell'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-rendering'
import { computeHorizontalsFromSeg } from './util'
import { DayGridEventHarness } from './DayGridEventHarness'
import { type Slice } from '../../seg-placement/layout'
import {
  type DayGridEventSeg,
  type DayGridSegDomItem,
  type DayGridSegPlacementColumn,
  type DayGridSegPlacementPlan,
  buildDayGridSegPlacementPlan,
  buildDayGridSegPlacements,
  computeDayGridDomCandidateMaxLevels,
  computeDayGridMeasuredLimits,
  resolveDayGridPlacementMode,
} from '../seg-placement-adapter'
import {
  type DayGridPrintBandSlot,
  type DayGridPrintColumn,
  type DayGridPrintPlan,
  buildDayGridPrintColumns,
  buildDayGridPrintPlan,
  buildDayGridPrintPopoverSegs,
  buildDayGridPrintSegHeights,
  getDayGridPrintSliceKey,
} from '../print-adapter'
import classNames from '../../styles.module.css'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  cellIsNarrow: boolean
  cellIsMicro: boolean
  showDayNumbers: boolean
  showWeekNumbers?: boolean
  forPrint: boolean
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
  colWidth?: number // the applied width (NOT the computed width)
  basis?: number // height before growing
  maxDomLevels?: number // shared cross-row candidate frontier
  moreLinkHeight?: number // shared cross-row +more link reservation

  // refs
  rootElRef?: Ref<HTMLElement> // needed by TimeGrid, to attach Hit system
  heightRef?: Ref<number>
  onEventHeight?: (height: number) => void // occupied height of one event wrapper
  onEventAreaHeight?: (height: number) => void // row-wide height shared by all foreground events
  onMoreLinkHeight?: (height: number) => void // occupied height of one +more link
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

/** What the screen placement route hands the render tree. */
interface DayGridRowColumns {
  columns: DayGridSegPlacementColumn[]
  /** Positioned node tops by node key, for aligning drag/resize mirrors. */
  segTops: ReadonlyMap<string, number>
}

export class DayGridRow extends BaseComponent<DayGridRowProps> {
  // ref
  private rootEl: HTMLElement | undefined
  private headerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleSegPositioning)
  })
  private mainHeightRefMap = new RefMap<string, number>(() => {
    // Recorded in every screen mode so a row that becomes liquid already knows its
    // ceiling, but only a liquid row's placement depends on it.
    const fgLiquidHeight = this.props.dayMaxEvents === true || this.props.dayMaxEventRows === true
    if (fgLiquidHeight) {
      afterSize(this.handleSegPositioning)
    }
  })
  private moreLinkHeightRefMap = new RefMap<string, number>((height) => {
    // A cell with no link reports zero. Only a real link can raise the
    // owner-wide reservation, and nothing ever lowers it.
    if (height > 0) {
      this.props.onMoreLinkHeight?.(height)
    }
  })
  // Only a source's permanent wrapper is given one of these refs, so every
  // value here is one complete event's occupied height.
  private segHeightRefMap = new RefMap<string, number>((height) => {
    if (height > 0) {
      this.props.onEventHeight?.(height)
    }
    afterSize(this.handleSegPositioning)
  })

  // print-only (band thickness is row-wide while slots render per-cell, so
  // this state must live here; see also buildPrintPlan, renderPrintBandSlots,
  // handlePrintSegHeights, and the reset in componentDidUpdate)
  private handlePrintSegHeightChange = () => {
    afterSize(this.handlePrintSegHeights)
  }
  private printSegHeightRefMap = new RefMap<string, number>(this.handlePrintSegHeightChange)

  // memo
  private buildWeekNumberRenderProps = memoize(buildWeekNumberRenderProps)
  private buildPlacementPlan = memoize(buildDayGridSegPlacementPlan)
  private buildPrintPlan = memoize(buildDayGridPrintPlan)
  private sortEventSegs = memoize(sortEventSegs)

  // internal
  private _isUnmounting: boolean
  private disconnectHeight?: () => void

  render() {
    const { props, context, headerHeightRefMap, mainHeightRefMap, moreLinkHeightRefMap } = this
    const { cells } = props
    const { options } = context

    const weekDateMarker = props.cells[0].date
    const fgEventSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)
    const screenFgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true
    let printPlan: DayGridPrintPlan | null = null
    let printColumns: DayGridPrintColumn[] | null = null
    let screenColumns: DayGridSegPlacementColumn[] | null = null
    let screenMaxMainTop: number | undefined
    let screenHeightsByCol: (number | undefined)[] = []
    let screenMirrorItems: DayGridSegDomItem[] = []

    if (props.forPrint) {
      printPlan = this.buildPrintPlan(
        fgEventSegs,
        options.eventOrderStrict,
        options.eventSlicing,
        cells.length,
      )
      printColumns = buildDayGridPrintColumns(
        printPlan,
        buildDayGridPrintSegHeights(
          printPlan.visiblePlacements,
          this.printSegHeightRefMap.current,
        ),
      )
    } else {
      const placementPlan = this.buildPlacementPlan(
        fgEventSegs,
        computeDayGridDomCandidateMaxLevels(
          props.dayMaxEvents,
          props.dayMaxEventRows,
          props.maxDomLevels ?? Infinity,
        ),
        options.eventOrderStrict,
        options.eventSlicing,
      )

      // TODO: memoize?
      const [maxMainTop, minMainHeight] = this.computeFgDims()
      const screenLayout = this.buildEngineColumns(placementPlan, minMainHeight)
      screenColumns = screenLayout.columns
      screenMaxMainTop = maxMainTop
      screenMirrorItems = this.buildMirrorItems(screenLayout.segTops)

      if (maxMainTop != null) {
        for (let col = 0; col < cells.length; col++) {
          const cellHeaderHeight = headerHeightRefMap.current.get(cells[col].key)
          screenHeightsByCol.push(
            cellHeaderHeight != null
              ? screenColumns[col].contentHeight + maxMainTop - cellHeaderHeight
              : undefined,
          )
        }
      }
    }

    const highlightSegs = this.getHighlightSegs()
    const hasNavLink = options.navLinks
    const fullWeekStr = buildDateStr(context, weekDateMarker, 'week')

    const weekNumberRenderProps = this.buildWeekNumberRenderProps(
      weekDateMarker,
      context,
      props.cellIsNarrow,
      hasNavLink,
    )

    return (
      <div
        role={props.role as any /* !!! */}
        aria-label={
          props.role === 'row' // HACK
            ? fullWeekStr
            : undefined // can't have label on non-role div
        }
        className={joinClassNames(
          options.dayRowClass,
          props.className,
          classNames.flexRow,
          classNames.rel, // origin for inlineWeekNumber?
          classNames.isolate,
          (props.forPrint && props.basis !== undefined) && // basis implies siblings (must share height)
            classNames.printSiblingRow,
        )}
        style={{
          flexBasis: props.basis,
        }}
        ref={this.handleRootEl}
      >
        {(props.showWeekNumbers && !props.cellIsMicro) && (
          <ContentContainer<InlineWeekNumberInfo>
            tag='div'
            attrs={{
              ...(
                hasNavLink
                  ? buildNavLinkAttrs(context, weekDateMarker, 'week', fullWeekStr, /* isTabbable = */ false)
                  : {}
              ),
              'role': undefined, // HACK: a 'link' role can't be child of 'row' role
              'aria-hidden': true, // HACK: never part of a11y tree because row already has label and role not allowed
            }}
            // put above all cells (TODO: put explicit z0 on each cell?)
            className={classNames.z1}
            renderProps={weekNumberRenderProps}
            generatorName="inlineWeekNumberContent"
            customGenerator={options.inlineWeekNumberContent}
            defaultGenerator={renderText}
            classNameGenerator={options.inlineWeekNumberClass}
            didMount={options.inlineWeekNumberDidMount}
            willUnmount={options.inlineWeekNumberWillUnmount}
          />
        )}
        {this.renderFillSegs(props.businessHourSegs, 'non-business')}
        {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
        {this.renderFillSegs(highlightSegs, 'highlight')}
        {props.cells.map((cell, col) => {
          const printPopover = printPlan
            ? buildDayGridPrintPopoverSegs(printPlan, col)
            : null
          const fg = printPlan
            ? this.renderPrintBandSlots(printColumns![col].bandSlots)
            : this.renderFgSegs(
                screenMaxMainTop,
                screenColumns![col].domItems,
                /* isMirror = */ false,
              )

          return (
            <DayGridCell
              key={cell.key}
              dateProfile={props.dateProfile}
              todayRange={props.todayRange}
              date={cell.date}
              isMajor={cell.isMajor}
              showDayNumber={props.showDayNumbers}
              isNarrow={props.cellIsNarrow}
              isMicro={props.cellIsMicro}
              borderStart={Boolean(col)}

              // content
              segs={printPopover ? printPopover.segs : screenColumns![col].segs}
              hiddenSegs={printPopover ? printPopover.hiddenSegs : screenColumns![col].hiddenSegs}
              fgLiquidHeight={printPlan ? false : screenFgLiquidHeight}
              fg={fg}
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
              moreLinkHeightRef={printPlan ? undefined : moreLinkHeightRefMap.createRef(cell.key)}
            />
          )
        })}
        {!printPlan && this.renderFgSegs(
          screenMaxMainTop,
          screenMirrorItems,
          /* isMirror = */ true,
        )}
      </div>
    )
  }

  renderFgSegs(
    headerHeight: number | undefined,
    items: DayGridSegDomItem[],
    isMirror: boolean,
  ): ReactElement[] {
    const { props, segHeightRefMap } = this
    const { colWidth, eventSelection } = props

    const colCount = props.cells.length
    const nodes: ReactElement[] = []

    for (const item of items) {
      const { key, seg } = item
      const { eventRange } = seg
      const { instanceId } = eventRange.instance

      const { insetInlineStart, insetInlineEnd } = computeHorizontalsFromSeg(seg, colWidth, colCount)
      const top = headerHeight != null && item.top != null
        ? headerHeight + item.top
        : undefined

      const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
      const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
      const isInvisible = !isMirror && (isDragging || isResizing || top == null)
      const isSelected = instanceId === eventSelection

      nodes.push(
        <DayGridEventHarness
          key={key}
          className={seg.start ? classNames.fakeBorderS : ''}
          style={{
            visibility: isInvisible ? 'hidden' : undefined,
            top,
            insetInlineStart,
            insetInlineEnd,
            zIndex: isSelected ? 1000 : 0, // container inner z-indexes; HACK: relies on hardcoded z-index offset; fragile if stacking context changes
          }}
          heightRef={item.isMeasurable ? segHeightRefMap.createRef(key) : null}
        >
          {this.renderEventContent(seg, {
            isDragging,
            isResizing,
            isMirror,
            isSelected,
          })}
        </DayGridEventHarness>,
      )
    }

    return nodes
  }

  /**
   * The inner event, identical on both placement routes. Only the wrapper
   * around it differs: the screen route positions it, print lets it sit at the
   * static top of its band slot.
   */
  private renderEventContent(
    seg: DayRowEventRangePart,
    interaction: {
      isDragging?: boolean
      isResizing?: boolean
      isMirror?: boolean
      isSelected?: boolean
    },
  ): ReactElement {
    const { props } = this
    const { eventRange } = seg
    const isListItem = hasListItemDisplay(seg)

    return (
      <StandardEvent
        display={isListItem ? 'list-item' : 'row'}
        eventRange={eventRange}
        isStart={seg.isStart}
        isEnd={seg.isEnd}
        isDragging={Boolean(interaction.isDragging)}
        isResizing={Boolean(interaction.isResizing)}
        isMirror={Boolean(interaction.isMirror)}
        isSelected={Boolean(interaction.isSelected)}
        isNarrow={props.cellIsNarrow}
        defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
        defaultDisplayEventEnd={props.cells.length === 1}
        disableResizing={isListItem}
        forcedTimeText={props.cellIsMicro ? '' : undefined}
        {...getEventRangeMeta(eventRange, props.todayRange)}
      />
    )
  }

  /** Renders print's normal-flow slots and their in-place measured wrappers. */
  private renderPrintBandSlots(slots: DayGridPrintBandSlot[]): ReactElement[] {
    const { props, printSegHeightRefMap } = this
    const { colWidth } = props
    const colCount = props.cells.length

    return slots.map((slot) => {
      const { slice } = slot
      let eventNode: ReactElement | null = null

      if (slice) {
        const seg = buildPrintEventSeg(slice)
        const sliceKey = getDayGridPrintSliceKey(slice)

        // Insets resolve against the row (the nearest positioned ancestor,
        // same as the screen wrappers), not the slot, whose width is inset by
        // cell borders/padding. The unspecified `top` keeps the wrapper at its
        // static position: the top of its slot.
        const { insetInlineStart, insetInlineEnd } = computeHorizontalsFromSeg(slice, colWidth, colCount)

        eventNode = (
          <DayGridEventHarness
            key={sliceKey}
            className={seg.start ? classNames.fakeBorderS : ''}
            style={{
              insetInlineStart,
              insetInlineEnd,
            }}
            heightRef={printSegHeightRefMap.createRef(sliceKey)}
          >
            {/* print has no interaction state at all */}
            {this.renderEventContent(seg, {})}
          </DayGridEventHarness>
        )
      }

      return (
        <div
          key={slot.levelIndex}
          // no `rel` — the slot must not become the offset parent (see above)
          className={classNames.breakInsideAvoid}
          style={{ height: slot.thickness }}
        >
          {eventNode}
        </div>
      )
    })
  }

  renderFillSegs(
    segs: DayRowEventRangePart[],
    fillType: string,
  ): ReactElement {
    const { props, context } = this
    const { todayRange, colWidth } = props

    const colCount = props.cells.length
    const nodes: ReactElement[] = []

    for (const seg of segs) {
      const key = seg.start + ':' + seg.end // NOTE: don't use date, because could be multiple of same (w/ resources)
      const { insetInlineStart, insetInlineEnd } = computeHorizontalsFromSeg(seg, colWidth, colCount)

      nodes.push(
        <div
          key={key}
          className={classNames.fillY}
          style={{
            insetInlineStart,
            insetInlineEnd,
          }}
        >
          {fillType === 'bg-event' ?
            <BgEvent
              eventRange={seg.eventRange}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              isNarrow={props.cellIsNarrow}
              isVertical={false}
              {...getEventRangeMeta(seg.eventRange, todayRange)}
            /> : (
              renderFill(fillType, context.options)
            )
          }
        </div>,
      )
    }

    return <>{nodes}</>
  }

  handleRootEl = (rootEl: HTMLElement) => {
    this.rootEl = rootEl
    setRef(this.props.rootElRef, rootEl)
  }

  // Placement routes
  // -----------------------------------------------------------------------------------------------

  /** Every screen mode, positioned and limited by the shared engine. */
  private buildEngineColumns(
    placementPlan: DayGridSegPlacementPlan,
    eventAreaHeight: number | undefined,
  ): DayGridRowColumns {
    const { props } = this

    // TODO: memoize?
    const columns = buildDayGridSegPlacements(
      placementPlan,
      this.segHeightRefMap.current,
      computeDayGridMeasuredLimits({
        mode: resolveDayGridPlacementMode(props.dayMaxEvents, props.dayMaxEventRows),
        candidateMaxLevels: placementPlan.maxLevels,
        columnCount: props.cells.length,
        eventAreaHeight,
        moreLinkHeight: props.moreLinkHeight,
      }),
    )

    const segTops = new Map<string, number>()
    for (const column of columns) {
      for (const item of column.domItems) {
        if (item.top != null) {
          segTops.set(item.key, item.top)
        }
      }
    }

    return { columns, segTops }
  }

  /**
   * Mirrors bypass admission entirely, so they are never hidden and never
   * measured. Each aligns with its underlying event's wrapper when that
   * wrapper is positioned, and with the top of the event area otherwise.
   */
  private buildMirrorItems(segTops: ReadonlyMap<string, number>): DayGridSegDomItem[] {
    return this.getMirrorSegs().map((seg) => {
      const key = getEventPartKey(seg)
      return {
        key,
        seg,
        top: segTops.get(key) ?? 0,
        isMeasurable: false,
      }
    })
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this._isUnmounting = false
    const { rootEl } = this // TODO: make dynamic with useEffect

    this.disconnectHeight = watchHeight(rootEl, (contentHeight) => {
      setRef(this.props.heightRef, contentHeight)
    })
  }

  componentDidUpdate(prevProps: DayGridRowProps): void {
    if (prevProps.forPrint && !this.props.forPrint) {
      this.printSegHeightRefMap = new RefMap<string, number>(this.handlePrintSegHeightChange)
    }
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectHeight()
    setRef(this.props.heightRef, null)
  }

  computeFgDims(): [maxMainTop: number | undefined, minMainHeight: number | undefined] {
    const { cells } = this.props
    const headerHeightMap = this.headerHeightRefMap.current
    const mainHeightMap = this.mainHeightRefMap.current
    let maxMainTop: number | undefined
    let minMainBottom: number | undefined

    for (const cell of cells) {
      const mainTop = headerHeightMap.get(cell.key)
      const mainHeight = mainHeightMap.get(cell.key)

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
      minMainBottom != null && maxMainTop != null
        ? minMainBottom - maxMainTop
        : undefined,
    ]
  }

  private handleSegPositioning = () => {
    if (this._isUnmounting || this.props.forPrint) return
    this.reportEventAreaHeight()
    this.forceUpdate()
  }

  private handlePrintSegHeights = () => {
    if (this._isUnmounting || !this.props.forPrint) return
    this.forceUpdate()
  }

  /**
   * Reports the height foreground events actually compete for, which is what
   * the cross-row owner ratchets. Reporting waits for a complete row snapshot
   * so partially populated measurement maps cannot inflate the monotone owner.
   */
  private reportEventAreaHeight(): void {
    const { cells, onEventAreaHeight } = this.props
    if (
      onEventAreaHeight &&
      cells.every((cell) =>
        this.headerHeightRefMap.current.has(cell.key) &&
        this.mainHeightRefMap.current.has(cell.key)
      )
    ) {
      const [, minMainHeight] = this.computeFgDims()
      if (minMainHeight != null) {
        onEventAreaHeight(minMainHeight)
      }
    }
  }

  // Internal Utils
  // -----------------------------------------------------------------------------------------------

  private getMirrorSegs(): (SlicedCoordRange & EventRangeProps)[] {
    let { props } = this

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs
    }

    return []
  }

  private getHighlightSegs(): (SlicedCoordRange & EventRangeProps)[] {
    let { props } = this

    if (props.eventDrag && props.eventDrag.segs.length) { // messy check
      return props.eventDrag.segs
    }

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs
    }

    return props.dateSelectionSegs
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function buildPrintEventSeg(slice: Slice<DayGridEventSeg>): DayRowEventRangePart {
  return {
    ...slice.sourceSeg.meta,
    start: slice.start,
    end: slice.end,
    isStart: slice.isStart,
    isEnd: slice.isEnd,
  }
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
