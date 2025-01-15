import { CssDimValue, Duration } from '@fullcalendar/core'
import {
  afterSize,
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
  getIsHeightAuto,
  getStickyFooterScrollbar,
  getStickyHeaderDates,
  Hit,
  joinClassNames,
  memoize,
  multiplyDuration,
  rangeContainsMarker,
  RefMap,
  Ruler,
  Scroller,
  ScrollerSyncerInterface,
  setRef,
  SlicedProps,
  SplittableProps,
  StickyFooterScrollbar,
  ViewContainer
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment, Ref } from '@fullcalendar/core/preact'
import {
  ColSpec,
  createEntityId,
  createGroupId,
  GenericNode,
  Group,
  isEntityGroup,
  Resource,
  ResourceEntityExpansions
} from '@fullcalendar/resource/internal'
import { ScrollerSyncer } from '@fullcalendar/scrollgrid/internal'
import {
  getTimelineSlotEl,
  TimelineDateProfile,
  TimelineHeaderRow,
  TimelineLaneBg,
  TimelineNowIndicatorArrow,
  TimelineNowIndicatorLine,
  TimelineRange,
  TimelineSlats,
  timeToCoord
} from '@fullcalendar/timeline/internal'
import { buildResourceLayouts, GenericLayout } from '../resource-layout.js'
import {
  computeHeights,
  computeTopsFromHeights,
  findEntityByCoord,
  ROW_BORDER_WIDTH,
} from '../resource-positioning.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import { BodySection } from './spreadsheet/BodySection.js'
import { HeaderRow } from './spreadsheet/HeaderRow.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'

interface ResourceTimelineLayoutNormalProps {
  labelId: string | undefined
  labelStr: string | undefined

  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  resourceHierarchy: GenericNode[]
  resourceEntityExpansions: ResourceEntityExpansions
  hasNesting: boolean

  nowDate: DateMarker
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  superHeaderRendering: any

  splitProps: { [key: string]: SplittableProps }
  bgSlicedProps: SlicedProps<TimelineRange>

  hasResourceBusinessHours: boolean
  fallbackBusinessHours: EventStore

  slotWidth: number | undefined
  timeCanvasWidth: number | undefined
  spreadsheetColWidths: number[] | undefined
  spreadsheetCanvasWidth: number | undefined

  spreadsheetClientWidthRef?: Ref<number>
  timeClientWidthRef: Ref<number>
  slotInnerWidthRef: Ref<number>

  // handlers
  onColResize?: (colIndex: number, newWidth: number) => void

  // resource area
  initialSpreadsheetWidth?: CssDimValue
  spreadsheetWidthRef?: Ref<CssDimValue>

  // scroll
  initialScroll?: TimeScroll & EntityScroll
  scrollRef?: Ref<TimeScroll & EntityScroll> // NOTE: only an object allowed
}

export interface EntityScroll {
  entityId?: string
  fromBottom?: number
}

export interface TimeScroll {
  time?: Duration
  x?: number
}

interface ResourceTimelineViewState {
  totalHeight?: number

  spreadsheetClientHeight?: number
  timeClientHeight?: number

  timeTotalWidth?: number
  timeClientWidth?: number

  timeStickyScrollbarWidth?: number
}

export class ResourceTimelineLayoutNormal extends DateComponent<ResourceTimelineLayoutNormalProps, ResourceTimelineViewState> {
  // memoized
  private buildResourceLayouts = memoize(buildResourceLayouts)

  // TODO: make this nice
  // This is a means to recompute row positioning when *HeightMaps change
  private queuedHeightChange = false
  handleHeightChange = () => {
    this.queuedHeightChange = true
    afterSize(this.handleHeightChangeXXX)
  }
  handleHeightChangeXXX = () => {
    this.forceUpdate()
  }

