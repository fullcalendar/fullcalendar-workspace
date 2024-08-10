import {
  DateComponent,
  DateMarker,
  DateRange,
  elementClosest,
  ElementDragging,
  findElements,
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
  PointerDragEvent,
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
  DEFAULT_RESOURCE_ORDER,
  Group,
  GroupSpec,
  isEntityGroup,
  ParentNode,
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
  buildResourceDisplays,
  GroupRowDisplay,
  ResourceRowDisplay,
} from '../resource-display.js'
import {
  buildEntityCoordRanges,
  buildHeaderCoordHierarchy,
  computeSpreadsheetColHorizontals,
  findEntityByCoord,
  getCoordsByEntity,
  sliceSpreadsheetColHorizontal,
} from '../resource-positioning.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import { GroupTallCell } from './spreadsheet/GroupTallCell.js'
import { GroupWideCell } from './spreadsheet/GroupWideCell.js'
import { HeaderRow } from './spreadsheet/HeaderRow.js'
import { ResourceCells } from './spreadsheet/ResourceCells.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'

interface ResourceTimelineViewState {
  slotInnerWidth?
  spreadsheetColWidths: number[]
  spreadsheetViewportWidth?: number // TODO: rename
  mainScrollerWidth?: number
  mainScrollerHeight?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  spreadsheetBottomScrollbarWidth?: number
  timeBottomScrollbarWidth?: number
}

interface ResourceTimelineScrollState { // ???
  resourceId?: string
  groupValue?: any
  fromBottom?: number
}

const SPREADSHEET_COL_MIN_WIDTH = 20

