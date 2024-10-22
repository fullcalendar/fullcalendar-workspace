import { Duration } from '@fullcalendar/core'
import {
  afterSize,
  DateComponent,
  DateMarker,
  DateRange,
  getIsHeightAuto,
  getStickyFooterScrollbar,
  getStickyHeaderDates,
  greatestDurationDenominator,
  guid,
  Hit,
  isArraysEqual,
  memoize,
  multiplyDuration,
  NowTimer,
  rangeContainsMarker,
  RefMap,
  Scroller,
  ScrollerSyncerInterface,
  ViewContainer, ViewOptionsRefined,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import { ScrollerSyncer } from '@fullcalendar/scrollgrid/internal'
import {
  buildResourceHierarchy,
  ColSpec,
  createEntityId,
  DEFAULT_RESOURCE_ORDER,
  Group,
  GroupSpec,
  isEntityGroup,
  Resource,
  ResourceSplitter,
  ResourceViewProps,
} from '@fullcalendar/resource/internal'
import {
  buildTimelineDateProfile,
  computeSlotWidth,
  TimelineDateProfile,
  TimelineHeaderRow,
  TimelineLaneBg,
  TimelineLaneSlicer,
  TimelineNowIndicatorArrow,
  TimelineNowIndicatorLine,
  TimelineSlats,
  timeToCoord
} from '@fullcalendar/timeline/internal'
import {
  computeHeights,
  computeTopsFromHeights,
  findEntityByCoord,
  findEntityById,
} from '../resource-positioning.js'
import {
  processSpreadsheetColWidthConfigs,
  sliceSpreadsheetColWidth,
  processSpreadsheetColWidthOverrides,
  ColWidthConfig,
  isColWidthConfigListsEqual,
  parseColWidthConfig,
} from '../col-positioning.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import { GroupTallCell } from './spreadsheet/GroupTallCell.js'
import { GroupWideCell } from './spreadsheet/GroupWideCell.js'
import { HeaderRow } from './spreadsheet/HeaderRow.js'
import { ResourceCells } from './spreadsheet/ResourceCells.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'
import { buildHeaderLayouts, buildResourceLayouts, computeHasNesting, GenericLayout, ResourceLayout } from '../resource-layout.js'

interface ResourceTimelineViewState {
  slotInnerWidth?: number
  spreadsheetWidth?: number
  spreadsheetColWidthConfigs: ColWidthConfig[]
  spreadsheetColWidthOverrides?: number[]
  mainScrollerWidth?: number
  mainScrollerHeight?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  spreadsheetBottomScrollbarWidth?: number
  timeBottomScrollbarWidth?: number
}

interface EntityScroll {
  entityId: string
  fromBottom?: number
}

export class ResourceTimelineView extends DateComponent<ResourceViewProps, ResourceTimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private computeHasNesting = memoize(computeHasNesting)
  private buildResourceLayouts = memoize(buildResourceLayouts)
  private buildHeaderLayouts = memoize(buildHeaderLayouts)
  private computeSlotWidth = memoize(computeSlotWidth)
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)

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
  private spreadsheetEntityInnerHeightMap = new RefMap<Resource | Group, number>(this.handleHeightChange)
  private timeEntityInnerHeightMap = new RefMap<Resource | Group, number>(this.handleHeightChange)
  private tDateProfile?: TimelineDateProfile
  private timeCanvasWidth?: number
  private slotWidth?: number
  private bodyLayouts: GenericLayout<Resource | Group>[]
  private bodyTops?: Map<Resource | Group, number>
  private bodyHeights?: Map<Resource | Group, number>

  // internal
  private resourceSplitter = new ResourceSplitter()
  private bgSlicer = new TimelineLaneSlicer()
  private bodySlotInnerWidth: number
  private timeScroller: ScrollerSyncerInterface
  private bodyScroller: ScrollerSyncerInterface
  private spreadsheetScroller: ScrollerSyncerInterface
  private entityScroll: EntityScroll | null = null
  private timeScroll: Duration | null = null

  render() {
    let { props, state, context } = this
    let { dateProfile } = props
    let { options, viewSpec } = context

    /* date */

    let tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    let { cellRows } = tDateProfile
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    /* table settings */

    let verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)
    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    let {
      groupSpecs,
      groupRowDepth,
      orderSpecs,
      colSpecs,
      colWidthConfigs: initialColWidthConfigs,
      superHeaderRendering,
    } = this.processColOptions(context.options)

    /* table hierarchy */

    let resourceHierarchy = this.buildResourceHierarchy(
      props.resourceStore,
      orderSpecs,
      groupSpecs,
      groupRowDepth,
    )

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
      (entity) => this.headerRowInnerHeightMap.current.get(entity), // makes memoization impossible!
    )

    let [bodyHeights, bodyCanvasHeight] = computeHeights(
      bodyLayouts,
      (entity) => { // makes memoization impossible!
        const entitySpreadsheetHeight = this.spreadsheetEntityInnerHeightMap.current.get(entity)
        if (entitySpreadsheetHeight != null) {
          return Math.max(
            entitySpreadsheetHeight,
            // map doesn't contain group-column-cell heights
            this.timeEntityInnerHeightMap.current.get(entity) || 0,
          )
        }
      },
      (verticalScrolling && options.expandRows)
        ? state.mainScrollerHeight
        : undefined,
    )
    let bodyTops = computeTopsFromHeights(bodyLayouts, bodyHeights)
    this.bodyHeights = bodyHeights
    this.bodyTops = bodyTops

    let [timeCanvasWidth, slotWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the last-level label width. rename?
      state.mainScrollerWidth
    )
    this.slotWidth = slotWidth
    this.timeCanvasWidth = timeCanvasWidth

    let [spreadsheetColWidths, spreadsheetCanvasWidth] =
      state.spreadsheetColWidthOverrides
        ? processSpreadsheetColWidthOverrides(state.spreadsheetColWidthOverrides, state.spreadsheetWidth)
        : processSpreadsheetColWidthConfigs(initialColWidthConfigs, state.spreadsheetWidth)

    let spreadsheetResourceWidth = sliceSpreadsheetColWidth(
      spreadsheetColWidths,
      flatGroupColLayouts.length, // start slicing here
    )

    /* event display */

    let splitProps = this.resourceSplitter.splitProps(props)
    let bgLaneProps = splitProps['']
    let bgSlicedProps = this.bgSlicer.sliceProps(
      bgLaneProps,
      dateProfile,
      tDateProfile.isTimeScale ? null : options.nextDayThreshold,
      context, // wish we didn't need to pass in the rest of these args...
      dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv,
    )

    /* business hour display */

    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(flatResourceLayouts)
    let fallbackBusinessHours = hasResourceBusinessHours ? props.businessHours : null

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const enableNowIndicator = // TODO: DRY
            options.nowIndicator &&
            slotWidth != null &&
            rangeContainsMarker(props.dateProfile.currentRange, nowDate)

          return (
            <ViewContainer
              elClasses={[
                'fc-resource-timeline-view',
                'fc-flex-column', // so ReisableTwoCol can grow
                'fc-border',
              ]}
              viewSpec={viewSpec}
            >
              <ResizableTwoCol
                className={verticalScrolling ? 'fc-liquid' : ''}
                onSizes={this.handleTwoColSizes}

                /* spreadsheet
                --------------------------------------------------------------------------------- */

                startClassName='fc-flex-column'
                startContent={
                  <Fragment>

                    {/* spreadsheet HEADER
                    ---------------------------------------------------------------------------- */}
                    <div
                      className={[
                        'fc-datagrid-header',
                        'fc-rowgroup',
                        stickyHeaderDates ? 'fc-sticky-header' : '',
                      ].join(' ')}
                    >
                      {Boolean(superHeaderRendering) && (
                        <div
                          role="row"
                          className="fc-row"
                          style={{
                            height: headerHeights.get(true), // true means superheader
                          }}
                        >
                          <SuperHeaderCell
                            renderHooks={superHeaderRendering}
                            indent={hasNesting}
                            innerHeightRef={this.headerRowInnerHeightMap.createRef(true)}
                          />
                        </div>
                      )}
                      <Scroller
                        horizontal
                        hideScrollbars
                        elClassNames={['fc-rowgroup']}
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
                            height={headerHeights.get(false) /* false means normalheader */}

                            // handlers
                            onColWidthOverrides={this.handleColWidthOverrides}
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
                      elClassNames={[
                        'fc-datagrid-body',
                        'fc-rowgroup',
                        verticalScrolling ? 'fc-liquid' : '',
                      ]}
                      ref={this.spreadsheetBodyScrollerRef}
                    >
                      <div
                        className='fc-rel fc-grow'
                        style={{
                          width: spreadsheetCanvasWidth,
                          paddingBottom: state.timeBottomScrollbarWidth - state.spreadsheetBottomScrollbarWidth,
                          // ^^weird to have same element responsible for width and veritical padding
                        }}
                      >
                        <div
                          className='fc-flex-row'
                          style={{
                            height: bodyCanvasHeight, // why is the height on here???
                          }}
                        >
                          {/* group columns */}
                          <Fragment>{/* TODO: need Fragment for key? */}
                            {flatGroupColLayouts.map((groupColLayouts, colIndex) => (
                              <div
                                key={colIndex}
                                className='fc-cell fc-rel'
                                style={{
                                  width: spreadsheetColWidths[colIndex],
                                }}
                              >
                                {groupColLayouts.map((groupCellLayout) => {
                                  const group = groupCellLayout.entity
                                  return (
                                    <div
                                      key={queryObjKey(group)}
                                      role='row'
                                      aria-rowindex={groupCellLayout.rowIndex}
                                      class={[
                                        'fc-row fc-fill-x',
                                        groupCellLayout.rowIndex ? 'fc-not-first' : '',
                                      ].join(' ')}
                                      style={{
                                        top: bodyTops.get(group),
                                        height: bodyHeights.get(group),
                                      }}
                                    >
                                      <GroupTallCell
                                        colSpec={group.spec}
                                        fieldValue={group.value}
                                        innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(group)}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </Fragment>
                          {/* TODO: do background column stripes; add render hooks? */}
                          {/* BADDD: this should be within something with {height:bodyCanvasHeight} */}
                          <div
                            className='fc-flex-row fc-rel'
                            style={{
                              width: spreadsheetResourceWidth
                            }}
                          >
                            {flatResourceLayouts.map((resourceLayout) => {
                              const resource = resourceLayout.entity
                              return (
                                <div
                                  key={resource.id}
                                  role='row'
                                  aria-rowindex={resourceLayout.rowIndex}
                                  class={[
                                    'fc-row fc-fill-x',
                                    resourceLayout.rowIndex ? 'fc-not-first' : '',
                                  ].join(' ')}
                                  style={{
                                    top: bodyTops.get(resource),
                                    height: bodyHeights.get(resource),
                                  }}
                                >
                                  <ResourceCells
                                    resource={resource}
                                    resourceFields={resourceLayout.resourceFields}
                                    indent={resourceLayout.indent}
                                    hasChildren={resourceLayout.hasChildren}
                                    isExpanded={resourceLayout.isExpanded}
                                    colStartIndex={flatGroupColLayouts.length}
                                    colSpecs={colSpecs}
                                    innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(resource)}
                                    colWidths={spreadsheetColWidths}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {/* resource-group rows */}
                        {/* container simply to enclose siblings for :first-child, etc */}
                        {/* hackily moved after resources for z-index reasons */}
                        <div>
                          {flatGroupRowLayouts.map((groupRowLayout) => {
                            const group = groupRowLayout.entity
                            return (
                              <div
                                key={queryObjKey(group)}
                                role='row'
                                aria-rowindex={groupRowLayout.rowIndex}
                                class={[
                                  'fc-row fc-fill-x',
                                  groupRowLayout.rowIndex ? 'fc-not-first' : '',
                                ].join(' ')}
                                style={{
                                  top: bodyTops.get(group),
                                  height: bodyHeights.get(group),
                                }}
                              >
                                <GroupWideCell
                                  group={group}
                                  isExpanded={groupRowLayout.isExpanded}
                                  innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(group)}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Scroller>

                    {/* spreadsheet FOOTER scrollbar
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      horizontal
                      watchBorderBox
                      elClassNames={[
                        stickyFooterScrollbar ? 'fc-sticky-footer' : '',
                      ]}
                      elStyle={{
                        marginTop: '-1px', // HACK
                      }}
                      ref={this.spreadsheetFooterScrollerRef}
                      bottomScrollbarWidthRef={this.handleSpreadsheetBottomScrollbarWidth}
                    >
                      <div
                        style={{
                          width: spreadsheetCanvasWidth,
                          height: '1px', // HACK
                        }}
                      />
                    </Scroller>
                  </Fragment>
                }

                /* time-area (TODO: try to make this DRY-er with TimelineView???)
                --------------------------------------------------------------------------------- */

                endClassName='fc-flex-column'
                endContent={
                  <Fragment>

                    {/* time-area HEADER
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      ref={this.timeHeaderScrollerRef}
                      horizontal
                      hideScrollbars
                      elClassNames={[
                        'fc-timeline-header',
                        'fc-rowgroup',
                        stickyHeaderDates ? 'fc-sticky-header' : '',
                      ]}
                    >
                      <div
                        className='fc-rel fc-content-box'
                        style={{
                          width: timeCanvasWidth,
                          paddingLeft: state.leftScrollbarWidth,
                          paddingRight: state.rightScrollbarWidth,
                        }}
                      >
                        {cellRows.map((cells, rowLevel) => {
                          const isLast = rowLevel === cellRows.length - 1
                          return (
                            <TimelineHeaderRow
                              key={rowLevel}
                              dateProfile={props.dateProfile}
                              tDateProfile={tDateProfile}
                              nowDate={nowDate}
                              todayRange={todayRange}
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
                            nowDate={nowDate}
                            slotWidth={slotWidth}
                          />
                        )}
                      </div>
                    </Scroller>

                    {/* time-area BODY (w/ events)
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      vertical={verticalScrolling}
                      horizontal
                      hideScrollbars={stickyFooterScrollbar}
                      elClassNames={[
                        'fc-timeline-body',
                        'fc-rowgroup',
                        verticalScrolling ? 'fc-liquid' : '',
                      ]}
                      ref={this.timeBodyScrollerRef}
                      widthRef={this.handleMainScrollerWidth}
                      heightRef={this.handleMainScrollerHeight}
                      leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
                      rightScrollbarWidthRef={this.handleRightScrollbarWidth}
                      bottomScrollbarWidthRef={this.handleTimeBottomScrollbarWidth}
                    >
                      <div
                        className='fc-rel fc-grow'
                        style={{ width: timeCanvasWidth }}
                        ref={this.handleBodyEl}
                      >
                        <div
                          className='fc-rel'
                          style={{ height: bodyCanvasHeight }}
                        >
                          <div>
                            {flatResourceLayouts.map((resourceLayout) => {
                              const resource = resourceLayout.entity
                              return (
                                <div
                                  key={resource.id}
                                  role='row'
                                  aria-rowindex={resourceLayout.rowIndex}
                                  className={[
                                    'fc-row fc-fill-x',
                                    resourceLayout.rowIndex ? 'fc-not-first' : '',
                                  ].join(' ')}
                                  style={{
                                    top: bodyTops.get(resource),
                                    height: bodyHeights.get(resource),
                                  }}
                                >
                                  <ResourceLane
                                    {...splitProps[resource.id]}
                                    resource={resource}
                                    dateProfile={dateProfile}
                                    tDateProfile={tDateProfile}
                                    nowDate={nowDate}
                                    todayRange={todayRange}
                                    nextDayThreshold={context.options.nextDayThreshold}
                                    businessHours={resource.businessHours || fallbackBusinessHours}

                                    // ref
                                    innerHeightRef={this.timeEntityInnerHeightMap.createRef(resource)}

                                    // dimensions
                                    slotWidth={slotWidth}
                                  />
                                </div>
                              )
                            })}
                          </div>
                          {/* groups hackily moved after resource-rows for z-index reasons */}
                          <div>
                            {flatGroupRowLayouts.map((groupRowLayout) => {
                              const group = groupRowLayout.entity
                              return (
                                <div
                                  key={queryObjKey(group)}
                                  role='row'
                                  aria-rowindex={groupRowLayout.rowIndex}
                                  class={[
                                    'fc-row fc-fill-x',
                                    groupRowLayout.rowIndex ? 'fc-not-first' : '',
                                  ].join(' ')}
                                  style={{
                                    top: bodyTops.get(group),
                                    height: bodyHeights.get(group),
                                  }}
                                >
                                  <GroupLane
                                    group={group}
                                    innerHeightRef={this.timeEntityInnerHeightMap.createRef(group)}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className='fc-fill'>
                          <TimelineSlats
                            dateProfile={dateProfile}
                            tDateProfile={tDateProfile}
                            nowDate={nowDate}
                            todayRange={todayRange}

                            // ref
                            innerWidthRef={this.handleBodySlotInnerWidth}

                            // dimensions
                            slotWidth={slotWidth}
                          />
                          <TimelineLaneBg
                            tDateProfile={tDateProfile}
                            nowDate={nowDate}
                            todayRange={todayRange}

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
                              nowDate={nowDate}
                              slotWidth={slotWidth}
                            />
                          )}
                        </div>
                      </div>
                    </Scroller>

                    {/* time-area FOOTER
                    ---------------------------------------------------------------------------- */}
                    {stickyFooterScrollbar && (
                      <Scroller
                        horizontal
                        watchBorderBox
                        elClassNames={['fc-sticky-footer']}
                        elStyle={{
                          marginTop: '-1px', // HACK
                        }}
                        ref={this.timeFooterScrollerRef}
                      >
                        <div
                          style={{
                            width: timeCanvasWidth,
                            height: '1px', // HACK
                          }}
                        />
                      </Scroller>
                    )}

                  </Fragment>
                }
              />
            </ViewContainer>
          )
        }}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    const { context } = this

    this.timeScroller = new ScrollerSyncer(true) // horizontal=true
    this.bodyScroller = new ScrollerSyncer() // horizontal=false
    this.spreadsheetScroller = new ScrollerSyncer(true) // horizontal=true

    this.updateScrollersSyncers()
    this.resetTimeScroll()

    this.timeScroller.addScrollEndListener(this.clearTimeScroll)
    this.bodyScroller.addScrollEndListener(this.storeEntityScroll)

    context.emitter.on('_timeScrollRequest', this.handleTimeScroll)
    context.emitter.on('_resourceScrollRequest', this.handleResourceScroll)
  }

  componentDidUpdate(prevProps: ResourceViewProps) {
    const { options } = this.context

    this.updateScrollersSyncers()

    if (prevProps.dateProfile !== this.props.dateProfile && options.scrollTimeReset) {
      this.resetTimeScroll()
    } else {
      this.updateTimeScroll() // TODO: inefficient to do so often
    }

    this.updateEntityScroll() // TODO: inefficient to do so often
  }

  componentWillUnmount() {
    this.timeScroller.destroy()
    this.bodyScroller.destroy()
    this.spreadsheetScroller.destroy()

    this.timeScroller.removeScrollEndListener(this.clearTimeScroll)
    this.bodyScroller.removeScrollEndListener(this.storeEntityScroll)

    this.context.emitter.off('_timeScrollRequest', this.handleTimeScroll)
    this.context.emitter.off('_resourceScrollRequest', this.handleResourceScroll)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleTwoColSizes = (spreadsheetWidth: number) => {
    this.setState({
      spreadsheetWidth,
    })
  }

  handleMainScrollerWidth = (width: number) => {
    this.setState({
      mainScrollerWidth: width,
    })
  }

  handleMainScrollerHeight = (height: number) => {
    this.setState({
      mainScrollerHeight: height,
    })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({
      leftScrollbarWidth,
    })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({
      rightScrollbarWidth,
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
      this.headerRowInnerWidthMap.current.get(this.tDateProfile.cellRows.length - 1) || 0,
      this.bodySlotInnerWidth,
    )

    if (this.state.slotInnerWidth !== slotInnerWidth) {
      this.setState({ slotInnerWidth })
    }
  }

  handleColWidthOverrides = (colWidthOverrides: number[]) => {
    this.setState({
      spreadsheetColWidthOverrides: colWidthOverrides,
    })
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

  private resetTimeScroll(): void {
    this.handleTimeScroll(this.context.options.scrollTime)
  }

  private handleTimeScroll = (timeScroll: Duration) => {
    this.timeScroll = timeScroll
    this.updateTimeScroll()
  }

  private updateTimeScroll = () => {
    const { props, context, timeScroll, slotWidth } = this

    if (timeScroll != null && slotWidth != null) {
      const tDateProfile = this.tDateProfile

      let x = timeToCoord(timeScroll, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)

      if (x) {
        x += context.isRtl ? -1 : 1 // overcome border. TODO: DRY this up
      }

      this.timeScroller.scrollTo({ x })
    }
  }

  private clearTimeScroll = () => {
    this.timeScroll = null
  }

  private handleResourceScroll = (resoureId: string) => {
    this.handleEntityScroll({ entityId: resoureId })
  }

  private handleEntityScroll = (entityScroll: EntityScroll) => {
    this.entityScroll = entityScroll
    this.updateEntityScroll()
  }

  private updateEntityScroll() {
    const { bodyLayouts, bodyTops, bodyHeights, entityScroll } = this

    if (entityScroll) {
      const entity = findEntityById(bodyLayouts, entityScroll.entityId)

      if (entity) {
        const top = bodyTops.get(entity)
        const height = bodyHeights.get(entity)
        const bottom = top + height

        let scrollTop = (
          entityScroll.fromBottom != null ?
            bottom - entityScroll.fromBottom : // pixels from bottom edge
            top + // just use top edge
              (top ? 1 : 0) // overcome top border
        )

        this.bodyScroller.scrollTo({ y: scrollTop })
      }
    }
  }

  private storeEntityScroll = () => {
    let { bodyLayouts, bodyTops, bodyHeights } = this
    let scrollTop = this.bodyScroller.y

    let coordRes = findEntityByCoord(
      bodyLayouts,
      bodyTops,
      bodyHeights,
      scrollTop,
    )

    if (coordRes) {
      let [entity, elTop, elHeight] = coordRes
      let elBottom = elTop + elHeight
      let elBottomRelScroller = elBottom - scrollTop

      this.entityScroll = {
        entityId: createEntityId(entity),
        fromBottom: elBottomRelScroller,
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
    let { bodyLayouts, bodyTops, bodyHeights } = this
    let { dateProfile } = this.props
    const { dateEnv, isRtl } = this.context
    const tDateProfile = this.tDateProfile
    const timeCanvasWidth = this.timeCanvasWidth
    const slatWidth = this.slotWidth // TODO: renames?

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
        if (slatWidth) {
          const x = isRtl ? timeCanvasWidth - positionLeft : positionLeft
          const slatIndex = Math.floor(x / slatWidth)
          const slatLeft = slatIndex * slatWidth
          const partial = (x - slatLeft) / slatWidth // floating point number between 0 and 1
          const localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot) // the snap # relative to start of slat

          let start = dateEnv.add(
            tDateProfile.slotDates[slatIndex],
            multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
          )
          let end = dateEnv.add(start, tDateProfile.snapDuration)

          // TODO: generalize this coord stuff to TimeGrid?

          let snapWidth = slatWidth / tDateProfile.snapsPerSlot
          let startCoord = slatIndex * slatWidth + (snapWidth * localSnapIndex)
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

ResourceTimelineView.addStateEquality({
  spreadsheetColWidthConfigs: isColWidthConfigListsEqual,
  spreadsheetColWidthOverrides: isArraysEqual,
})

function processColOptions(options: ViewOptionsRefined) {
  let allColSpecs: ColSpec[] = options.resourceAreaColumns || []
  let superHeaderRendering = null

  if (!allColSpecs.length) {
    allColSpecs.push({
      headerClassNames: options.resourceAreaHeaderClassNames,
      headerContent: options.resourceAreaHeaderContent,
      headerDefault: () => 'Resources', // TODO: view.defaults
      headerDidMount: options.resourceAreaHeaderDidMount,
      headerWillUnmount: options.resourceAreaHeaderWillUnmount,
    })
  } else if (options.resourceAreaHeaderContent) { // weird way to determine if content
    superHeaderRendering = {
      headerClassNames: options.resourceAreaHeaderClassNames,
      headerContent: options.resourceAreaHeaderContent,
      headerDidMount: options.resourceAreaHeaderDidMount,
      headerWillUnmount: options.resourceAreaHeaderWillUnmount,
    }
  }

  let resourceColSpecs: ColSpec[] = []
  let groupColSpecs: ColSpec[] = [] // part of the colSpecs, but filtered out in order to put first
  let groupSpecs: GroupSpec[] = []
  let groupRowDepth = 0

  for (let colSpec of allColSpecs) {
    if (colSpec.group) {
      groupColSpecs.push({
        ...colSpec,
        cellClassNames: colSpec.cellClassNames || options.resourceGroupLabelClassNames,
        cellContent: colSpec.cellContent || options.resourceGroupLabelContent,
        cellDidMount: colSpec.cellDidMount || options.resourceGroupLabelDidMount,
        cellWillUnmount: colSpec.cellWillUnmount || options.resourceGroupLaneWillUnmount,
      })
    } else {
      resourceColSpecs.push(colSpec)
    }
  }

  // BAD: mutates a user-supplied option
  let mainColSpec = resourceColSpecs[0]
  mainColSpec.isMain = true
  mainColSpec.cellClassNames = mainColSpec.cellClassNames || options.resourceLabelClassNames
  mainColSpec.cellContent = mainColSpec.cellContent || options.resourceLabelContent
  mainColSpec.cellDidMount = mainColSpec.cellDidMount || options.resourceLabelDidMount
  mainColSpec.cellWillUnmount = mainColSpec.cellWillUnmount || options.resourceLabelWillUnmount

  if (groupColSpecs.length) {
    groupSpecs = groupColSpecs
  } else {
    groupRowDepth = 1
    let hGroupField = options.resourceGroupField
    if (hGroupField) {
      groupSpecs.push({
        field: hGroupField,

        labelClassNames: options.resourceGroupLabelClassNames,
        labelContent: options.resourceGroupLabelContent,
        labelDidMount: options.resourceGroupLabelDidMount,
        labelWillUnmount: options.resourceGroupLabelWillUnmount,

        laneClassNames: options.resourceGroupLaneClassNames,
        laneContent: options.resourceGroupLaneContent,
        laneDidMount: options.resourceGroupLaneDidMount,
        laneWillUnmount: options.resourceGroupLaneWillUnmount,
      })
    }
  }

  let allOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
  let plainOrderSpecs = []

  for (let orderSpec of allOrderSpecs) {
    let isGroup = false
    for (let groupSpec of groupSpecs) {
      if (groupSpec.field === orderSpec.field) {
        groupSpec.order = orderSpec.order // -1, 0, 1
        isGroup = true
        break
      }
    }
    if (!isGroup) {
      plainOrderSpecs.push(orderSpec)
    }
  }

  const colSpecs = groupColSpecs.concat(resourceColSpecs)

  const colWidthConfigs: ColWidthConfig[] = colSpecs.map((colSpec) => (
    parseColWidthConfig(colSpec.width)
  ))

  return {
    groupSpecs,
    groupRowDepth,
    orderSpecs: plainOrderSpecs,
    colSpecs,
    colWidthConfigs,
    superHeaderRendering,
  }
}

function computeHasResourceBusinessHours(resourceLayouts: ResourceLayout[]) {
  for (let resourceLayout of resourceLayouts) {
    if (resourceLayout.entity.businessHours) {
      return true
    }
  }

  return false
}

// General Utils
// -------------------------------------------------------------------------------------------------

const keyMap = new WeakMap<any, string>()

/*
TODO: how does this fit in with other ID generation stuff?
*/
function queryObjKey(obj: any): string {
  if (keyMap.has(obj)) {
    return keyMap.get(obj)
  }

  const key = guid()
  keyMap.set(obj, key)
  return key
}