  // refs
  private bodyEl: HTMLElement
  private spreadsheetHeaderScrollerRef = createRef<Scroller>()
  private spreadsheetBodyScrollerRef = createRef<Scroller>()
  private spreadsheetFooterScrollerRef = createRef<Scroller>()
  private timeHeaderScrollerRef = createRef<Scroller>()
  private timeBodyScrollerRef = createRef<Scroller>()
  private timeFooterScrollerRef = createRef<Scroller>()
  private headerRowInnerWidthMap = new RefMap<number, number>(() => { // just for timeline-header
    afterSize(this.handleSlotInnerWidths)
  })
  private timelineHeaderRowInnerHeightMap = new RefMap<number, number>(this.handleHeightChange)
  private dataGridHeaderRowInnerHeightMap = new RefMap<boolean, number>(this.handleHeightChange)
  private dataGridEntityInnerHeightMap = new RefMap<string, number>(this.handleHeightChange) // keyed by createEntityId
  private timeEntityInnerHeightMap = new RefMap<string, number>(this.handleHeightChange) // keyed by createEntityId
  private bodyLayouts: GenericLayout<Resource | Group>[]
  private bodyTops?: Map<string, number> // keyed by createEntityId
  private bodyHeights?: Map<string, number> // keyed by createEntityId

  // internal
  private bodySlotInnerWidth?: number
  private slotInnerWidth?: number
  private timeScroller: ScrollerSyncerInterface
  private bodyScroller: ScrollerSyncerInterface
  private spreadsheetScroller: ScrollerSyncerInterface
  private scroll: EntityScroll & TimeScroll = {} // updated in-place

