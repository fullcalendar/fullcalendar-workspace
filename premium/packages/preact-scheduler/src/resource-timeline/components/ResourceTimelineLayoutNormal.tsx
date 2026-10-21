import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
  getIsHeightAuto,
  getFooterScrollbarSticky,
  getTableHeaderSticky,
  Hit,
  RefMap,
  Ruler,
  Scroller,
  setRef,
  SlicedProps,
  SplittableProps,
  FooterScrollbar,
  ViewContainer,
  generateClassName,
  computeViewBorderless,
  useHitTarget,
  useLatest,
  useMeasuredState,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import { createEntityId, createGroupId, GenericNode, isEntityGroup } from '../../resource/common/resource-hierarchy'
import { ResourceEntityExpansions } from '../../resource/reducers/resourceEntityExpansions'
import { ScrollerSyncer } from '../../scrollgrid/ScrollerSyncer'
import { getTimelineSlotEl } from '../../timeline/components/util'
import { TimelineDateProfile, TimelineHeaderCellData, isNowInTimelineRange } from '../../timeline/timeline-date-profile'
import { TimelineHeaderRow } from '../../timeline/components/TimelineHeaderRow'
import { TimelineBg } from '../../timeline/components/TimelineBg'
import { TimelineNowIndicatorArrow } from '../../timeline/components/TimelineNowIndicatorArrow'
import { TimelineNowIndicatorLine } from '../../timeline/components/TimelineNowIndicatorLine'
import { TimelineRange } from '../../timeline/TimelineLaneSlicer'
import { TimelineSlats } from '../../timeline/components/TimelineSlats'
import { computeTimelineHitData } from '../../timeline/timeline-positioning'
import { ESTIMATED_SLOT_WIDTH } from '../../timeline/slot-estimate'
import { computeHeights, computeTopsFromHeights, DimConfig, findEntityByCoord } from '@full-ui/headless-grid'
import {
  buildResourceLayouts,
  GroupCellLayout,
  GroupRowLayout,
  ResourceRowLayout,
  RowLayout,
} from '../resource-layout'
import { ColSpec } from '../structs'
import { GroupLane } from './lane/GroupLane'
import { ResourceLane } from './lane/ResourceLane'
import { ResizableTwoCol } from './ResizableTwoCol'
import { BodySection } from './spreadsheet/BodySection'
import { HeaderCells } from './spreadsheet/HeaderCells'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell'
import { computeShift, type ItemPosition, Virtualizer } from '../virtual/virtualizer'
import { syncVirtualizerList } from '../virtual/virtualizer-lists'
import { useWindowScrollTracking } from '../useWindowScrollTracking'
import {
  type EntityScroll,
  type ResourceTimelineGeometry,
  type ResourceTimelineSyncers,
  type ResourceTimelineVirtualizers,
  type TimeScroll,
  useResourceTimelineScroll,
} from '../useResourceTimelineScroll'
import { AriaProxyRows, buildAriaBodyRows, buildAriaCellAttrs, getAriaTableRole } from '../aria'
import { computeResourceTimelineHeaderHeight } from '../header-height'

interface ResourceTimelineLayoutNormalProps {
  className?: string
  labelId: string | undefined
  labelStr: string | undefined

  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  resourceHierarchy: GenericNode[]
  resourceEntityExpansions: ResourceEntityExpansions
  hasNesting: boolean

  nowDate: DateMarker
  nowMs: number // exact instant of nowDate
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  superHeaderRendering: any

  splitProps: { [key: string]: SplittableProps }
  bgSlicedProps: SlicedProps<TimelineRange>
  eventSelection: string | undefined | null // HACK for EventDragging::handlePointerDown

  hasResourceBusinessHours: boolean
  fallbackBusinessHours: EventStore

  slotWidth: number | undefined
  slotLiquid: boolean
  timeCanvasWidth: number | undefined
  spreadsheetColWidths: number[] | undefined
  spreadsheetCanvasWidth: number | undefined
  indentWidth: number | undefined

  spreadsheetClientWidthRef?: Ref<number>
  timeClientWidthRef: Ref<number>
  slotInnerWidthRef: Ref<number>

  // handlers
  onColResize?: (colIndex: number, newWidth: number) => void

  // resource area
  initialSpreadsheetWidthConfig: DimConfig
  spreadsheetResizedWidthConfigRef?: Ref<DimConfig>

  // scroll
  initialScroll?: (TimeScroll & EntityScroll) | null
  scrollRef?: Ref<TimeScroll & EntityScroll>
}

export type { EntityScroll, TimeScroll } from '../useResourceTimelineScroll'

const DEFAULT_OWN_CELL_HEIGHT = 40 // also in useResourceTimelineScroll