export class ResourceTimelineView extends DateComponent<ResourceViewProps, ResourceTimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private buildResourceDisplays = memoize(buildResourceDisplays)
  private buildHeaderHeightHierarchy = memoize(buildHeaderCoordHierarchy)
  private buildHeaderVerticalPositions = memoize(buildEntityCoordRanges)
  private buildBodyVerticalPositions = memoize(buildEntityCoordRanges)
  private computeSlotWidth = memoize(computeSlotWidth)
  private computeSpreadsheetColHorizontals = memoize(computeSpreadsheetColHorizontals)
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)

  // refs
  private spreadsheetHeaderScrollerRef = createRef<Scroller>()
  private spreadsheetBodyScrollerRef = createRef<Scroller>()
  private spreadsheetFooterScrollerRef = createRef<Scroller>()
  private timeHeaderScrollerRef = createRef<Scroller>()
  private timeBodyScrollerRef = createRef<Scroller>()
  private timeFooterScrollerRef = createRef<Scroller>()
  private bodyEl: HTMLElement
  private headerRowInnerHeightMap = new RefMap<boolean | number, number>()

  private spreadsheetEntityInnerHeightMap = new RefMap<Group | Resource, number>()
  private timeEntityInnerHeightMap = new RefMap<Group | Resource, number>()

  private currentTDateProfile?: TimelineDateProfile
  private currentCanvasWidth?: number
  private currentSlotWidth?: number
  private currentGroupRowDisplays: GroupRowDisplay[]
  private currentResourceRowDisplays: ResourceRowDisplay[]
  private currentBodyHeightHierarchy: ParentNode<Resource | Group>[]
  private currentBodyEntityHeightMap?: Map<Resource | Group, number>

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

    let tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    this.currentTDateProfile = tDateProfile
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
      resourceColSpecs,
      superHeaderRendering,
    } = this.processColOptions(context.options)

    /* table hierarchy */

    let resourceHierarchy = this.buildResourceHierarchy(
      props.resourceStore,
      groupSpecs,
      orderSpecs,
    )

    /* table display */

    let {
      groupColDisplays,
      groupRowDisplays,
      resourceRowDisplays,
      heightHierarchy: bodyHeightHierarchy,
      anyNesting,
    } = this.buildResourceDisplays(
      resourceHierarchy,
      groupRowDepth,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.currentGroupRowDisplays = groupRowDisplays
    this.currentResourceRowDisplays = resourceRowDisplays
    this.currentBodyHeightHierarchy = bodyHeightHierarchy

    /* table positions */

    let headerHeightHierarchy = this.buildHeaderHeightHierarchy( // !!!
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    let headerRowHeightMap = this.buildHeaderVerticalPositions(
      headerHeightHierarchy,
      (entity) => this.headerRowInnerHeightMap.current.get(entity),
    )

    let bodyEntityHeightMap = this.buildBodyVerticalPositions(
      bodyHeightHierarchy,
      (entity) => Math.max(
        this.spreadsheetEntityInnerHeightMap.current.get(entity),
        this.timeEntityInnerHeightMap.current.get(entity) || 0,
      ),
      state.mainScrollerHeight,
    )
    this.currentBodyEntityHeightMap = bodyEntityHeightMap

    let { slotMinWidth } = options
    let [slotWidth, timeCanvasWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      slotMinWidth,
      state.slotInnerWidth,
      state.mainScrollerWidth
    )
    this.currentCanvasWidth = timeCanvasWidth
    this.currentSlotWidth = slotWidth

    let [spreadsheetColWidths, spreadsheetCanvasWidth] = this.computeSpreadsheetColHorizontals(
      colSpecs,
      state.spreadsheetColWidths,
      state.spreadsheetViewportWidth,
    )
    let spreadsheetResourceWidth = sliceSpreadsheetColHorizontal(
      spreadsheetColWidths,
      groupColDisplays.length, // start slicing here
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

    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(resourceRowDisplays)
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
                'fcnew-flexexpand', // expand within fc-view-harness
                'fcnew-flexparent',
                'fc-resource-timeline',
                !anyNesting && 'fc-resource-timeline-flat', // flat means there's no nesting
                'fc-timeline',
                options.eventOverlap === false ?
                  'fc-timeline-overlap-disabled' :
                  'fc-timeline-overlap-enabled',
              ]}
              viewSpec={viewSpec}
            >
              <ResizableTwoCol
                className={'fcnew-flexexpand'}
                onSizes={this.handleTwoColSizes}

                /* spreadsheet
                --------------------------------------------------------------------------------- */

                startClassName='fcnew-flexparent'
                startContent={() => (
                  <Fragment>

                    {/* spreadsheet HEADER
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      horizontal
                      hideScrollbars
                      elClassNames={[stickyHeaderDates ? 'fcnew-v-sticky' : '']}
                      ref={this.spreadsheetHeaderScrollerRef}
                    >
                      <div
                        class='fc-datagrid-header'
                        style={{ width: spreadsheetCanvasWidth }}
                      >
                        {Boolean(superHeaderRendering) && (
                          <div
                            role="row"
                            style={{
                              height: headerRowHeightMap.get(true) // true means superheader
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
                          resizerElRefMap={this.resizerElRefs /* TODO: get rid of this */}

                          // refs
                          innerHeightRef={this.headerRowInnerHeightMap.createRef(false)}

                          // dimension
                          height={headerRowHeightMap.get(false) /* false means normalheader */}
                        />
                      </div>
                    </Scroller>

                    {/* spreadsheet BODY
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      vertical={verticalScrolling}
                      horizontal
                      hideScrollbars
                      elClassNames={['fcnew-flexexpand']}
                      ref={this.spreadsheetBodyScrollerRef}
                    >
                      <div
                        className='fc-datagrid-body'
                        style={{
                          width: spreadsheetCanvasWidth,
                          paddingBottom: state.spreadsheetBottomScrollbarWidth - state.timeBottomScrollbarWidth,
                        }}
                      >
                        {/* group columns > cells */}
                        <Fragment>
                          {groupColDisplays.map((groupCellDisplays, colIndex) => (
                            <div
                              key={colIndex}
                              style={{ width: spreadsheetColWidths[colIndex] }}
                            >
                              {groupCellDisplays.map((groupCellDisplay) => {
                                const { group } = groupCellDisplay
                                return (
                                  <div
                                    key={queryObjKey(group)}
                                    class='fcnew-row'
                                    role='row'
                                    style={{
                                      height: bodyEntityHeightMap.get(group)
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

                        {/* QUESTION: what about DOM order for resources within a group??? */}

                        {/* group rows */}
                        <Fragment>
                          {groupRowDisplays.map((groupRowDisplay) => {
                            const { group } = groupRowDisplay
                            return (
                              <div
                                key={String(group.value)}
                                class='fcnew-row'
                                role='row'
                                style={{
                                  height: bodyEntityHeightMap.get(group)
                                }}
                              >
                                <GroupWideCell
                                  group={group}
                                  isExpanded={groupRowDisplay.isExpanded}
                                  innerHeightRef={this.spreadsheetEntityInnerHeightMap.createRef(group)}
                                />
                              </div>
                            )
                          })}
                        </Fragment>

                        {/* resource rows */}
                        <div style={{
                          width: spreadsheetResourceWidth, // NOT CORRECT. will change when resource/grouprows are ordered
                        }}>
                          {resourceRowDisplays.map((resourceRowDisplay) => {
                            const { resource } = resourceRowDisplay
                            return (
                              <div
                                key={resource.id}
                                class='fcnew-row'
                                role='row'
                                style={{
                                  height: bodyEntityHeightMap.get(resource)
                                }}
                              >
                                <ResourceCells
                                  resource={resource}
                                  resourceFields={resourceRowDisplay.resourceFields}
                                  depth={resourceRowDisplay.depth}
                                  hasChildren={resourceRowDisplay.hasChildren}
                                  isExpanded={resourceRowDisplay.isExpanded}
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
                )}

                /* time-area
                --------------------------------------------------------------------------------- */

                endClassName='fcnew-flexparent'
                endContent={() => (
                  <Fragment>

                    {/* time-area HEADER
                    ---------------------------------------------------------------------------- */}
                    <Scroller
                      ref={this.timeHeaderScrollerRef}
                      horizontal
                      hideScrollbars
                      elClassNames={[stickyHeaderDates ? 'fcnew-v-sticky' : '']}
                    >
                      <div style={{
                        width: timeCanvasWidth,
                        paddingLeft: state.leftScrollbarWidth,
                        paddingRight: state.rightScrollbarWidth,
                      }}>
                        {cellRows.map((cells, rowLevel) => (
                          <TimelineHeaderRow
                            key={rowLevel}
                            dateProfile={props.dateProfile}
                            tDateProfile={tDateProfile}
                            nowDate={nowDate}
                            todayRange={todayRange}
                            rowLevel={rowLevel}
                            isLastRow={rowLevel === cellRows.length - 1}
                            cells={cells}
                            slotWidth={slotWidth}
                            innerWidthRef={this.handleHeaderSlotInnerWidth}
                            innerHeighRef={this.headerRowInnerHeightMap.createRef(rowLevel)}
                          />
                        ))}
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
                      ref={this.timeBodyScrollerRef}
                      vertical={verticalScrolling}
                      horizontal
                      heightRef={this.handleMainScrollerHeight}
                      leftScrollbarWidthRef={this.handleLeftScrollbarWidth}
                      rightScrollbarWidthRef={this.handleRightScrollbarWidth}
                      bottomScrollbarWidthRef={this.handleTimeBottomScrollbarWidth}
                    >
                      <div
                        ref={this.handleBodyEl}
                        className='fc-timeline-body'
                        style={{ width: timeCanvasWidth }}
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
                        <Fragment>
                          {groupRowDisplays.map((groupRowDisplay) => {
                            const { group } = groupRowDisplay
                            return (
                              <div
                                key={String(group.value)}
                                class='fcnew-row'
                                role='row'
                                style={{
                                  height: bodyEntityHeightMap.get(group)
                                }}
                              >
                                <GroupLane
                                  group={group}
                                  innerHeightRef={this.timeEntityInnerHeightMap.createRef(group)}
                                />
                              </div>
                            )
                          })}
                        </Fragment>
                        <Fragment>
                          {resourceRowDisplays.map((resourceRowDisplay) => {
                            const { resource } = resourceRowDisplay
                            return (
                              <div
                                key={resource.id}
                                class='fcnew-row'
                                role='row'
                                style={{
                                  height: bodyEntityHeightMap.get(resource)
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
                )}
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

  componentDidUpdate(prevProps: ResourceViewProps) {
    // scrolling
    this.updateScrollersSyncers()
    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
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

  handleTwoColSizes = (spreadsheetViewportWidth: number, mainScrollerWidth: number) => {
    this.setState({
      spreadsheetViewportWidth,
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
  }

  handleBodySlotInnerWidth = (width: number) => {
    this.bodySlotInnerWidth = width
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

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  updateScrollersSyncers() {
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

  handleScrollRequest = (request: ScrollRequest) => {
    const { props, context } = this
    let slotWidth = this.currentSlotWidth
    let tDateProfile = this.currentTDateProfile

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
    let { currentBodyHeightHierarchy, currentBodyEntityHeightMap } = this
    let scrollTop = this.bodyScroller.y
    let scrollState: ResourceTimelineScrollState = {}

    let [entityAtTop, elTop, elHeight] = findEntityByCoord(
      scrollTop,
      currentBodyHeightHierarchy,
      currentBodyEntityHeightMap,
    )

    if (entityAtTop) {
      let elBottom = elTop + elHeight
      let elBottomRelScroller = elBottom - scrollTop

      scrollState.fromBottom = elBottomRelScroller

      if (isEntityGroup(entityAtTop)) {
        scrollState.groupValue = entityAtTop.value
      } else {
        scrollState.resourceId = entityAtTop.id
      }
    }

    return scrollState
  }

  /*
  WHEN IS THIS EVER APPLIED!!??
  */
  applyScrollState(scrollState: ResourceTimelineScrollState) {
    let { currentGroupRowDisplays, currentResourceRowDisplays } = this
    let entity: Resource | Group | undefined

    // find entity. hack
    if (scrollState.resourceId) {
      for (const resourceRowDisplay of currentResourceRowDisplays) {
        if (resourceRowDisplay.resource.id === scrollState.resourceId) {
          entity = resourceRowDisplay.resource
          break
        }
      }
    } else if (scrollState.groupValue !== undefined) {
      for (const groupRowDisplay of currentGroupRowDisplays) {
        if (groupRowDisplay.group.value === scrollState.groupValue) {
          entity = groupRowDisplay.group
          break
        }
      }
    }

    if (entity) {
      const coords = getCoordsByEntity(entity, this.currentBodyEntityHeightMap, this.currentBodyHeightHierarchy)

      if (coords) {
        const { start, size } = coords
        const end = start + size

        let scrollTop =
          scrollState.fromBottom != null ?
            end - scrollState.fromBottom : // pixels from bottom edge
            start // just use top edge

        this.bodyScroller.scrollTo({ y: scrollTop })
      }
    }
  }

  // Resource INDIVIDUAL-Column Area Resizing
  // -----------------------------------------------------------------------------------------------
  /*
  TODO: move this to SpreadsheetHeader
  */

  private resizerElRefs = new RefMap<number, HTMLDivElement>(this.handleColResizerEl.bind(this)) // indexed by colIndex
  private colDraggings: { [index: string]: ElementDragging } = {}

  handleColResizerEl(resizerEl: HTMLElement | null, index: number) {
    let { colDraggings } = this

    if (!resizerEl) {
      let dragging = colDraggings[index]

      if (dragging) {
        dragging.destroy()
        delete colDraggings[index]
      }
    } else {
      let dragging = this.initColResizing(resizerEl, index)

      if (dragging) {
        colDraggings[index] = dragging
      }
    }
  }

  initColResizing(resizerEl: HTMLElement, index: number) {
    let { pluginHooks, isRtl } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(resizerEl)
      let startWidth: number // of just the single column
      let currentWidths: number[] // of all columns

      dragging.emitter.on('dragstart', () => {
        let allCells = findElements(elementClosest(resizerEl, 'tr'), 'th') // TODO: change tag names!!!

        currentWidths = allCells.map((cellEl) => (
          cellEl.getBoundingClientRect().width
        ))
        startWidth = currentWidths[index]
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        currentWidths[index] = Math.max(startWidth + pev.deltaX * (isRtl ? -1 : 1), SPREADSHEET_COL_MIN_WIDTH)

        this.handleColWidthChange(currentWidths.slice()) // send a copy since currentWidths continues to be mutated
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

      return dragging
    }

    return null
  }

  handleColWidthChange(colWidths: number[]) {
    this.setState({
      spreadsheetColWidths: colWidths,
    })
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
    let { currentBodyHeightHierarchy, currentBodyEntityHeightMap } = this
    let { dateProfile } = this.props
    const { dateEnv, isRtl } = this.context
    const tDateProfile = this.currentTDateProfile
    const canvasWidth = this.currentCanvasWidth
    const slatWidth = this.currentSlotWidth // TODO: renames?

    let [entityAtTop, top, height] = findEntityByCoord(
      positionTop,
      currentBodyHeightHierarchy,
      currentBodyEntityHeightMap,
    )

    if (entityAtTop && !isEntityGroup(entityAtTop)) {
      let resource = entityAtTop
      let bottom = top + height

      /*
      TODO: DRY-up ith TimelineView!!!
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
          left = canvasWidth - endCoord
          right = canvasWidth - startCoord
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
          dayEl: this.bodyEl.querySelectorAll('.fcnew-slat')[slatIndex] as HTMLElement, // TODO!
          layer: 0,
        }
      }
    }

    return null
  }
}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidths: isArraysEqual,
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

  return {
    groupSpecs,
    groupRowDepth,
    orderSpecs: plainOrderSpecs,
    colSpecs: groupColSpecs.concat(resourceColSpecs),
    resourceColSpecs,
    superHeaderRendering,
  }
}

function computeHasResourceBusinessHours(resourceRowDisplays: ResourceRowDisplay[]) {
  for (let resourceRowDisplay of resourceRowDisplays) {
    let { resource } = resourceRowDisplay

    if (resource && resource.businessHours) {
      return true
    }
  }

  return false
}

// General Utils
// -------------------------------------------------------------------------------------------------

const keyMap = new WeakMap<any, string>()

function queryObjKey(obj: any): string {
  if (keyMap.has(obj)) {
    return keyMap.get(obj)
  }

  const key = guid()
  keyMap.set(obj, key)
  return key
}