  render() {
    let { props, state, context } = this
    let { dateProfile, hasNesting } = props
    let { options, viewSpec } = context
    let { timeTotalWidth, timeClientWidth, timeClientHeight, spreadsheetClientHeight, totalHeight } = state

    /* date */

    const { tDateProfile } = props
    let { cellRows } = tDateProfile

    /* table settings */

    let verticalScrolling = !getIsHeightAuto(options)
    let stickyHeaderDates = getStickyHeaderDates(options)
    let stickyFooterScrollbar = getStickyFooterScrollbar(options)

    const { colSpecs, groupColCnt, superHeaderRendering } = props

    /* table hierarchy */

    const { resourceHierarchy } = props

    const superHeaderRowSpan = superHeaderRendering ? 1 : 0
    const totalHeaderRowSpan = superHeaderRowSpan + 1

    /* table display */

    let {
      layouts: bodyLayouts,
      flatResourceLayouts,
      flatGroupRowLayouts,
      flatGroupColLayouts,
      totalCnt,
    } = this.buildResourceLayouts(
      resourceHierarchy,
      hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.bodyLayouts = bodyLayouts

    // TODO: less-weird way to get this! more DRY with BodySection
    const groupRowCnt = flatGroupRowLayouts.length
    const resourceCnt = flatResourceLayouts.length
    const visibleRowCnt = groupRowCnt + resourceCnt

    /* table positions */

    // does not include bottom border between header and body
    const headerHeight = computeHeaderHeight(
      this.dataGridHeaderRowInnerHeightMap.current,
      this.timelineHeaderRowInnerHeightMap.current,
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    // height of the scrollers
    // current DOM might not be rendering this yet,
    // thus, if doing math, ensure does result in negative value
    let totalBodyOuterHeight = (totalHeight != null && headerHeight != null)
      ? totalHeight - (headerHeight + ROW_BORDER_WIDTH)
      : undefined

    let endScrollbarWidth = (timeTotalWidth != null && timeClientWidth != null)
      ? timeTotalWidth - timeClientWidth
      : undefined

    let timeBottomScrollbarWidth = state.timeStickyScrollbarWidth != null
      ? state.timeStickyScrollbarWidth
      : (totalBodyOuterHeight != null && timeClientHeight != null)
        ? Math.max(0, totalBodyOuterHeight - timeClientHeight)
        : undefined

    let spreadsheetBottomScrollbarWidth = (totalBodyOuterHeight != null && spreadsheetClientHeight != null)
      ? Math.max(0, totalBodyOuterHeight - spreadsheetClientHeight)
      : undefined

    // totalBodyHeight is the height WITHIN the scrollers
    let [bodyHeights, totalBodyHeight] = computeHeights( // TODO: memoize?
      bodyLayouts,
      createEntityId,
      (entityKey) => { // makes memoization impossible!
        const entitySpreadsheetHeight = this.dataGridEntityInnerHeightMap.current.get(entityKey)
        if (entitySpreadsheetHeight != null) {
          return Math.max(
            entitySpreadsheetHeight,
            // map doesn't contain group-column-cell heights
            this.timeEntityInnerHeightMap.current.get(entityKey) || 0,
          )
        }
      },
      /* minHeight = */ (verticalScrolling && options.expandRows)
        ? timeClientHeight
        : undefined,
    )
    let bodyTops = computeTopsFromHeights(bodyLayouts, createEntityId, bodyHeights)
    this.bodyHeights = bodyHeights
    this.bodyTops = bodyTops

    const { timeCanvasWidth, slotWidth } = props

    const { spreadsheetColWidths, spreadsheetCanvasWidth } = props

    /* event display */

    const { splitProps, bgSlicedProps } = props

    /* business hour display */

    const { hasResourceBusinessHours, fallbackBusinessHours } = props

    const enableNowIndicator = // TODO: DRY
      options.nowIndicator &&
      slotWidth != null &&
      rangeContainsMarker(props.dateProfile.currentRange, props.nowDate)

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

    const rowsAreExpanding = verticalScrolling && !options.expandRows &&
      timeClientHeight != null && timeClientHeight > totalBodyHeight

    const spreadsheetNeedsBottomFiller = rowsAreExpanding || Boolean(spreadsheetBottomFiller)
    const timelineNeedsBottomFiller = rowsAreExpanding || Boolean(timelineBottomFiller)

    return (
      <ViewContainer
        className='fc-resource-timeline fc-flex-col fc-border'
        viewSpec={viewSpec}
        attrs={{
          role: hasNesting ? 'treegrid' : 'grid', // TODO: DRY
          'aria-rowcount': totalHeaderRowSpan + totalCnt,
          'aria-label': props.labelStr,
          'aria-labelledby': props.labelId,
        }}
      >
        <ResizableTwoCol
          initialStartWidth={props.initialSpreadsheetWidth}
          startWidthRef={props.spreadsheetWidthRef} // is a CssDim value for storage
          className={verticalScrolling ? 'fc-liquid' : ''}

          /* spreadsheet
          --------------------------------------------------------------------------------- */

          startClassName='fc-flex-col'
          startContent={
            <Fragment>

              {/* spreadsheet HEADER
              ---------------------------------------------------------------------------- */}
              <div
                role='rowgroup'
                className={joinClassNames(
                  'fc-datagrid-header fc-flex-col fc-content-box fc-border-b',
                  stickyHeaderDates && 'fc-table-header-sticky',
                )}
                style={{
                  height: headerHeight,
                }}
              >
                {Boolean(superHeaderRendering) && (
                  <div
                    role="row"
                    aria-rowindex={1}
                    className="fc-flex-row fc-grow fc-border-b"
                  >
                    <SuperHeaderCell
                      renderHooks={superHeaderRendering}
                      indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                      innerHeightRef={this.dataGridHeaderRowInnerHeightMap.createRef(true)}
                      colSpan={colSpecs.length}
                    />
                  </div>
                )}
                <Scroller
                  horizontal
                  hideScrollbars
                  className='fc-flex-col fc-grow'
                  ref={this.spreadsheetHeaderScrollerRef}
                >
                  <div className='fc-flex-col fc-grow' style={{ minWidth: spreadsheetCanvasWidth }}>
                    <HeaderRow
                      colSpecs={colSpecs}
                      colWidths={spreadsheetColWidths}
                      indent={hasNesting}
                      rowIndex={superHeaderRowSpan}

                      // refs
                      innerHeightRef={this.dataGridHeaderRowInnerHeightMap.createRef(false)}
                      onColResize={props.onColResize}
                    />
                  </div>
                </Scroller>
              </div>

              {/* spreadsheet BODY
              ---------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars
                className={joinClassNames(
                  'fc-datagrid-body fc-flex-col fc-rel', // fc-rel needed for Ruler.fc-fill-start
                  verticalScrolling && 'fc-liquid',
                )}
                ref={this.spreadsheetBodyScrollerRef}
              >
                <div
                  className='fc-rel fc-grow fc-flex-col'
                  style={{
                    minWidth: spreadsheetCanvasWidth,
                    paddingTop: totalBodyHeight, // to push down filler div at end, and give height
                  }}
                >
                  <BodySection
                    flatResourceLayouts={flatResourceLayouts}
                    flatGroupRowLayouts={flatGroupRowLayouts}
                    flatGroupColLayouts={flatGroupColLayouts}
                    colWidths={spreadsheetColWidths}
                    colSpecs={colSpecs}
                    rowInnerHeightRefMap={this.dataGridEntityInnerHeightMap}
                    rowTops={bodyTops}
                    rowHeights={bodyHeights}
                    headerRowSpan={totalHeaderRowSpan}
                    hasNesting={hasNesting}
                  />
                  {spreadsheetNeedsBottomFiller && (
                    <div
                      className='fc-border-t fc-filler'
                      style={{ minHeight: spreadsheetBottomFiller }}
                    />
                  )}
                </div>
                <Ruler heightRef={this.handleSpreadsheetClientHeight} className='fc-fill-start' />
              </Scroller>

              {/* spreadsheet FOOTER scrollbar
              ---------------------------------------------------------------------------- */}
              {Boolean(stickyFooterScrollbar) && (
                <StickyFooterScrollbar
                  canvasWidth={spreadsheetCanvasWidth}
                  scrollerRef={this.spreadsheetFooterScrollerRef}
                  scrollbarWidthRef={this.handleTimeStickyScrollbarWidth}
                />
              )}

              <Ruler widthRef={this.handleSpreadsheetClientWidth} />
            </Fragment>
          }

          /* time-area (TODO: try to make this DRY-er with TimelineView???)
          --------------------------------------------------------------------------------- */

          endClassName='fc-flex-col'
          endContent={
            <Fragment>

              {/* time-area HEADER
              ---------------------------------------------------------------------------- */}
              <Scroller
                ref={this.timeHeaderScrollerRef}
                horizontal
                hideScrollbars
                className={joinClassNames(
                  'fc-timeline-header fc-flex-row fc-content-box fc-border-b',
                  stickyHeaderDates && 'fc-table-header-sticky',
                )}
                style={{
                  height: headerHeight,
                }}
              >
                {/* for screen reader users. zero-height */}
                <div role='row' aria-rowindex={1}>
                  <div
                    role='columnheader'
                    aria-rowspan={totalHeaderRowSpan}
                    aria-label={options.eventsHint}
                  />
                </div>

                {/* for sighted users */}
                <div // the canvas
                  aria-hidden
                  className={joinClassNames( // TODO: DRY
                    'fc-flex-col fc-rel', // origin for now-indicator
                    timeCanvasWidth == null && 'fc-liquid',
                  )}
                  style={{ width: timeCanvasWidth }}
                >
                  {cellRows.map((cells, rowLevel) => {
                    const isLast = rowLevel === cellRows.length - 1
                    return (
                      <TimelineHeaderRow
                        key={rowLevel}
                        dateProfile={props.dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={props.nowDate}
                        todayRange={props.todayRange}
                        rowLevel={rowLevel}
                        isLastRow={isLast}
                        cells={cells}
                        slotWidth={slotWidth}
                        innerWidthRef={this.headerRowInnerWidthMap.createRef(rowLevel)}
                        innerHeighRef={this.timelineHeaderRowInnerHeightMap.createRef(rowLevel)}
                      />
                    )
                  })}
                  {enableNowIndicator && (
                    // TODO: make this positioned WITHIN padding
                    <TimelineNowIndicatorArrow
                      tDateProfile={tDateProfile}
                      nowDate={props.nowDate}
                      slotWidth={slotWidth}
                    />
                  )}
                </div>

                {Boolean(endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: endScrollbarWidth }}
                  />
                )}
              </Scroller>

              {/* time-area BODY (w/ events)
              ---------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars={stickyFooterScrollbar /* FYI, this view is never print */}
                className={joinClassNames(
                  'fc-timeline-body fc-flex-col fc-rel', // fc-rel for Ruler.fc-fill-start
                  verticalScrolling && 'fc-liquid',
                )}
                ref={this.timeBodyScrollerRef}
              >
                <div
                  className='fc-rel fc-grow fc-flex-col'
                  style={{ width: timeCanvasWidth }}
                  ref={this.handleBodyEl}
                >
                  <div className='fc-fill'>
                    <TimelineSlats
                      dateProfile={dateProfile}
                      tDateProfile={tDateProfile}
                      nowDate={props.nowDate}
                      todayRange={props.todayRange}

                      // ref
                      innerWidthRef={this.handleBodySlotInnerWidth}

                      // dimensions
                      slotWidth={slotWidth}
                    />
                    <TimelineLaneBg
                      tDateProfile={tDateProfile}
                      nowDate={props.nowDate}
                      todayRange={props.todayRange}

                      // content
                      bgEventSegs={bgSlicedProps.bgEventSegs}
                      businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                      dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                      // empty array will result in unnecessary rerenders?...
                      eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs : [])}

                      // dimensions
                      slotWidth={slotWidth}
                    />
                    {enableNowIndicator && (
                      <TimelineNowIndicatorLine
                        tDateProfile={tDateProfile}
                        nowDate={props.nowDate}
                        slotWidth={slotWidth}
                      />
                    )}
                  </div>
                  <div
                    role='rowgroup'
                    className='fc-rel'
                    style={{ height: totalBodyHeight }}
                  >
                    {/* group rows */}
                    {flatGroupRowLayouts.map((groupRowLayout) => {
                      const group = groupRowLayout.entity
                      const groupKey = createGroupId(group)
                      return (
                        <div
                          key={groupKey}
                          role='row'
                          aria-rowindex={1 + totalHeaderRowSpan + groupRowLayout.rowIndex}
                          aria-level={hasNesting ? 1 + groupRowLayout.rowDepth : undefined}
                          aria-expanded={groupRowLayout.isExpanded}
                          class={joinClassNames(
                            'fc-flex-row fc-fill-x fc-content-box',
                            groupRowLayout.visibleIndex < visibleRowCnt - 1 && // is not last
                              'fc-border-b',
                          )}
                          style={{
                            top: bodyTops.get(groupKey),
                            height: bodyHeights.get(groupKey),
                          }}
                        >
                          <GroupLane
                            group={group}
                            innerHeightRef={this.timeEntityInnerHeightMap.createRef(groupKey)}
                          />
                        </div>
                      )
                    })}

                    {/* resource-specific cells */}
                    {flatResourceLayouts.map((resourceLayout) => {
                      const resource = resourceLayout.entity
                      return (
                        <div
                          key={resource.id}
                          role='row'
                          aria-rowindex={1 + totalHeaderRowSpan + resourceLayout.rowIndex}
                          aria-level={hasNesting ? 1 + resourceLayout.rowDepth : undefined}
                          aria-expanded={resourceLayout.hasChildren ? resourceLayout.isExpanded : undefined}
                          data-resource-id={resource.id}
                          className={joinClassNames(
                            'fc-resource fc-flex-col fc-fill-x fc-content-box',
                            resourceLayout.visibleIndex < visibleRowCnt - 1 && // is not last
                              'fc-border-b',
                          )}
                          style={{
                            top: bodyTops.get(resource.id),
                            height: bodyHeights.get(resource.id),
                          }}
                        >
                          <ResourceLane
                            {...splitProps[resource.id]}
                            resource={resource}
                            dateProfile={dateProfile}
                            tDateProfile={tDateProfile}
                            nowDate={props.nowDate}
                            todayRange={props.todayRange}
                            nextDayThreshold={context.options.nextDayThreshold}
                            businessHours={resource.businessHours || fallbackBusinessHours}

                            // ref
                            heightRef={this.timeEntityInnerHeightMap.createRef(resource.id)}

                            // dimensions
                            slotWidth={slotWidth}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {timelineNeedsBottomFiller && (
                    <div
                      className='fc-border-t fc-filler'
                      style={{ minHeight: timelineBottomFiller }}
                    />
                  )}
                </div>

                <Ruler widthRef={this.handleTimeClientWidth} />
                <Ruler heightRef={this.handleTimeClientHeight} className='fc-fill-start' />
              </Scroller>

              {/* time-area FOOTER
              ---------------------------------------------------------------------------- */}
              {Boolean(stickyFooterScrollbar) && (
                <StickyFooterScrollbar
                  canvasWidth={timeCanvasWidth}
                  scrollerRef={this.timeFooterScrollerRef}
                />
              )}

              <Ruler widthRef={this.handleTimeTotalWidth} />
            </Fragment>
          }
        />
        <Ruler heightRef={this.handleTotalHeight} className='fc-fill-start' />
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    const { props, context } = this

    this.timeScroller = new ScrollerSyncer(true) // horizontal=true
    this.bodyScroller = new ScrollerSyncer() // horizontal=false
    this.spreadsheetScroller = new ScrollerSyncer(true) // horizontal=true

    this.updateScrollersSyncers()

    if (props.initialScroll) {
      this.scroll = { ...props.initialScroll } // copy
      this.applyEntityScroll()
      this.applyTimeScroll()
    } else {
      this.resetTimeScroll()
    }
    setRef(props.scrollRef, this.scroll)

    this.timeScroller.addScrollEndListener(this.handleTimeScrollEnd)
    this.bodyScroller.addScrollEndListener(this.handleEntityScrollEnd)

    context.emitter.on('_timeScrollRequest', this.handleTimeScrollRequest)
    context.emitter.on('_resourceScrollRequest', this.handleResourceScrollRequest)
  }

  componentDidUpdate(prevProps: ResourceTimelineLayoutNormalProps) {
    const { props } = this
    const { options } = this.context

    this.updateScrollersSyncers()

    const dateProfileChange = prevProps.dateProfile !== props.dateProfile
    const slotWidthChange = prevProps.slotWidth !== props.slotWidth

    if (dateProfileChange || slotWidthChange) {
      if (dateProfileChange && options.scrollTimeReset) {
        this.resetTimeScroll()
      } else {
        this.applyTimeScroll()
      }
    }

    /*
    Unfortunately this will execute after auto-scroll finished but before scrollEnd can record
    the updated scroll positioning, causing a scroll-jump to the last recorded entityScroll.
    */
    if (this.queuedHeightChange) {
      this.queuedHeightChange = false
      this.applyEntityScroll()
    }
  }

  componentWillUnmount() {
    this.timeScroller.destroy()
    this.bodyScroller.destroy()
    this.spreadsheetScroller.destroy()

    this.timeScroller.removeScrollEndListener(this.handleTimeScrollEnd)
    this.bodyScroller.removeScrollEndListener(this.handleEntityScrollEnd)

    this.context.emitter.off('_timeScrollRequest', this.handleTimeScrollRequest)
    this.context.emitter.off('_resourceScrollRequest', this.handleResourceScrollRequest)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleTotalHeight = (totalHeight: number) => {
    this.setState({
      totalHeight,
    })
  }

  private handleSpreadsheetClientWidth = (spreadsheetClientWidth: number) => {
    setRef(this.props.spreadsheetClientWidthRef, spreadsheetClientWidth)
  }

  private handleSpreadsheetClientHeight = (spreadsheetClientHeight: number) => {
    this.setState({
      spreadsheetClientHeight,
    })
  }

  private handleTimeClientHeight = (timeClientHeight: number) => {
    this.setState({
      timeClientHeight,
    })
  }

  private handleTimeTotalWidth = (timeTotalWidth: number) => {
    this.setState({
      timeTotalWidth,
    })
  }

  private handleTimeClientWidth = (timeClientWidth: number) => {
    setRef(this.props.timeClientWidthRef, timeClientWidth)

    this.setState({
      timeClientWidth,
    })
  }

  private handleTimeStickyScrollbarWidth = (timeStickyScrollbarWidth: number) => {
    this.setState({
      timeStickyScrollbarWidth,
    })
  }

  private handleBodySlotInnerWidth = (width: number) => {
    this.bodySlotInnerWidth = width
    afterSize(this.handleSlotInnerWidths)
  }

  private handleSlotInnerWidths = () => {
    const headerSlotInnerWidth = this.headerRowInnerWidthMap.current.get(this.props.tDateProfile.cellRows.length - 1)
    const { bodySlotInnerWidth } = this

    if (headerSlotInnerWidth != null && bodySlotInnerWidth != null) {
      const slotInnerWidth = Math.max(headerSlotInnerWidth, bodySlotInnerWidth)

      if (slotInnerWidth !== this.slotInnerWidth) {
        this.slotInnerWidth = slotInnerWidth
        setRef(this.props.slotInnerWidthRef, slotInnerWidth)
      }
    }
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private updateScrollersSyncers() {
    this.timeScroller.handleChildren([
      this.timeHeaderScrollerRef.current,
      this.timeBodyScrollerRef.current,
      this.timeFooterScrollerRef.current,
    ])

    this.bodyScroller.handleChildren([
      this.spreadsheetBodyScrollerRef.current,
      this.timeBodyScrollerRef.current,
    ])

    this.spreadsheetScroller.handleChildren([
      this.spreadsheetHeaderScrollerRef.current,
      this.spreadsheetBodyScrollerRef.current,
      this.spreadsheetFooterScrollerRef.current,
    ])
  }

  // TIME Scrolling
  // -----------------------------------------------------------------------------------------------

  private resetTimeScroll(): void {
    this.handleTimeScrollRequest(this.context.options.scrollTime)
  }

  private handleTimeScrollRequest = (timeScroll: Duration) => {
    this.scroll.time = timeScroll
    this.scroll.x = undefined
    this.applyTimeScroll()
  }

  /*
  Captures current values
  */
  private handleTimeScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scroll.x = this.timeScroller.x
      this.scroll.time = undefined
    }
  }

  private applyTimeScroll() {
    const { props, context, scroll } = this
    const { tDateProfile, slotWidth } = props
    let { x, time } = scroll

    if (x == null && time && slotWidth != null) {
      x = timeToCoord(time, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)

      if (x) {
        x += 1 // overcome border. TODO: DRY this up
      }

      scroll.x = x // HACK: store raw pixel value
    }

    if (x != null) {
      this.timeScroller.scrollTo({ x })
    }
  }

  // ENTITY (RESOURCE) Scrolling
  // -----------------------------------------------------------------------------------------------

  private handleResourceScrollRequest = (resoureId: string) => {
    this.scroll.entityId = resoureId
    this.scroll.fromBottom = undefined
    this.applyEntityScroll()
  }

  /*
  Captures current values
  */
  private handleEntityScrollEnd = (isUser: boolean) => {
    if (isUser) {
      const { bodyLayouts, bodyTops, bodyHeights, scroll } = this
      const y = this.bodyScroller.y

      const coordRes = findEntityByCoord(
        bodyLayouts,
        bodyTops,
        bodyHeights,
        y,
      )

      if (coordRes) {
        const [entity, elTop, elHeight] = coordRes

        scroll.entityId = createEntityId(entity)
        scroll.fromBottom = y
          ? elTop + elHeight - y
          : undefined // if already at top, keep at top
      }
    }
  }

  private applyEntityScroll() {
    const { bodyTops, bodyHeights, scroll } = this
    const { entityId, fromBottom } = scroll

    if (entityId) {
      const top = bodyTops.get(entityId)
      const height = bodyHeights.get(entityId)

      if (top != null) {
        const bottom = top + height
        const scrollTop = (
          fromBottom != null ?
            bottom - fromBottom : // pixels from bottom edge
            top + // just use top edge
              (top ? 1 : 0) // overcome top border
        )

        this.bodyScroller.scrollTo({ y: scrollTop })
      }
    }
  }

  // Hit System
  // -----------------------------------------------------------------------------------------------

  handleBodyEl = (el: HTMLElement | null) => {
    this.bodyEl = el

    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  prepareHits(): void {
    /*
    HACK for queuedHeightChange usage in componentDidUpdate
    This executes when a drag/resize starts and clears the last recorded entity scroll
    */
    this.scroll.entityId = undefined
    this.scroll.fromBottom = undefined
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { props, context, bodyLayouts, bodyTops, bodyHeights } = this
    const { dateProfile, tDateProfile, timeCanvasWidth, slotWidth } = props
    const { dateEnv, isRtl } = context

    let coordRes = findEntityByCoord(
      bodyLayouts,
      bodyTops,
      bodyHeights,
      positionTop,
    )

    if (coordRes) {
      let [entityAtTop, top, height] = coordRes

      if (!isEntityGroup(entityAtTop)) {
        let resource = entityAtTop
        let bottom = top + height

        /*
        TODO: DRY-up ith TimelineView!!!
        */
        if (slotWidth) {
          const x = isRtl ? timeCanvasWidth - positionLeft : positionLeft
          const slatIndex = Math.floor(x / slotWidth)
          const slatLeft = slatIndex * slotWidth
          const partial = (x - slatLeft) / slotWidth // floating point number between 0 and 1
          const localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot) // the snap # relative to start of slat

          let start = dateEnv.add(
            tDateProfile.slotDates[slatIndex],
            multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
          )
          let end = dateEnv.add(start, tDateProfile.snapDuration)

          // TODO: generalize this coord stuff to TimeGrid?

          let snapWidth = slotWidth / tDateProfile.snapsPerSlot
          let startCoord = slatIndex * slotWidth + (snapWidth * localSnapIndex)
          let endCoord = startCoord + snapWidth
          let left: number, right: number

          if (isRtl) {
            left = timeCanvasWidth - endCoord
            right = timeCanvasWidth - startCoord
          } else {
            left = startCoord
            right = endCoord
          }

          return {
            dateProfile,
            dateSpan: {
              range: { start, end },
              allDay: !tDateProfile.isTimeScale,
              resourceId: resource.id,
            },
            rect: {
              left,
              right,
              top,
              bottom,
            },
            // HACK. TODO: This is expensive to do every hit-query
            dayEl: getTimelineSlotEl(this.bodyEl, slatIndex),
            layer: 0,
          }
        }
      }
    }

    return null
  }
}

function computeHeaderHeight(
  dataGridHeaderRowInnerHeightMap: Map<boolean, number>,
  timelineHeaderRowInnerHeightMap: Map<number, number>,
  hasDateGridSuperHeader: boolean,
  timelineHeaderRowCnt: number,
): number | undefined {
  const dataGridKeys: boolean[] = (hasDateGridSuperHeader ? [true] : []).concat(false)
  let dataGridH = 0

  // TODO: use summing util?
  for (const key of dataGridKeys) {
    const rowHeight = dataGridHeaderRowInnerHeightMap.get(key)
    if (rowHeight == null) {
      return
    }
    dataGridH += rowHeight
  }

  let timelineH = 0

  // TODO: use summing util?
  for (let row = 0; row < timelineHeaderRowCnt; row++) {
    const rowHeight = timelineHeaderRowInnerHeightMap.get(row)
    if (rowHeight == null) {
      return
    }
    timelineH += rowHeight
  }

  // add in-between borders too
  return Math.max(
    dataGridH + (hasDateGridSuperHeader ? ROW_BORDER_WIDTH : 0),
    timelineH + ROW_BORDER_WIDTH * (timelineHeaderRowCnt - 1),
  )
}
