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
  identity,
  joinClassNames,
  memoize,
  multiplyDuration,
  rangeContainsMarker,
  RefMap,
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
  TimelineDateProfile,
  TimelineHeaderRow,
  TimelineLaneBg,
  TimelineNowIndicatorArrow,
  TimelineNowIndicatorLine,
  TimelineRange,
  TimelineSlats,
  timeToCoord
} from '@fullcalendar/timeline/internal'
import { buildHeaderLayouts, buildResourceLayouts, computeHasNesting, GenericLayout } from '../resource-layout.js'
import {
  computeHeights,
  computeTopsFromHeights,
  findEntityByCoord,
} from '../resource-positioning.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import { BodySection } from './spreadsheet/BodySection.js'
import { HeaderRow } from './spreadsheet/HeaderRow.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'

interface ResourceTimelineLayoutNormalProps {
  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  resourceHierarchy: GenericNode[]
  resourceEntityExpansions: ResourceEntityExpansions

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
  spreadsheetColWidths: number[]
  spreadsheetCanvasWidth: number | undefined

  timeClientWidthRef: Ref<number>
  onSpreadsheetColWidthOverrides: (widths: number[]) => void
  spreadsheetClientWidthRef: Ref<number>
  slotInnerWidthRef: Ref<number>

  // resource area
  resourceAreaWidthRef?: Ref<CssDimValue>

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
  timeClientHeight?: number
  endScrollbarWidth?: number
  spreadsheetBottomScrollbarWidth?: number
  timeBottomScrollbarWidth?: number
}

export class ResourceTimelineLayoutNormal extends DateComponent<ResourceTimelineLayoutNormalProps, ResourceTimelineViewState> {
  // memoized
  private computeHasNesting = memoize(computeHasNesting)
  private buildResourceLayouts = memoize(buildResourceLayouts)
  private buildHeaderLayouts = memoize(buildHeaderLayouts)

