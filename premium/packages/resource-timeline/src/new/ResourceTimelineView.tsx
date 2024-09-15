import {
  afterSize,
  DateComponent,
  DateMarker,
  DateRange,
  getIsHeightAuto,
  getScrollerSyncerClass,
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
  ScrollRequest,
  ScrollResponder,
  ViewContainer, ViewOptionsRefined,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
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
  TimelineLaneSeg,
  TimelineLaneSlicer,
  TimelineNowIndicatorArrow,
  TimelineNowIndicatorLine,
  TimelineSlats,
  timeToCoord
} from '@fullcalendar/timeline/internal'
import {
  buildEntityCoords,
  findEntityByCoord,
  Coords,
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
import { buildHeaderLayouts, buildResourceLayouts, GenericLayout, ResourceLayout } from '../resource-layout.js'

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

interface ResourceTimelineScrollState {
  entity?: Resource | Group
  fromBottom?: number
}

export class ResourceTimelineView extends DateComponent<ResourceViewProps, ResourceTimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private buildResourceLayouts = memoize(buildResourceLayouts)
  private buildHeaderLayouts = memoize(buildHeaderLayouts)
  private buildHeaderCoords = memoize(buildEntityCoords<boolean | number>)
  private buildBodyCoords = memoize(buildEntityCoords<Resource | Group>)
  private computeSlotWidth = memoize(computeSlotWidth)
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)

  // refs
  private bodyEl: HTMLElement
  private spreadsheetHeaderScrollerRef = createRef<Scroller>()
  private spreadsheetBodyScrollerRef = createRef<Scroller>()
  private spreadsheetFooterScrollerRef = createRef<Scroller>()
  private timeHeaderScrollerRef = createRef<Scroller>()
  private timeBodyScrollerRef = createRef<Scroller>()
  private timeFooterScrollerRef = createRef<Scroller>()
  private headerRowInnerHeightMap = new RefMap<boolean | number, number>()
  private spreadsheetEntityInnerHeightMap = new RefMap<Resource | Group, number>()
  private timeEntityInnerHeightMap = new RefMap<Resource | Group, number>()
  private tDateProfile?: TimelineDateProfile
  private timeCanvasWidth?: number
  private slotWidth?: number
  private bodyLayouts: GenericLayout<Resource | Group>[]
  private bodyCoords?: Map<Resource | Group, Coords>

  // internal
  private resourceSplitter = new ResourceSplitter()
  private bgSlicer = new TimelineLaneSlicer()
  private timeScroller: ScrollerSyncerInterface
  private bodyScroller: ScrollerSyncerInterface
  private spreadsheetScroller: ScrollerSyncerInterface
  private scrollResponder: ScrollResponder

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
      resourceColSpecs,
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

    let {
      layouts: bodyLayouts,
      flatResourceLayouts,
      flatGroupRowLayouts,
      flatGroupColLayouts,
    } = this.buildResourceLayouts(
      resourceHierarchy,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.bodyLayouts = bodyLayouts

    /* table positions */

    let headerLayouts = this.buildHeaderLayouts(
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    let headerCoords = this.buildHeaderCoords(
      headerLayouts,
      (entity) => this.headerRowInnerHeightMap.current.get(entity),
    )

    let bodyCoords = this.bodyCoords = this.buildBodyCoords(
      bodyLayouts,
      (entity) => {
        const entitySpreadsheetHeight = this.spreadsheetEntityInnerHeightMap.current.get(entity)
        if (entitySpreadsheetHeight != null) {
          return Math.max(
            entitySpreadsheetHeight,
            // map doesn't contain group-column-cell heights
            this.timeEntityInnerHeightMap.current.get(entity) || 0,
          )
        }
      },
      state.mainScrollerHeight,
    )

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
                'fcnew-bordered',
                'fcnew-flex-column', // so ReisableTwoCol can grow
                'fcnew-timeline',
                'fcnew-resource-timeline',
                options.eventOverlap === false ?
                  'fcnew-timeline-overlap-disabled' :
                  '',
              ]}
              viewSpec={viewSpec}
            >
              <ResizableTwoCol
                className={'fcnew-flex-grow'}
                onSizes={this.handleTwoColSizes}

                /* spreadsheet
                --------------------------------------------------------------------------------- */

                startClassName='fcnew-flex-column'
                startContent={
                  <Fragment>

                    {/* spreadsheet HEADER
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      horizontal
                      hideScrollbars
                      elClassNames={[
                        'fcnew-rowgroup',
                        stickyHeaderDates ? 'fcnew-v-sticky' : '',
                      ]}
                      ref={this.spreadsheetHeaderScrollerRef}
                    >
                      <div
                        style={{
                          width: spreadsheetCanvasWidth,
                          minHeight: '100%', // TODO: make this a class?
                        }}
                      >
                        {Boolean(superHeaderRendering) && (
                          <div
                            role="row"
                            className="fcnew-row"
                            style={{
                              height: (headerCoords.get(true) || [])[1], // true means superheader
                            }}
                          >
                            <SuperHeaderCell
                              renderHooks={superHeaderRendering}
                              innerHeightRef={this.headerRowInnerHeightMap.createRef(true)}
                            />
                          </div>
                        )}
                        <HeaderRow
                          colSpecs={colSpecs}
                          colWidths={spreadsheetColWidths}

                          // refs
                          innerHeightRef={this.headerRowInnerHeightMap.createRef(false)}

                          // dimension
                          height={(headerCoords.get(false) || [])[1] /* false means normalheader */}

                          // handlers
                          onColWidthOverrides={this.handleColWidthOverrides}
                        />
                      </div>
                    </Scroller>

                    {/* spreadsheet BODY
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      vertical={verticalScrolling}
                      horizontal
                      hideScrollbars
                      elClassNames={[
                        'fcnew-rowgroup',
                        'fcnew-flex-grow',
                      ]}
                      ref={this.spreadsheetBodyScrollerRef}
                    >
                      <div
                        style={{
                          width: spreadsheetCanvasWidth,
                          paddingBottom: state.spreadsheetBottomScrollbarWidth - state.timeBottomScrollbarWidth,
                          minHeight: '100%', // TODO: make this a class?
                        }}
                      >
                        {/* group columns */}
                        <Fragment>{/* TODO: need Fragment for key? */}
                          {flatGroupColLayouts.map((groupColLayouts, colIndex) => (
                            <div
                              key={colIndex}
                              className='fcnew-rel'
                              style={{ width: spreadsheetColWidths[colIndex] }}
                            >
                              {groupColLayouts.map((groupCellLayout) => {
                                const group = groupCellLayout.entity
                                const [top, height] = bodyCoords.get(group) || []
                                return (
                                  <div
                                    key={queryObjKey(group)}
                                    role='row'
                                    class='fcnew-row'
                                    style={{ top, height }}
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
                        <div
                          className='fcnew-rel'
                          style={{ width: spreadsheetResourceWidth }}
                        >
                          {flatGroupRowLayouts.map((groupRowLayout) => {
                            const group = groupRowLayout.entity
                            const [top, height] = bodyCoords.get(group) || []
                            return (
                              <div
                                key={String(group.value) /* what about this!? */}
                                role='row'
                                class='fcnew-row'
                                style={{ top, height }}
                              >
                                <GroupWideCell
                                  group={group}
                                  isExpanded={groupRowLayout.isExpanded}
                                  innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(group)}
                                />
                              </div>
                            )
                          })}
                          {flatResourceLayouts.map((resourceLayout) => {
                            const resource = resourceLayout.entity
                            const [top, height] = bodyCoords.get(resource) || []
                            return (
                              <div
                                key={resource.id}
                                role='row'
                                class='fcnew-row'
                                style={{ top, height }}
                              >
                                <ResourceCells
                                  resource={resource}
                                  resourceFields={resourceLayout.resourceFields}
                                  indent={resourceLayout.indent}
                                  hasChildren={resourceLayout.hasChildren}
                                  isExpanded={resourceLayout.isExpanded}
                                  colSpecs={resourceColSpecs}
                                  innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(resource)}
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
                      ref={this.spreadsheetFooterScrollerRef}
                      horizontal
                      bottomScrollbarWidthRef={this.handleSpreadsheetBottomScrollbarWidth}
                    >
                      <div style={{ width: spreadsheetCanvasWidth }} />
                    </Scroller>
                  </Fragment>
                }

                /* time-area (TODO: try to make this DRY-er with TimelineView???)
                --------------------------------------------------------------------------------- */

                endClassName='fcnew-flex-column'
                endContent={
                  <Fragment>

                    {/* time-area HEADER
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      ref={this.timeHeaderScrollerRef}
                      horizontal
                      hideScrollbars
                      elClassNames={[
                        'fcnew-rowgroup',
                        stickyHeaderDates ? 'fcnew-v-sticky' : '',
                      ]}
                    >
                      <div
                        className='fcnew-rel'
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
                              innerWidthRef={isLast ? this.handleHeaderSlotInnerWidth : undefined}
                              innerHeighRef={this.headerRowInnerHeightMap.createRef(rowLevel)}
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

                    {/* time-area BODY (resources)
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      vertical={verticalScrolling}
                      horizontal
                      elClassNames={['fcnew-rowgroup', 'fcnew-flex-grow']}
                      ref={this.timeBodyScrollerRef}
                      heightRef={this.handleMainScrollerHeight}
                      leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
                      rightScrollbarWidthRef={this.handleRightScrollbarWidth}
                      bottomScrollbarWidthRef={this.handleTimeBottomScrollbarWidth}
                    >
                      <div
                        className='fcnew-rel'
                        style={{
                          width: timeCanvasWidth,
                          minHeight: '100%', // TODO: className for this?
                        }}
                        ref={this.handleBodyEl}
                      >
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
                          eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs as TimelineLaneSeg[] : [])}

                          // dimensions
                          slotWidth={slotWidth}
                        />
                        <Fragment>{/* TODO: need Fragment for key? */}
                          {flatGroupRowLayouts.map((groupRowLayout) => {
                            const group = groupRowLayout.entity
                            const [top, height] = bodyCoords.get(group) || []
                            return (
                              <div
                                key={String(group.value)}
                                role='row'
                                class='fcnew-row'
                                style={{ top, height }}
                              >
                                <GroupLane
                                  group={group}
                                  innerHeightRef={this.timeEntityInnerHeightMap.createRef(group)}
                                />
                              </div>
                            )
                          })}
                          {flatResourceLayouts.map((resourceLayout) => {
                            const resource = resourceLayout.entity
                            const [top, height] = bodyCoords.get(resource) || []
                            return (
                              <div
                                key={resource.id}
                                role='row'
                                class='fcnew-row'
                                style={{ top, height }}
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
                        </Fragment>
                        {enableNowIndicator && (
                          <TimelineNowIndicatorLine
                            tDateProfile={tDateProfile}
                            nowDate={nowDate}
                            slotWidth={slotWidth}
                          />
                        )}
                      </div>
                    </Scroller>

                    {/* time-area FOOTER
                    ---------------------------------------------------------------------------- */}
                    {stickyFooterScrollbar && (
                      <Scroller
                        ref={this.timeFooterScrollerRef}
                        horizontal
                      >
                        <div style={{ width: timeCanvasWidth }}/>
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
    // scrolling
    const ScrollerSyncer = getScrollerSyncerClass(this.context.pluginHooks)
    this.timeScroller = new ScrollerSyncer(true) // horizontal=true
    this.bodyScroller = new ScrollerSyncer() // horizontal=false
    this.spreadsheetScroller = new ScrollerSyncer(true) // horizontal=true
    this.updateScrollersSyncers()
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }

  componentDidUpdate(prevProps: ResourceViewProps, state: never, scrollState: ResourceTimelineScrollState) {
    // scrolling
    this.updateScrollersSyncers()
    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
    this.applyScrollState(scrollState)
  }

  componentWillUnmount() {
    // scrolling
    this.timeScroller.destroy()
    this.bodyScroller.destroy()
    this.spreadsheetScroller.destroy()
    this.scrollResponder.detach()
  }

  getSnapshotBeforeUpdate(): ResourceTimelineScrollState {
    return this.queryScrollState()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleTwoColSizes = (spreadsheetWidth: number, mainScrollerWidth: number) => {
    this.setState({
      spreadsheetWidth,
      mainScrollerWidth,
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

  private headerSlotInnerWidth: number
  private bodySlotInnerWidth: number

  handleHeaderSlotInnerWidth = (width: number) => {
    this.headerSlotInnerWidth = width
    afterSize(this.handleSlotInnerWidths)
  }

  handleBodySlotInnerWidth = (width: number) => {
    this.bodySlotInnerWidth = width
    afterSize(this.handleSlotInnerWidths)
  }

  handleSlotInnerWidths = () => {
    const slotInnerWidth = Math.max(
      this.headerSlotInnerWidth,
      this.bodySlotInnerWidth,
    )

    if (this.state.slotInnerWidth !== slotInnerWidth) {
      this.setState({ slotInnerWidth })
    }
  }

  handleColWidthOverrides(colWidthOverrides: number[]) {
    this.setState({
      spreadsheetColWidthOverrides: colWidthOverrides,
    })
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  updateScrollersSyncers() {
    const { isRtl } = this.context

    this.timeScroller.handleChildren([
      this.timeHeaderScrollerRef.current,
      this.timeBodyScrollerRef.current,
      this.timeFooterScrollerRef.current,
    ], isRtl)
    this.bodyScroller.handleChildren([
      this.spreadsheetBodyScrollerRef.current,
      this.timeBodyScrollerRef.current,
    ], isRtl)
    this.spreadsheetScroller.handleChildren([
      this.spreadsheetHeaderScrollerRef.current,
      this.spreadsheetBodyScrollerRef.current,
      this.spreadsheetFooterScrollerRef.current,
    ], isRtl)
  }

  handleScrollRequest = (request: ScrollRequest) => {
    const { props, context } = this
    let slotWidth = this.slotWidth
    let tDateProfile = this.tDateProfile

    if (request.time) {
      if (slotWidth != null && tDateProfile != null) {
        let x = timeToCoord(request.time, context.dateEnv, props.dateProfile, tDateProfile, slotWidth)
        this.timeScroller.scrollTo({ x })
        return true
      }
    }

    return false
  }

  queryScrollState(): ResourceTimelineScrollState {
    let { bodyLayouts, bodyCoords } = this
    let scrollTop = this.bodyScroller.y
    let scrollState: ResourceTimelineScrollState = {}

    if (bodyCoords) {
      let [entity, elTop, elHeight] = findEntityByCoord(
        bodyLayouts,
        bodyCoords,
        scrollTop,
      )

      if (entity) {
        let elBottom = elTop + elHeight
        let elBottomRelScroller = elBottom - scrollTop

        scrollState.fromBottom = elBottomRelScroller
        scrollState.entity = entity
      }
    }

    return scrollState
  }

  applyScrollState(scrollState: ResourceTimelineScrollState) {
    const { bodyLayouts, bodyCoords } = this
    let { entity } = scrollState

    if (entity) {
      // get the real current reference
      entity = findEntityById(bodyLayouts, createEntityId(entity))

      if (entity) {
        const coords = bodyCoords.get(entity)

        if (coords) {
          const [start, size] = coords
          const end = start + size

          let scrollTop =
            scrollState.fromBottom != null ?
              end - scrollState.fromBottom : // pixels from bottom edge
              start // just use top edge

          this.bodyScroller.scrollTo({ y: scrollTop })
        }
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
    let { bodyLayouts, bodyCoords } = this
    let { dateProfile } = this.props
    const { dateEnv, isRtl } = this.context
    const tDateProfile = this.tDateProfile
    const timeCanvasWidth = this.timeCanvasWidth
    const slatWidth = this.slotWidth // TODO: renames?

    let [entityAtTop, top, height] = findEntityByCoord(
      bodyLayouts,
      bodyCoords,
      positionTop,
    )

    if (entityAtTop && !isEntityGroup(entityAtTop)) {
      let resource = entityAtTop
      let bottom = top + height

      /*
      TODO: DRY-up ith TimelineView!!!
      TODO: make RTL-friendly like TimelineView
      */
      if (slatWidth) {
        const slatIndex = Math.floor(positionLeft / slatWidth)
        const slatLeft = slatIndex * slatWidth
        const partial = (positionLeft - slatLeft) / slatWidth // floating point number between 0 and 1
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
          dayEl: this.bodyEl.querySelectorAll('.fcnew-timeline-slot')[slatIndex] as HTMLElement, // TODO!
          layer: 0,
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
    resourceColSpecs,
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