/*
The ResourceTimeline layout: a spreadsheet and a time area side by side, each with header, body and
footer scrollers, rows virtualized. Composes:
- useScrollerSyncers-like effects for its three syncers (below)
- useWindowScrollTracking, for height:auto
- useResourceTimelineScroll, the time and entity (resource) scroll, with the scroll slack
- the Virtualizer render-time caches (rows, slots, group columns, header rows)
See planning/phase-7-resource-timeline-plan.md
*/
export const ResourceTimelineLayoutNormal = memo(function ResourceTimelineLayoutNormal(props: ResourceTimelineLayoutNormalProps) {
  const context = useViewContext()

  // true until unmount: children report sizes from their layout effects, which run before this one's
  const isActiveRef = useRef(true)
  const [, setRenderCount] = useState(0)
  const [rerender] = useState(() => () => {
    if (isActiveRef.current) {
      setRenderCount(incrementCounter)
    }
  })

  // measurements
  // (useMeasuredState: see it for why null and repeats are ignored)
  const [spreadsheetBottomScrollbarWidth, setSpreadsheetBottomScrollbarWidth] = useMeasuredState()
  const [timeTotalWidth, setTimeTotalWidth] = useMeasuredState()
  const [timeClientHeight, setTimeClientHeight] = useMeasuredState()
  const [timeClientWidth, setTimeClientWidth] = useMeasuredState()
  const [timeBottomScrollbarWidth, setTimeBottomScrollbarWidth] = useMeasuredState()

  // refs
  const bodyElRef = useRef<HTMLDivElement | null>(null)
  const spreadsheetHeaderScrollerRef = useRef<Scroller | null>(null)
  const spreadsheetBodyScrollerRef = useRef<Scroller | null>(null)
  const spreadsheetFooterScrollerRef = useRef<Scroller | null>(null)
  const timeHeaderScrollerRef = useRef<Scroller | null>(null)
  const timeBodyScrollerRef = useRef<Scroller | null>(null)
  const timeFooterScrollerRef = useRef<Scroller | null>(null)

  // the latest render's geometry, for the handlers and the virtualizers. see ResourceTimelineGeometry
  const geometryRef = useRef<ResourceTimelineGeometry>({
    props,
    bodyLayouts: [],
    bodyTops: new Map(),
    bodyHeights: new Map(),
    maxVScroll: undefined,
    maxHScroll: undefined,
    headerHeight: undefined,
  })
  geometryRef.current = { ...geometryRef.current, props }

  // virtualizers
  const [virtualizerKit] = useState(() => {
    const getEntityTop = (key: string) => geometryRef.current.bodyTops.get(key)
    const getEntityHeight = (key: string) => geometryRef.current.bodyHeights.get(key)
    const getSlotWidth = () => geometryRef.current.props.slotWidth ?? ESTIMATED_SLOT_WIDTH
    const virtualizers: ResourceTimelineVirtualizers = {
      row: new Virtualizer<RowLayout>(
        (rowLayout) => createEntityId(rowLayout.entity),
        getEntityTop,
        getEntityHeight,
        rerender,
      ),
      slot: new Virtualizer<string>(
        (slotKey) => slotKey,
        (_key, index) => index * getSlotWidth(),
        getSlotWidth,
        rerender,
        /* overscan = */ 3,
      ),
      groupCols: [],
      timeHeaders: [],
    }
    const setVirtualizerViewportSize = (height: number) => {
      virtualizers.row.handleViewportSize(height)

      for (const groupColVirtualizer of virtualizers.groupCols) {
        groupColVirtualizer.handleViewportSize(height)
      }
    }
    return { virtualizers, getEntityTop, getEntityHeight, setVirtualizerViewportSize }
  })
  const { virtualizers, getEntityTop, getEntityHeight, setVirtualizerViewportSize } = virtualizerKit

  // the three syncers, created first on each mount, so the scroll finds them
  const [syncers] = useState<ResourceTimelineSyncers>(() => ({ time: null, body: null, spreadsheet: null }))
  useLayoutEffect(() => {
    syncers.time = new ScrollerSyncer(true) // horizontal=true
    syncers.body = new ScrollerSyncer() // horizontal=false
    syncers.spreadsheet = new ScrollerSyncer(true) // horizontal=true

    return () => {
      syncers.time.destroy()
      syncers.body.destroy()
      syncers.spreadsheet.destroy()
    }
  }, [])
  useLayoutEffect(() => { // every commit
    syncers.time.handleChildren([
      timeHeaderScrollerRef.current,
      timeBodyScrollerRef.current,
      timeFooterScrollerRef.current,
    ])
    syncers.body.handleChildren([
      spreadsheetBodyScrollerRef.current,
      timeBodyScrollerRef.current,
    ])
    syncers.spreadsheet.handleChildren([
      spreadsheetHeaderScrollerRef.current,
      spreadsheetBodyScrollerRef.current,
      spreadsheetFooterScrollerRef.current,
    ])
  })

  const windowTracker = useWindowScrollTracking(
    getIsHeightAuto(context.options),
    bodyElRef,
    (entityScroll) => scroll.handleAnyEntityScroll(entityScroll), // `scroll` is defined below
    setVirtualizerViewportSize,
  )

  const scroll = useResourceTimelineScroll({
    geometryRef,
    syncers,
    virtualizers,
    windowTracker,
    rerender,
    initialScroll: props.initialScroll,
    scrollRef: props.scrollRef,
    context,
    timeScrollKeys: [props.dateProfile, props.slotWidth, props.timeCanvasWidth, timeClientWidth],
  })

  // sizing
  const propsRef = useLatest(props)
  const [handlers] = useState(() => {
    let slotInnerWidth: number | undefined

    const handlers = {
      handleSpreadsheetClientWidth(spreadsheetClientWidth: number) {
        if (isActiveRef.current) {
          setRef(propsRef.current.spreadsheetClientWidthRef, spreadsheetClientWidth)
        }
      },
      handleSpreadsheetBottomScrollbarWidth(spreadsheetBottomScrollbarWidth: number) {
        setSpreadsheetBottomScrollbarWidth(spreadsheetBottomScrollbarWidth)
      },
      handleTimeTotalWidth(timeTotalWidth: number) {
        if (isActiveRef.current) {
          setTimeTotalWidth(timeTotalWidth)
        }
      },
      handleTimeClientWidth(timeClientWidth: number) {
        if (isActiveRef.current) {
          setRef(propsRef.current.timeClientWidthRef, timeClientWidth)
          setTimeClientWidth(timeClientWidth)

          virtualizers.slot.handleViewportSize(timeClientWidth)
          for (const timeHeaderVirtualizer of virtualizers.timeHeaders) {
            timeHeaderVirtualizer.handleViewportSize(timeClientWidth)
            // TODO: what about difference in scrollbar width?
          }
        }
      },
      handleTimeClientHeight(timeClientHeight: number) {
        if (isActiveRef.current) {
          setTimeClientHeight(timeClientHeight)

          if (!getIsHeightAuto(context.options)) {
            setVirtualizerViewportSize(timeClientHeight)
          }
        }
      },
      handleTimeBottomScrollbarWidth(timeBottomScrollbarWidth: number) {
        if (isActiveRef.current) {
          setTimeBottomScrollbarWidth(timeBottomScrollbarWidth)
        }
      },
      handleSlotInnerWidths() {
        if (isActiveRef.current) {
          const props = propsRef.current
          const headerSlotInnerWidth = headerRowInnerWidthMap.current.get(props.tDateProfile.cellRows.length - 1)

          if (headerSlotInnerWidth != null && headerSlotInnerWidth !== slotInnerWidth) {
            slotInnerWidth = headerSlotInnerWidth
            setRef(props.slotInnerWidthRef, headerSlotInnerWidth)
          }
        }
      },
      clearSlotInnerWidth() {
        slotInnerWidth = undefined
      },
    }
    const headerRowInnerWidthMap = new RefMap<number, number>(() => { // just for timeline-header
      afterSize(handlers.handleSlotInnerWidths)
    })
    return { ...handlers, headerRowInnerWidthMap }
  })
  const { headerRowInnerWidthMap } = handlers

  // the header rows' and the rows' heights
  const [heightRefMaps] = useState(() => {
    // re-renders only when the header's height changes. a header row reporting its height again (after
    // an <Activity> hide and show, which reports null first) re-adds it with the same height
    const handleHeaderHeights = () => {
      if (isActiveRef.current) {
        const { superHeaderRendering, tDateProfile } = propsRef.current
        const headerHeight = computeResourceTimelineHeaderHeight(
          heightRefMaps.dataGridHeaderRowInnerHeightMap.current,
          heightRefMaps.timelineHeaderRowInnerHeightMap.current,
          Boolean(superHeaderRendering),
          tDateProfile.cellRows.length,
        )

        if (headerHeight !== geometryRef.current.headerHeight) {
          rerender()
        }
      }
    }
    const handleHeaderRowHeightChange = () => {
      if (isActiveRef.current) {
        afterSize(handleHeaderHeights)
      }
    }
    const heightRefMaps = {
      timelineHeaderRowInnerHeightMap: new RefMap<number, number>(handleHeaderRowHeightChange),
      dataGridHeaderRowInnerHeightMap: new RefMap<boolean, number>(handleHeaderRowHeightChange),

    // keyed by createEntityId
    // NOTE: ignoring deletes can cause memory issues if resources constantly change and have new keys
    // refactor in future. FWIW, TanStack Virtual doesn't garbage collect unnused dimensions either
    dataGridEntityInnerHeightMap: new RefMap<string, number>(scroll.handleBodyRowHeightChange, /* ignoreDeletes = */ true),
    timeEntityInnerHeightMap: new RefMap<string, number>(scroll.handleBodyRowHeightChange, /* ignoreDeletes = */ true),
    }
    return heightRefMaps
  })
  const {
    timelineHeaderRowInnerHeightMap,
    dataGridHeaderRowInnerHeightMap,
    dataGridEntityInnerHeightMap,
    timeEntityInnerHeightMap,
  } = heightRefMaps

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      handlers.clearSlotInnerWidth()
    }
  }, [])

  // hits
  useHitTarget(bodyElRef, {
    eventSelection: props.eventSelection,
    prepareHits: scroll.prepareHits,
    queryHit(isRtl, positionLeft, positionTop): Hit | null {
      const { bodyLayouts, bodyTops, bodyHeights } = geometryRef.current
      const { dateProfile, tDateProfile, timeCanvasWidth } = props
      const slotWidth = props.slotWidth ?? ESTIMATED_SLOT_WIDTH
      const { dateEnv } = context

      let coordRes = findEntityByCoord(
        bodyLayouts,
        bodyTops,
        bodyHeights,
        positionTop,
        createEntityId,
      )

      if (coordRes) {
        let [entityAtTop, top, height] = coordRes

        if (!isEntityGroup(entityAtTop)) {
          let resource = entityAtTop
          let bottom = top + height

          const hitData = computeTimelineHitData(positionLeft, timeCanvasWidth, slotWidth, isRtl, tDateProfile, dateEnv)

          if (!hitData) { // in the dead tail of a DST-truncated slot
            return null
          }

          return {
            dateProfile,
            dateSpan: {
              ...hitData.dateSpan,
              resourceId: resource.id,
            },
            rect: {
              ...hitData.rect,
              top,
              bottom,
            },
            getDayEl: () => getTimelineSlotEl(bodyElRef.current, hitData.slatIndex),
            layer: 0,
          }
        }
      }

      return null
    },
  })

  let { dateProfile, hasNesting } = props
  let { options, viewSpec } = context
  const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

  /* date */

  const { tDateProfile } = props
  let { cellRows } = tDateProfile

  /* table settings */

  let allowVerticalScrolling = !getIsHeightAuto(options)
  let tableHeaderSticky = getTableHeaderSticky(options)
  let footerScrollbarSticky = getFooterScrollbarSticky(options)

  const { colSpecs, groupColCnt, superHeaderRendering } = props

  /* table hierarchy */

  const { resourceHierarchy } = props

  const superHeaderRowSpan = superHeaderRendering ? 1 : 0
  const totalHeaderRowSpan = superHeaderRowSpan + 1

  /* table display */

  let {
    layouts: bodyLayouts,
    flatRowLayouts,
    flatGroupColLayouts,
    totalCnt,
  } = useMemo(
    () => buildResourceLayouts(
      resourceHierarchy,
      hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    ),
    [resourceHierarchy, hasNesting, props.resourceEntityExpansions, options.resourcesInitiallyExpanded],
  )

  // the virtualizer lists follow the group columns and header rows (render-time caches, like the
  // virtualizers themselves)
  virtualizers.groupCols = syncVirtualizerList(
    virtualizers.groupCols,
    flatGroupColLayouts.length,
    () => new Virtualizer<GroupCellLayout>(
      (groupCellLayout) => createGroupId(groupCellLayout.entity),
      getEntityTop,
      getEntityHeight,
      rerender,
    ),
    /* isTrimmed = */ true,
  )
  virtualizers.timeHeaders = syncVirtualizerList(
    virtualizers.timeHeaders,
    cellRows.length,
    () => new Virtualizer<TimelineHeaderCellData>(
      (cell) => cell.key,
      undefined, // getItemStart (let Virtualizer compute it)
      (key, index, cell) => cell.colspan * (geometryRef.current.props.slotWidth ?? ESTIMATED_SLOT_WIDTH),
      rerender,
    ),
    /* isTrimmed = */ false,
    // HACK to prepopulate
    (timeHeaderVirtualizer, first) => {
      timeHeaderVirtualizer.viewportSize = first.viewportSize
      timeHeaderVirtualizer.scroll = first.scroll
    },
  )
  const { groupCols: groupColVirtualizers, timeHeaders: timeHeaderVirtualizers } = virtualizers

  // Expansion-filtered rows, including those outside the virtualized viewport.
  // `totalCnt` also includes collapsed descendants; `rowPositions` below is the mounted subset.
  const displayedRowCnt = flatRowLayouts.length

  /* table positions */

  // does not include bottom border between header and body
  const headerHeight = computeResourceTimelineHeaderHeight(
    dataGridHeaderRowInnerHeightMap.current,
    timelineHeaderRowInnerHeightMap.current,
    Boolean(superHeaderRendering),
    tDateProfile.cellRows.length,
  )
  geometryRef.current = { ...geometryRef.current, headerHeight }

  let endScrollbarWidth = (timeTotalWidth != null && timeClientWidth != null)
    ? timeTotalWidth - timeClientWidth
    : undefined

  // totalBodyHeight is the height WITHIN the scrollers
  let [bodyHeights, totalBodyHeight] = computeHeights( // TODO: memoize?
    bodyLayouts,
    createEntityId,
    (entityKey) => { // makes memoization impossible!
      const entitySpreadsheetHeight = dataGridEntityInnerHeightMap.current.get(entityKey) ?? DEFAULT_OWN_CELL_HEIGHT

      // map doesn't contain group-column-cell heights, thus ||0
      // TODO: better use defaultOwnCellHeight
      const entityTimeHeight = timeEntityInnerHeightMap.current.get(entityKey) || 0

      return Math.max(entitySpreadsheetHeight, entityTimeHeight)
    },
    /* minHeight = */ (allowVerticalScrolling && options.expandRows)
      ? timeClientHeight
      : undefined,
  )

  let bodyTops = computeTopsFromHeights(bodyLayouts, createEntityId, bodyHeights, scroll.scrollSlack)
  const prevMaxVScroll = geometryRef.current.maxVScroll
  geometryRef.current = { ...geometryRef.current, bodyLayouts, bodyTops, bodyHeights }

  /* virtualize */

  const virtualizationDisabled = !options.virtualization

  // ensure in-range items are computed with most recent scroll, even tho maybe not applied yet
  // (with the previous render's maxVScroll, as the class did)
  const forcedEntityScroll = scroll.computeEntityScroll({ bodyTops, bodyHeights, maxVScroll: prevMaxVScroll })

  const rowPositions = virtualizers.row.computePositions(flatRowLayouts, virtualizationDisabled, forcedEntityScroll)

  // Keep render loops component-type-specific for future row recycling.
  const groupRowPositions: ItemPosition<GroupRowLayout>[] = []
  const resourceRowPositions: ItemPosition<ResourceRowLayout>[] = []

  for (const rowPosition of rowPositions) {
    if ('resourceFields' in rowPosition.item) {
      resourceRowPositions.push(rowPosition as ItemPosition<ResourceRowLayout>)
    } else {
      groupRowPositions.push(rowPosition as ItemPosition<GroupRowLayout>)
    }
  }

  const groupColPositions = groupColVirtualizers.map((groupColVirtualizer, i) => {
    return groupColVirtualizer.computePositions(flatGroupColLayouts[i], virtualizationDisabled, forcedEntityScroll)
  })

  // Scope deterministic row/column cell IDs to this calendar instance.
  const cellIdPrefix = `${context.baseId}rt`
  const ariaBodyRows = buildAriaBodyRows(
    flatRowLayouts,
    groupColPositions,
    rowPositions,
    groupColCnt,
    colSpecs.length,
  )

  // Only paint vertical fills/lines that are in view
  // Big performance impact for very tall virtualized lists
  // NOTE: could be zero rows and groups!
  const rowPositionShift = computeShift(rowPositions)
  const yFillTop = rowPositionShift?.[0] ?? 0
  const yFillBottom = rowPositionShift?.[1] ?? 0

  let yFillHeight: number

  if (allowVerticalScrolling) {
    yFillHeight = timeClientHeight != null
      ? Math.max(yFillBottom, timeClientHeight) - yFillTop
      : undefined
  } else {
    yFillHeight = yFillBottom - yFillTop
  }

  // Uses the same slot geometry as slotVirtualizer, which is estimated until measured.
  // When the canvas fits without scrolling, scrollTo() is a no-op that fires no scroll event,
  // so an uncapped time-based scroll would linger and the virtualizer would skip the leading
  // slots (#8093)
  const maxHScroll = timeClientWidth != null
    ? Math.max(0, tDateProfile.slotCnt * (props.slotWidth ?? ESTIMATED_SLOT_WIDTH) - timeClientWidth)
    : undefined

  geometryRef.current = { ...geometryRef.current, maxHScroll }
  const forcedTimeScroll = scroll.computeTimeScroll(geometryRef.current)
  const slotDatePositions = virtualizers.slot.computePositions(tDateProfile.slotKeys, virtualizationDisabled, forcedTimeScroll)
  const slotDateShift = computeShift(slotDatePositions)

  /* */

  const { timeCanvasWidth } = props
  const slotWidth = props.slotWidth ?? ESTIMATED_SLOT_WIDTH

  const { spreadsheetColWidths, spreadsheetCanvasWidth } = props

  /* event display */

  const { splitProps, bgSlicedProps } = props

  /* business hour display */

  const { hasResourceBusinessHours, fallbackBusinessHours } = props

  const enableNowIndicator = // TODO: DRY
    options.nowIndicator &&
    isNowInTimelineRange(props.nowDate, props.dateProfile, props.tDateProfile)

  /* filler */

  const spreadsheetBottomFiller = Math.max(
    0,
    (timeBottomScrollbarWidth || 0) -
      (spreadsheetBottomScrollbarWidth || 0),
  )

  const timelineBottomFiller = Math.max(
    0,
    (spreadsheetBottomScrollbarWidth || 0) -
      (timeBottomScrollbarWidth || 0),
  )

  const maxVScroll =
    (allowVerticalScrolling && timeClientHeight != null)
      ? Math.max(0, totalBodyHeight - timeClientHeight)
      : 0
  geometryRef.current = { ...geometryRef.current, maxVScroll }

  const allowBottomFiller =
    !options.expandRows && // if rows expand, then we never need filler
    !maxVScroll // no scrolling possible

  const spreadsheetNeedsBottomFiller = allowBottomFiller || Boolean(spreadsheetBottomFiller)
  const timelineNeedsBottomFiller = allowBottomFiller || Boolean(timelineBottomFiller)

  return (
    <ViewContainer
      viewSpec={viewSpec}
      attrs={{
        role: getAriaTableRole(hasNesting),
        'aria-rowcount': totalHeaderRowSpan + totalCnt,
        'aria-colcount': colSpecs.length + 1,
        'aria-label': props.labelStr,
        'aria-labelledby': props.labelId,
      }}
      className={joinClassNames(
        props.className,
        generateClassName(options.tableClass, {
          borderlessX,
          borderlessTop,
          borderlessBottom,
          multiMonthColumns: 0,
        }),
        classNames.flexCol,
      )}
    >
      <AriaProxyRows
        cellIdPrefix={cellIdPrefix}
        bodyRows={ariaBodyRows}
        resourceColCnt={colSpecs.length}
        superHeaderRowSpan={superHeaderRowSpan}
        hasNesting={hasNesting}
      />
      <ResizableTwoCol
        initialStartWidthConfig={props.initialSpreadsheetWidthConfig}
        resizedWidthConfigRef={props.spreadsheetResizedWidthConfigRef}
        className={allowVerticalScrolling ? classNames.liquid : ''}

        /* spreadsheet
        --------------------------------------------------------------------------------- */

        startClassName={joinClassNames(classNames.flexCol, classNames.isolate)}
        startContent={
          <>

            {/* spreadsheet HEADER
            ---------------------------------------------------------------------------- */}
            <div
              role="presentation"
              className={joinClassNames(
                generateClassName(options.tableHeaderClass, {
                  isSticky: tableHeaderSticky,
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: 0,
                }),
                classNames.flexCol,
                tableHeaderSticky && classNames.tableHeaderSticky,
                classNames.z1,
              )}
            >
              <div
                className={joinClassNames(
                  classNames.flexCol,
                  classNames.contentBox,
                )}
                style={{
                  height: headerHeight,
                }}
              >
                {Boolean(superHeaderRendering) && (
                  <div
                    role="presentation"
                    className={joinClassNames(
                      options.resourceHeaderRowClass,
                      classNames.flexRow,
                      classNames.grow,
                      classNames.borderlessX,
                      classNames.borderlessTop,
                    )}
                  >
                    <SuperHeaderCell
                      cellIdPrefix={cellIdPrefix}
                      cellRowIndex={1}
                      cellColIndex={0}
                      renderHooks={superHeaderRendering}
                      indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                      innerHeightRef={dataGridHeaderRowInnerHeightMap.createRef(true)}
                      colSpan={colSpecs.length}
                      indentWidth={props.indentWidth}
                    />
                  </div>
                )}
                <Scroller
                  horizontal
                  hideScrollbars
                  className={joinClassNames(classNames.flexCol, classNames.grow)}
                  ref={spreadsheetHeaderScrollerRef}
                >
                  <div
                    className={joinClassNames(classNames.flexCol, classNames.grow)}
                    style={{ minWidth: spreadsheetCanvasWidth }}
                  >
                    <div
                      role="presentation"
                      className={joinClassNames(
                        options.resourceHeaderRowClass,
                        classNames.flexRow,
                        classNames.grow,
                        classNames.borderless,
                      )}
                    >
                      <HeaderCells
                        colSpecs={colSpecs}
                        colWidths={spreadsheetColWidths}
                        indent={hasNesting}
                        indentWidth={props.indentWidth}
                        rowIndex={superHeaderRowSpan}
                        cellIdPrefix={cellIdPrefix}

                        // refs
                        innerHeightRef={dataGridHeaderRowInnerHeightMap.createRef(false)}
                        onColResize={props.onColResize}
                      />
                    </div>
                  </div>
                </Scroller>
              </div>
              <div
                className={generateClassName(options.slotHeaderDividerClass, {
                  inTableHeader: true,
                  options: { dayMinWidth: options.dayMinWidth },
                })}
              />
            </div>

            {/* spreadsheet BODY
            ---------------------------------------------------------------------------- */}
            <Scroller
              vertical={allowVerticalScrolling}
              horizontal
              hideScrollbars
              className={joinClassNames(
                generateClassName(options.tableBodyClass, {
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: 0,
                }),
                classNames.flexCol,
                classNames.rel, // for Ruler.fillStart
                allowVerticalScrolling && classNames.liquid,
                classNames.z0,
              )}
              ref={spreadsheetBodyScrollerRef}
              clientWidthRef={handlers.handleSpreadsheetClientWidth}
            >
              <BodySection
                cellIdPrefix={cellIdPrefix}
                inTreeGrid={hasNesting}
                groupRowPositions={groupRowPositions}
                resourceRowPositions={resourceRowPositions}
                groupColPositions={groupColPositions}
                displayedRowCnt={displayedRowCnt}
                groupCellCnts={flatGroupColLayouts.map((flatGroupCellLayouts) => flatGroupCellLayouts.length)}
                colWidths={spreadsheetColWidths}
                colSpecs={colSpecs}
                rowInnerHeightRefMap={dataGridEntityInnerHeightMap}
                headerRowSpan={totalHeaderRowSpan}
                indentWidth={props.indentWidth}
                canvasWidth={spreadsheetCanvasWidth}
                canvasHeight={totalBodyHeight}
              />
              {spreadsheetNeedsBottomFiller && (
                <div
                  className={joinClassNames(
                    generateClassName(options.fillerClass, { inTableHeader: false }),
                    classNames.borderlessX,
                    classNames.borderlessBottom,
                  )}
                  style={{ minHeight: spreadsheetBottomFiller }}
                />
              )}
            </Scroller>

            {/* spreadsheet FOOTER scrollbar
            ----------------------------------------------------------------------------
            Not just for footerScrollbarSticky:true,
            also just for normal horizontal scrolling,
            because we need to hide the vertical scrollbar, but can't solely show the horizontal one
            */}
            <FooterScrollbar
              isSticky={footerScrollbarSticky}
              canvasWidth={spreadsheetCanvasWidth}
              scrollerRef={spreadsheetFooterScrollerRef}
              scrollbarWidthRef={handlers.handleSpreadsheetBottomScrollbarWidth}
            />
          </>
        }

        /* time-area (TODO: try to make this DRY-er with TimelineView???)
        --------------------------------------------------------------------------------- */

        endClassName={joinClassNames(classNames.flexCol, classNames.isolate)}
        endContent={
          <>

            {/* time-area HEADER
            ---------------------------------------------------------------------------- */}
            <div
              className={joinClassNames(
                generateClassName(options.tableHeaderClass, {
                  isSticky: tableHeaderSticky,
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: 0,
                }),
                classNames.flexCol,
                tableHeaderSticky && classNames.tableHeaderSticky,
                classNames.z1,
              )}
            >
              <Scroller
                ref={timeHeaderScrollerRef}
                horizontal
                hideScrollbars
                className={joinClassNames(
                  classNames.flexRow,
                  classNames.contentBox,
                )}
                style={{
                  height: headerHeight,
                }}
              >
                {/* for screen reader users. zero-height */}
                <div role="presentation">
                  <div
                    {...buildAriaCellAttrs({
                      cellIdPrefix,
                      cellRowIndex: 1,
                      cellColIndex: colSpecs.length,
                    })}
                    role="columnheader"
                    aria-rowspan={totalHeaderRowSpan}
                    className={classNames.srOnly}
                  >
                    {options.eventsHint}
                  </div>
                </div>

                {/* for sighted users */}
                <div // the canvas
                  aria-hidden
                  className={joinClassNames( // TODO: DRY
                    classNames.rel, // origin for now-indicator
                    classNames.flexCol,
                    timeCanvasWidth == null && classNames.liquid,

                    // slotLiquid:true implies that slots are expanding bigger than their min,
                    // and that there are NOT any horizontal scrollbars. if so, then no worries
                    // about sticky-event-titles. if so, we're able to apply cropping to prevent
                    // event hover-resizers and whatnot from bleeding out of the canvas and causing
                    // horizontal scrollbars when there normally wouldn't be any
                    props.slotLiquid && classNames.crop,
                  )}
                  style={{ minWidth: timeCanvasWidth }}
                >
                  {cellRows.map((cells, rowIndex) => {
                    const rowLevel = cellRows.length - rowIndex - 1

                    const headerCellPositions = timeHeaderVirtualizers[rowIndex].computePositions(cells, virtualizationDisabled, forcedTimeScroll)
                    const shift = computeShift(headerCellPositions)
                    if (shift) {
                      timeHeaderVirtualizers[rowIndex].computePositions(cells, virtualizationDisabled, forcedTimeScroll)
                    }

                    return (
                      <TimelineHeaderRow
                        key={rowIndex}
                        className={joinClassNames(classNames.rel, classNames.grow)}
                        dateProfile={props.dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={props.nowDate}
                        nowMs={props.nowMs}
                        todayRange={props.todayRange}
                        rowLevel={rowLevel}
                        cells={cells}
                        slotWidth={slotWidth}
                        innerWidthRef={headerRowInnerWidthMap.createRef(rowIndex)}
                        innerHeighRef={timelineHeaderRowInnerHeightMap.createRef(rowIndex)}
                        insetInlineStart={shift && shift[0]}
                        width={shift ? (shift[1] - shift[0]) : undefined}
                        cellStartIndex={shift && shift[2]}
                        cellCount={headerCellPositions.length}
                      />
                    )
                  })}
                  {enableNowIndicator && (
                    // TODO: make this positioned WITHIN padding
                    <TimelineNowIndicatorArrow
                      tDateProfile={tDateProfile}
                      nowMs={props.nowMs}
                      slotWidth={slotWidth}
                    />
                  )}
                </div>

                {Boolean(endScrollbarWidth) && (
                  <div
                    className={joinClassNames(
                      generateClassName(options.fillerClass, { inTableHeader: true }),
                      classNames.borderlessY,
                      classNames.borderlessEnd,
                    )}
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </Scroller>
              <div
                className={generateClassName(options.slotHeaderDividerClass, {
                  inTableHeader: false,
                  options: { dayMinWidth: options.dayMinWidth },
                })}
              />
            </div>

            {/* time-area BODY (w/ events)
            ---------------------------------------------------------------------------- */}
            <Scroller
              vertical={
                allowVerticalScrolling &&
                // infer whether scrolling would happen. prevents clientHeight thrashing due to horizontal scrollbars
                (totalBodyHeight != null && timeClientHeight != null && totalBodyHeight > timeClientHeight)
              }
              horizontal
              hideScrollbars={footerScrollbarSticky /* FYI, this view is never print */}
              className={joinClassNames(
                generateClassName(options.tableBodyClass, {
                  borderlessX,
                  borderlessTop,
                  borderlessBottom,
                  multiMonthColumns: 0,
                }),
                classNames.flexCol,
                classNames.rel, // for Ruler.fillStart
                allowVerticalScrolling && classNames.liquid,
                classNames.z0,
              )}
              ref={timeBodyScrollerRef}
              clientWidthRef={handlers.handleTimeClientWidth}
              clientHeightRef={
                allowVerticalScrolling
                  ? handlers.handleTimeClientHeight
                  : undefined // for when height:auto, which will have dynamic height and needlessly fire ResizeObserver
              }
              bottomScrollbarWidthRef={
                allowVerticalScrolling
                  ? handlers.handleTimeBottomScrollbarWidth
                  : undefined // for when height:auto, which will have dynamic height and needlessly fire ResizeObserver
              }
            >
              <div // canvas that expands to height of scroller (at least)
                className={joinClassNames(
                  classNames.rel, // origin for canvas?
                  classNames.grow,
                  classNames.flexCol,

                  // slotLiquid:true implies that slots are expanding bigger than their min,
                  // and that there are NOT any horizontal scrollbars. if so, then no worries
                  // about sticky-event-titles. if so, we're able to apply cropping to prevent
                  // event hover-resizers and whatnot from bleeding out of the canvas and causing
                  // horizontal scrollbars when there normally wouldn't be any
                  props.slotLiquid && classNames.crop,
                )}
                style={{
                  minWidth: timeCanvasWidth,
                  minHeight: totalBodyHeight,
                }}
                ref={bodyElRef}
              >
                <div
                  // roving-origin for anything that fills y-axis,
                  // like slots or non-resource bg events
                  // is ZERO-width, but has defined top/bottom
                  className={classNames.abs}
                  style={{
                    top: yFillTop,
                    height: yFillHeight,
                    bottom: yFillHeight == null ? 0 : undefined,
                    insetInlineStart: slotDateShift?.[0],
                  }}
                >
                  <TimelineSlats
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={props.nowDate}
                    nowMs={props.nowMs}
                    todayRange={props.todayRange}
                    slatStartIndex={slotDateShift?.[2]}
                    slatCount={slotDatePositions.length}
                    slotWidth={slotWidth}
                  />
                  <TimelineBg
                    tDateProfile={tDateProfile}
                    nowDate={props.nowDate}
                    nowMs={props.nowMs}
                    todayRange={props.todayRange}

                    // content
                    bgEventSegs={bgSlicedProps.bgEventSegs}
                    businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                    dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                    eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs : null)}

                    // dimensions
                    slotWidth={props.slotWidth}

                    // virtualization
                    clipStart={slotDateShift?.[0]}
                    clipEnd={slotDateShift?.[1]}
                  />
                  {enableNowIndicator && (
                    <TimelineNowIndicatorLine
                      tDateProfile={tDateProfile}
                      nowMs={props.nowMs}
                      slotWidth={slotWidth}
                      clipStart={slotDateShift?.[0]}
                    />
                  )}
                </div>
                <div
                  // roving-origin for all types of resource(-group)-rows
                  // is ZERO-height, always fixed to top, but has definet x-coordinate and width
                  role="presentation"
                  className={classNames.abs}
                  style={{
                    top: 0,
                    insetInlineStart: slotDateShift?.[0],
                    width: slotDateShift ? (slotDateShift[1] - slotDateShift[0]) : undefined,
                  }}
                >
                  {groupRowPositions.map((rowPosition) => {
                    const rowLayout = rowPosition.item
                    const group = rowLayout.entity
                    const groupKey = rowPosition.key

                    return (
                      <div
                        key={groupKey}
                        role="presentation"
                        className={joinClassNames(
                          classNames.fillX,
                          classNames.flexRow,
                        )}
                        style={{
                          top: rowPosition.start,
                        }}
                      >
                        <GroupLane
                          cellIdPrefix={cellIdPrefix}
                          inTreeGrid={hasNesting}
                          cellRowIndex={1 + totalHeaderRowSpan + rowLayout.rowIndex}
                          cellColIndex={colSpecs.length}
                          group={group}
                          borderBottom={rowLayout.visibleIndex < displayedRowCnt - 1}
                          innerHeightRef={timeEntityInnerHeightMap.createRef(groupKey)}
                          height={rowPosition.size}
                        />
                      </div>
                    )
                  })}

                  {resourceRowPositions.map((rowPosition) => {
                    const resourceLayout = rowPosition.item
                    const resource = resourceLayout.entity

                    return (
                      <ResourceLane
                        {...splitProps[resource.id]}
                        key={resource.id /* TODO: use rowPosition.key? */}
                        role="presentation"
                        cellIdPrefix={cellIdPrefix}
                        inTreeGrid={hasNesting}
                        cellRowIndex={1 + totalHeaderRowSpan + resourceLayout.rowIndex}
                        cellColIndex={colSpecs.length}
                        className={classNames.fillX}
                        resource={resource}
                        dateProfile={dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={props.nowDate}
                        nowMs={props.nowMs}
                        todayRange={props.todayRange}
                        businessHours={resource.businessHours || fallbackBusinessHours}
                        borderBottom={resourceLayout.visibleIndex < displayedRowCnt - 1}

                        // ref
                        heightRef={timeEntityInnerHeightMap.createRef(resource.id)}

                        // dimensions
                        slotWidth={props.slotWidth}

                        // position
                        top={rowPosition.start}
                        height={rowPosition.size}

                        // virtualization
                        clipStart={slotDateShift?.[0]}
                        clipEnd={slotDateShift?.[1]}
                      />
                    )
                  })}
                </div>
                {timelineNeedsBottomFiller && (
                  <div
                    className={joinClassNames(
                      generateClassName(options.fillerClass, { inTableHeader: false }),
                      classNames.borderlessX,
                      classNames.borderlessBottom,
                      classNames.fillX,
                    )}
                    style={{
                      top: yFillBottom,
                      minHeight: timelineBottomFiller,
                    }}
                  />
                )}
              </div>
            </Scroller>

            {/* time-area FOOTER
            ---------------------------------------------------------------------------- */}
            {Boolean(footerScrollbarSticky) && (
              <FooterScrollbar
                isSticky
                canvasWidth={timeCanvasWidth}
                scrollbarWidthRef={handlers.handleTimeBottomScrollbarWidth}
                scrollerRef={timeFooterScrollerRef}
              />
            )}

            <Ruler widthRef={handlers.handleTimeTotalWidth} />
          </>
        }
      />
    </ViewContainer>
  )
})

function incrementCounter(n: number): number {
  return n + 1
}