  // TODO: make this nice
  // This is a means to recompute row positioning when *HeightMaps change
  handleHeightChange = () => {
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
  private headerRowInnerHeightMap = new RefMap<boolean | number, number>(this.handleHeightChange)
  private spreadsheetEntityInnerHeightMap = new RefMap<string, number>(this.handleHeightChange) // keyed by createEntityId
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
    let { dateProfile } = props
    let { options, viewSpec } = context

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

    /* table display */

    let hasNesting = this.computeHasNesting(resourceHierarchy)
    let {
      layouts: bodyLayouts,
      flatResourceLayouts,
      flatGroupRowLayouts,
      flatGroupColLayouts,
    } = this.buildResourceLayouts(
      resourceHierarchy,
      hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.bodyLayouts = bodyLayouts

    /* table positions */

    let headerLayouts = this.buildHeaderLayouts(
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    let [headerHeights] = computeHeights(
      headerLayouts,
      identity,
      (entityKey) => this.headerRowInnerHeightMap.current.get(entityKey) + 1, // makes memoization impossible!
      /* minHeight = */ undefined,
    )

    let [bodyHeights, totalBodyHeight] = computeHeights( // TODO: memoize?
      bodyLayouts,
      createEntityId,
      (entityKey) => { // makes memoization impossible!
        const entitySpreadsheetHeight = this.spreadsheetEntityInnerHeightMap.current.get(entityKey)
        if (entitySpreadsheetHeight != null) {
          return Math.max(
            entitySpreadsheetHeight,
            // map doesn't contain group-column-cell heights
            this.timeEntityInnerHeightMap.current.get(entityKey) || 0,
          ) + 1
        }
      },
      /* minHeight = */ (verticalScrolling && options.expandRows)
        ? state.timeClientHeight
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
      (state.timeBottomScrollbarWidth || 0) -
        (state.spreadsheetBottomScrollbarWidth || 0),
    )

    const timelineBottomFiller = Math.max(
      0,
      (state.spreadsheetBottomScrollbarWidth || 0) -
        (state.timeBottomScrollbarWidth || 0),
    )

    const rowsAreExpanding = verticalScrolling && !options.expandRows &&
      state.timeClientHeight != null && state.timeClientHeight > totalBodyHeight

    const spreadsheetNeedsBottomFiller = rowsAreExpanding || Boolean(spreadsheetBottomFiller)
    const timelineNeedsBottomFiller = rowsAreExpanding || Boolean(timelineBottomFiller)

    return (
      <ViewContainer
        className='fc-resource-timeline fc-flex-col fc-border'
        viewSpec={viewSpec}
      >
        <ResizableTwoCol
          initialStartWidth={options.resourceAreaWidth}
          startWidthRef={props.resourceAreaWidthRef}
          className={verticalScrolling ? 'fc-liquid' : ''}

          /* spreadsheet
          --------------------------------------------------------------------------------- */

          startClassName='fc-flex-col'
          startContent={
            <Fragment>

              {/* spreadsheet HEADER
              ---------------------------------------------------------------------------- */}
              <div
                className={joinClassNames(
                  'fc-datagrid-header fc-flex-col fc-border-b',
                  stickyHeaderDates && 'fc-table-header-sticky',
                )}
              >
                {Boolean(superHeaderRendering) && (
                  <div
                    role="row"
                    className="fc-flex-row fc-border-b"
                    style={{
                      height: headerHeights.get(true), // true means superheader
                    }}
                  >
                    <SuperHeaderCell
                      renderHooks={superHeaderRendering}
                      indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                      innerHeightRef={this.headerRowInnerHeightMap.createRef(true)}
                    />
                  </div>
                )}
                <Scroller
                  horizontal
                  hideScrollbars
                  ref={this.spreadsheetHeaderScrollerRef}
                >
                  <div style={{ width: spreadsheetCanvasWidth }}>
                    <HeaderRow
                      colSpecs={colSpecs}
                      colWidths={spreadsheetColWidths}
                      indent={hasNesting}

                      // refs
                      innerHeightRef={this.headerRowInnerHeightMap.createRef(false)}

                      // dimension
                      height={maybeSubtractOne(headerHeights.get(false)) /* false means normalheader */}

                      // handlers
                      onColWidthOverrides={props.onSpreadsheetColWidthOverrides}
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
                  'fc-datagrid-body fc-flex-col',
                  verticalScrolling && 'fc-liquid',
                )}
                ref={this.spreadsheetBodyScrollerRef}
                clientWidthRef={props.spreadsheetClientWidthRef}
              >
                <div
                  className='fc-rel fc-grow fc-flex-col'
                  style={{
                    width: spreadsheetCanvasWidth,
                    paddingTop: totalBodyHeight, // to push down filler div at end, and give height
                  }}
                >
                  <BodySection
                    flatResourceLayouts={flatResourceLayouts}
                    flatGroupRowLayouts={flatGroupRowLayouts}
                    flatGroupColLayouts={flatGroupColLayouts}
                    colWidths={spreadsheetColWidths}
                    colSpecs={colSpecs}
                    rowInnerHeightRefMap={this.spreadsheetEntityInnerHeightMap}
                    rowTops={bodyTops}
                    rowHeights={bodyHeights}
                  />
                  {spreadsheetNeedsBottomFiller && (
                    <div
                      className='fc-border-t fc-filler'
                      style={{ minHeight: spreadsheetBottomFiller }}
                    />
                  )}
                </div>
              </Scroller>

              {/* spreadsheet FOOTER scrollbar
              ---------------------------------------------------------------------------- */}
              {/* TODO: this should not always be sticky! */}
              <StickyFooterScrollbar
                canvasWidth={spreadsheetCanvasWidth}
                scrollerRef={this.spreadsheetFooterScrollerRef}
                scrollbarWidthRef={this.handleSpreadsheetBottomScrollbarWidth}
              />
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
                  'fc-timeline-header fc-flex-row fc-border-b',
                  stickyHeaderDates && 'fc-table-header-sticky',
                )}
              >
                <div
                  // TODO: DRY
                  className={joinClassNames(
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
                        innerHeighRef={this.headerRowInnerHeightMap.createRef(rowLevel)}
                        height={headerHeights.get(rowLevel)}
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
                {Boolean(state.endScrollbarWidth) && (
                  <div
                    className='fc-border-s fc-filler'
                    style={{ minWidth: state.endScrollbarWidth }}
                  />
                )}
              </Scroller>

              {/* time-area BODY (w/ events)
              ---------------------------------------------------------------------------- */}
              <Scroller
                vertical={verticalScrolling}
                horizontal
                hideScrollbars={stickyFooterScrollbar}
                className={joinClassNames(
                  'fc-timeline-body fc-flex-col',
                  verticalScrolling && 'fc-liquid',
                )}
                ref={this.timeBodyScrollerRef}
                clientWidthRef={props.timeClientWidthRef}
                clientHeightRef={this.handleTimeClientHeight}
                endScrollbarWidthRef={this.handleEndScrollbarWidth}
                bottomScrollbarWidthRef={this.handleTimeBottomScrollbarWidth}
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
                    className='fc-rel'
                    style={{ height: totalBodyHeight }}
                  >
                    {flatResourceLayouts.map((resourceLayout) => {
                      const resource = resourceLayout.entity
                      return (
                        <div
                          key={resource.id}
                          role='row'
                          aria-rowindex={resourceLayout.rowIndex}
                          data-resource-id={resource.id}
                          className={joinClassNames(
                            'fc-resource fc-flex-col fc-fill-x',
                            resourceLayout.rowIndex < flatResourceLayouts.length - 1 && // is not last
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
                    {flatGroupRowLayouts.map((groupRowLayout) => {
                      const group = groupRowLayout.entity
                      const groupKey = createGroupId(group)
                      return (
                        <div
                          key={groupKey}
                          role='row'
                          aria-rowindex={groupRowLayout.rowIndex}
                          class={joinClassNames(
                            'fc-flex-row fc-fill-x',
                            groupRowLayout.rowIndex < flatGroupRowLayouts.length - 1 && // is not last
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
                  </div>
                  {timelineNeedsBottomFiller && (
                    <div
                      className='fc-border-t fc-filler'
                      style={{ minHeight: timelineBottomFiller }}
                    />
                  )}
                </div>
              </Scroller>

              {/* time-area FOOTER
              ---------------------------------------------------------------------------- */}
              {stickyFooterScrollbar && (
                <StickyFooterScrollbar
                  canvasWidth={timeCanvasWidth}
                  scrollerRef={this.timeFooterScrollerRef}
                />
              )}
            </Fragment>
          }
        />
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
    const { options } = this.context

    this.updateScrollersSyncers()

    if (prevProps.dateProfile !== this.props.dateProfile && options.scrollTimeReset) {
      this.resetTimeScroll()
    } else {
      this.applyTimeScroll() // TODO: inefficient to do so often
    }

    this.applyEntityScroll() // TODO: inefficient to do so often
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

  handleTimeClientHeight = (height: number) => {
    this.setState({
      timeClientHeight: height,
    })
  }

  handleEndScrollbarWidth = (endScrollbarWidth: number) => {
    this.setState({
      endScrollbarWidth,
    })
  }

  handleSpreadsheetBottomScrollbarWidth = (spreadsheetBottomScrollbarWidth: number) => {
    this.setState({
      spreadsheetBottomScrollbarWidth,
    })
  }

  handleTimeBottomScrollbarWidth = (timeBottomScrollbarWidth: number) => {
    this.setState({
      timeBottomScrollbarWidth,
    })
  }

  handleBodySlotInnerWidth = (width: number) => {
    this.bodySlotInnerWidth = width
    afterSize(this.handleSlotInnerWidths)
  }

  handleSlotInnerWidths = () => {
    const slotInnerWidth = Math.max(
      this.headerRowInnerWidthMap.current.get(this.props.tDateProfile.cellRows.length - 1) || 0,
      this.bodySlotInnerWidth,
    )

    if (slotInnerWidth !== this.slotInnerWidth) {
      this.slotInnerWidth = slotInnerWidth
      setRef(this.props.slotInnerWidthRef, slotInnerWidth)
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
  private handleTimeScrollEnd = () => {
    this.scroll.x = this.timeScroller.x
    this.scroll.time = undefined
  }

  private applyTimeScroll() {
    const { props, context, scroll } = this
    const { tDateProfile, slotWidth } = props
    let { x } = scroll

    if (x == null && scroll.time != null && slotWidth != null) {
      x = timeToCoord(scroll.time, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)
      scroll.x = x // HACK: store raw pixel value

      if (x) {
        x += context.isRtl ? -1 : 1 // overcome border. TODO: DRY this up
      }
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
  private handleEntityScrollEnd = () => {
    const { bodyLayouts, bodyTops, bodyHeights, scroll } = this
    const scrollTop = this.bodyScroller.y

    const coordRes = findEntityByCoord(
      bodyLayouts,
      bodyTops,
      bodyHeights,
      scrollTop,
    )

    if (coordRes) {
      const [entity, elTop, elHeight] = coordRes
      const elBottom = elTop + elHeight
      const elBottomRelScroller = elBottom - scrollTop

      scroll.entityId = createEntityId(entity)
      scroll.fromBottom = elBottomRelScroller
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
            dayEl: this.bodyEl.querySelectorAll('.fc-timeline-slot')[slatIndex] as HTMLElement, // TODO!
            layer: 0,
          }
        }
      }
    }

    return null
  }
}

// Util

function maybeSubtractOne(n: number | undefined): number | undefined {
  if (n != null) {
    return n - 1
  }
}
