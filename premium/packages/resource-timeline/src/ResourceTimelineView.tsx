import { CssDimValue, Duration } from '@fullcalendar/core'
import {
  ViewContext, memoize,
  isArraysEqual,
  ScrollRequest, ViewContainer, ViewOptionsRefined,
  RefMap, ElementDragging,
  findElements,
  elementClosest,
  PointerDragEvent,
  Hit,
  DateComponent,
  greatestDurationDenominator,
  NowTimer,
  DateMarker,
  DateRange,
  NowIndicatorContainer,
  getStickyHeaderDates,
  getStickyFooterScrollbar,
  NewScroller,
  RefMapKeyed,
  guid,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import {
  buildTimelineDateProfile, TimelineHeader,
  TimelineCoords,
  TimelineLaneSlicer,
  TimelineSlats,
  coordToCss,
  TimelineLaneSeg,
  TimelineLaneBg,
  createHorizontalStyle,
  CoordRange,
  computeSlotWidth,
  createVerticalStyle,
} from '@fullcalendar/timeline/internal'
import {
  ResourceViewProps,
  ColSpec, GroupSpec, DEFAULT_RESOURCE_ORDER,
  buildResourceHierarchy,
  Group,
  Resource,
  ParentNode,
  isEntityGroup,
  ResourceSplitter,
} from '@fullcalendar/resource/internal'
import { ScrollController, ScrollJoiner } from '@fullcalendar/scrollgrid/internal'
import { ResourceCells } from './spreadsheet/ResourceCells.js'
import { GroupWideCell } from './spreadsheet/GroupWideCell.js'
import { GroupTallCell } from './spreadsheet/GroupTallCell.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'
import { HeaderCell } from './spreadsheet/HeaderCell.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import {
  GroupRowDisplay,
  ResourceRowDisplay,
  buildResourceDisplays,
} from './resource-display.js'
import {
  buildHeaderCoordHierarchy,
  buildEntityCoordRanges,
  findEntityByCoord,
  computeSpreadsheetColHorizontals,
  sliceSpreadsheetColHorizontal,
} from './resource-positioning.js'

interface ResourceTimelineViewState {
  resourceAreaWidth: CssDimValue
  spreadsheetColWidths: number[]
  slatCoords?: TimelineCoords
  slotCushionMaxWidth?: number
  viewInnerHeight?: number
  spreadsheetViewportWidth?: number
  timeViewportWidth?: number
  leftScrollbarWidth?: number
  rightScrollbarWidth?: number
  spreadsheetBottomScrollbarWidth?: number
  timeBottomScrollbarWidth?: number
  headerNaturalHeightMap?: Map<boolean | number, number>
  bodyNaturalHeightMap?: Map<Resource | Group, number>
}

interface ResourceScrollState {
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
  private twoColElRef = createRef<HTMLDivElement>()
  private superHeaderRef = createRef<HTMLDivElement>()
  private normalHeaderRef = createRef<HTMLDivElement>()
  private timeHeaderRefMap = new RefMapKeyed<number, HTMLDivElement>()
  private spreadsheetGroupTallRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private spreadsheetGroupWideRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private spreadsheetResourceRefMap = new RefMapKeyed<Resource, HTMLDivElement>()
  private timeGroupWideRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private timeResourceRefMap = new RefMapKeyed<Resource, HTMLDivElement>()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit system

  // current
  private currentGroupRowDisplays: GroupRowDisplay[]
  private currentResourceRowDisplays: ResourceRowDisplay[]
  private currentBodyHeightHierarchy: ParentNode<Resource | Group>[]
  private currentBodyVerticals?: Map<Resource | Group, CoordRange>

  // unmanaged state
  private resourceSplitter = new ResourceSplitter()
  private bgSlicer = new TimelineLaneSlicer()
  private resourceLaneUnstableCount = 0
  private forcedTimeScroll?: Duration
  private currentResourceScroll?: ResourceScrollState

  // scroll managers
  private spreadsheetHeaderScroll = new ScrollController()
  private spreadsheetBodyScroll = new ScrollController()
  private spreadsheetFooterScroll = new ScrollController()
  private timeHeaderScroll = new ScrollController()
  private timeBodyScroll = new ScrollController()
  private timeFooterScroll = new ScrollController()
  private timeScrolls = new ScrollJoiner([
    this.timeHeaderScroll,
    this.timeBodyScroll,
    this.timeFooterScroll,
  ], true)
  private bodyScrolls = new ScrollJoiner([ // for resources
    this.spreadsheetBodyScroll,
    this.timeBodyScroll,
  ])

  constructor(props: ResourceViewProps, context: ViewContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: [],
    }

    // scroll manager further initialization
    this.timeScrolls.addScrollListener(() => {
      this.forcedTimeScroll = undefined
    })
    this.bodyScrolls.addScrollListener(() => {
      this.currentResourceScroll = this.queryResourceScroll()
    })

    // scroll manager that doesn't need to be referenced
    new ScrollJoiner([
      this.spreadsheetHeaderScroll,
      this.spreadsheetBodyScroll,
      this.spreadsheetFooterScroll,
    ], true)
  }

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
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    /* table settings */

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

    let headerHeightHierarchy = this.buildHeaderHeightHierarchy(
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    let [headerVerticalPositions, headerTotalHeight] = this.buildHeaderVerticalPositions(
      headerHeightHierarchy,
      state.headerNaturalHeightMap,
    )

    let { viewInnerHeight } = state
    let rowsMinHeight = (
      options.expandRows && !props.isHeightAuto &&
      viewInnerHeight !== undefined && headerTotalHeight !== undefined
    ) ? viewInnerHeight - headerTotalHeight
      : undefined

    let [bodyVerticals] = this.buildBodyVerticalPositions(
      bodyHeightHierarchy,
      state.bodyNaturalHeightMap,
      rowsMinHeight,
    )
    this.currentBodyVerticals = bodyVerticals

    let { slotMinWidth } = options
    let [normalSlotWidth, lastSlotWidth, timeCanvasWidth] = this.computeSlotWidth(
      tDateProfile,
      slotMinWidth,
      state.slotCushionMaxWidth,
      state.timeViewportWidth
    )

    let [spreadsheetColHorizontals, spreadsheetCanvasWidth] = this.computeSpreadsheetColHorizontals(
      colSpecs,
      state.spreadsheetColWidths,
      state.spreadsheetViewportWidth,
    )
    let resourceHorizontal = sliceSpreadsheetColHorizontal(
      spreadsheetColHorizontals,
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
      <ViewContainer
        elClasses={[
          'fc-newnew-flexexpand', // expand within fc-view-harness
          'fc-newnew-flexparent',
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
          onSizes={this.handleTwoColSizes}
          elRef={this.twoColElRef}
          className={'fc-newnew-flexexpand'}

          /* spreadsheet */

          startClassName='fc-newnew-flexparent'
          startContent={() => (
            <Fragment>

              {/* spreadsheet HEADER */}
              <NewScroller
                horizontal
                hideBars
                className={stickyHeaderDates ? 'fc-newnew-v-sticky' : ''}
                elRef={this.spreadsheetHeaderScroll.handleEl}
              >
                <div
                  class='fc-datagrid-header'
                  style={{ width: spreadsheetCanvasWidth }}
                >
                  {Boolean(superHeaderRendering) && (
                    <div role="row" ref={this.superHeaderRef}>
                      <SuperHeaderCell
                        renderHooks={superHeaderRendering}
                      />
                    </div>
                  )}
                  <div role="row" ref={this.normalHeaderRef}>
                    {colSpecs.map((colSpec, colIndex) => {
                      const horizontal = spreadsheetColHorizontals[colIndex] // could be undefined
                      return (
                        <div
                          key={colIndex}
                          style={{ width: horizontal ? horizontal.size : undefined }}
                        >
                          <HeaderCell
                            colSpec={colSpec}
                            resizer={colIndex < colSpecs.length - 1}
                            resizerElRef={this.resizerElRefs.createRef(colIndex)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </NewScroller>

              {/* spreadsheet BODY */}
              <NewScroller
                vertical
                horizontal
                hideBars
                className='fc-newnew-flexexpand'
                elRef={this.spreadsheetBodyScroll.handleEl}
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
                    {groupColDisplays.map((groupCellDisplays, colIndex) => {
                      const horizontal = spreadsheetColHorizontals[colIndex] // might be undefined
                      return (
                        <div
                          key={colIndex}
                          style={createHorizontalStyle(horizontal, context.isRtl)}
                        >
                          {groupCellDisplays.map((groupCellDisplay) => {
                            const { group } = groupCellDisplay
                            const vertical = bodyVerticals && bodyVerticals.get(group)
                            return (
                              <div
                                key={queryObjKey(group)}
                                class='fc-newnew-row'
                                role='row'
                                style={createVerticalStyle(vertical)}
                                ref={this.spreadsheetGroupTallRefMap.createRef(group)}
                              >
                                <GroupTallCell
                                  colSpec={group.spec}
                                  fieldValue={group.value}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </Fragment>

                  {/* group rows */}
                  <Fragment>
                    {groupRowDisplays.map((groupRowDisplay) => {
                      const { group } = groupRowDisplay
                      const vertical = bodyVerticals && bodyVerticals.get(group)
                      return (
                        <div
                          key={String(group.value)}
                          class='fc-newnew-row'
                          role='row'
                          style={createVerticalStyle(vertical)}
                          ref={this.spreadsheetGroupWideRefMap.createRef(group.value)}
                        >
                          <GroupWideCell
                            group={group}
                            isExpanded={groupRowDisplay.isExpanded}
                          />
                        </div>
                      )
                    })}
                  </Fragment>

                  {/* resource rows */}
                  <div style={createHorizontalStyle(resourceHorizontal, context.isRtl)}>
                    {resourceRowDisplays.map((resourceRowDisplay) => {
                      const { resource } = resourceRowDisplay
                      const vertical = bodyVerticals && bodyVerticals.get(resource)
                      return (
                        <div
                          key={resource.id}
                          class='fc-newnew-row'
                          role='row'
                          style={createVerticalStyle(vertical)}
                          ref={this.spreadsheetResourceRefMap.createRef(resource)}
                        >
                          <ResourceCells
                            resource={resource}
                            resourceFields={resourceRowDisplay.resourceFields}
                            depth={resourceRowDisplay.depth}
                            hasChildren={resourceRowDisplay.hasChildren}
                            isExpanded={resourceRowDisplay.isExpanded}
                            colSpecs={resourceColSpecs}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </NewScroller>

              {/* spreadsheet FOOTER scrollbar */}
              <NewScroller
                horizontal
                onBottomScrollbarWidth={this.handleSpreadsheetBottomScrollbarWidth}
                elRef={this.spreadsheetFooterScroll.handleEl}
              >
                <div style={{ width: spreadsheetCanvasWidth }} />
              </NewScroller>
            </Fragment>
          )}

          /* time-area */

          endClassName='fc-newnew-flexparent'
          endContent={() => (
            <Fragment>

              {/* time-area HEADER */}
              <NewScroller
                horizontal
                hideBars
                className={stickyHeaderDates ? 'fc-newnew-v-sticky' : ''}
                elRef={this.timeHeaderScroll.handleEl}
              >
                <div style={{
                  width: timeCanvasWidth,
                  paddingLeft: state.leftScrollbarWidth,
                  paddingRight: state.rightScrollbarWidth,
                }}>
                  <TimelineHeader
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    slatCoords={state.slatCoords}
                    onMaxCushionWidth={this.handleMaxCushionWidth}
                    normalSlotWidth={normalSlotWidth}
                    lastSlotWidth={lastSlotWidth}
                    verticalPositions={headerVerticalPositions}
                    rowRefMap={this.timeHeaderRefMap}
                  />
                </div>
              </NewScroller>

              {/* time-area BODY (resources) */}
              <NewScroller
                vertical
                horizontal
                elRef={this.timeBodyScroll.handleEl}
                onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
                onRightScrollbarWidth={this.handleRightScrollbarWidth}
                onBottomScrollbarWidth={this.handleTimeBottomScrollbarWidth}
              >
                <div
                  ref={this.handleBodyEl}
                  className='fc-timeline-body'
                  style={{ width: timeCanvasWidth }}
                >
                  <NowTimer unit={timerUnit}>
                    {(nowDate: DateMarker, todayRange: DateRange) => (
                      <Fragment>
                        <TimelineSlats
                          ref={this.slatsRef}
                          dateProfile={dateProfile}
                          tDateProfile={tDateProfile}
                          nowDate={nowDate}
                          todayRange={todayRange}
                          normalSlotWidth={normalSlotWidth}
                          lastSlotWidth={lastSlotWidth}
                          onCoords={this.handleSlatCoords}
                        />
                        <TimelineLaneBg
                          businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                          bgEventSegs={bgSlicedProps.bgEventSegs}
                          timelineCoords={state.slatCoords}
                          // empty array will result in unnecessary rerenders?
                          eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs as TimelineLaneSeg[] : [])}
                          dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                          nowDate={nowDate}
                          todayRange={todayRange}
                        />
                        <Fragment>
                          {groupRowDisplays.map((groupRowDisplay) => {
                            const { group } = groupRowDisplay
                            const vertical = bodyVerticals && bodyVerticals.get(group)
                            return (
                              <div
                                key={String(group.value)}
                                class='fc-newnew-row'
                                role='row'
                                style={createVerticalStyle(vertical)}
                                ref={this.timeGroupWideRefMap.createRef(group.value)}
                              >
                                <GroupLane group={group} />
                              </div>
                            )
                          })}
                        </Fragment>
                        <Fragment>
                          {resourceRowDisplays.map((resourceRowDisplay) => {
                            const { resource } = resourceRowDisplay
                            const vertical = bodyVerticals && bodyVerticals.get(resource)
                            return (
                              <div
                                key={resource.id}
                                class='fc-newnew-row'
                                role='row'
                                style={createVerticalStyle(vertical)}
                                ref={this.timeResourceRefMap.createRef(resource)}
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
                                  timelineCoords={state.slatCoords}
                                  onHeightStable={this.handleResourceLaneStable}
                                />
                              </div>
                            )
                          })}
                        </Fragment>
                        {(context.options.nowIndicator && state.slatCoords && state.slatCoords.isDateInRange(nowDate)) && (
                          <div className="fc-timeline-now-indicator-container">
                            <NowIndicatorContainer
                              elClasses={['fc-timeline-now-indicator-line']}
                              elStyle={coordToCss(state.slatCoords.dateToCoord(nowDate), context.isRtl)}
                              isAxis={false}
                              date={nowDate}
                            />
                          </div>
                        )}
                      </Fragment>
                    )}
                  </NowTimer>
                </div>
              </NewScroller>

              {/* time-area FOOTER */}
              {stickyFooterScrollbar && (
                <NewScroller
                  horizontal
                  elRef={this.timeFooterScroll.handleEl}
                >
                  <div style={{ width: timeCanvasWidth }}/>
                </NewScroller>
              )}

            </Fragment>
          )}
        />
      </ViewContainer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    // sizing
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)

    // scrolling
    this.handleTimeScroll(this.context.options.scrollTime)
    this.context.emitter.on('_scrollRequest', this.handleScroll)
  }

  componentDidUpdate(
    prevProps: ResourceViewProps,
    prevState: ResourceTimelineViewState,
  ) {
    this.handleSizing()

    // changes that affect horizontal coordinates
    if (
      prevProps.dateProfile !== this.props.dateProfile ||
      prevState.slatCoords !== this.state.slatCoords
    ) {
      this.applyTimeScroll()
    }

    // changes that affect vertical coordinates
    if (
      prevProps.resourceStore !== this.props.resourceStore ||
      prevProps.eventStore !== this.props.eventStore
    ) {
      this.applyResourceScroll()
    }
  }

  componentWillUnmount() {
    // sizing
    this.context.removeResizeHandler(this.handleSizing)

    // scrolling
    this.context.emitter.off('_scrollRequest', this.handleScroll)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSizing = () => {
    this.handleRowSizing()
    this.handleViewInnerSizing()
  }

  handleResourceLaneStable = (isStable) => {
    this.resourceLaneUnstableCount += (isStable ? -1 : 1)
    this.handleRowSizing()
  }

  handleRowSizing = () => {
    if (!this.resourceLaneUnstableCount) {
      const headerNaturalHeightMap = new Map<boolean | number, number>()
      const bodyNaturalHeightMap = new Map<Resource | Group, number>()

      if (this.superHeaderRef.current) {
        headerNaturalHeightMap.set(
          true,
          this.superHeaderRef.current.offsetHeight,
        )
      }

      headerNaturalHeightMap.set(
        false,
        this.normalHeaderRef.current.offsetHeight,
      )

      for (const [rowIndex, el] of this.timeHeaderRefMap.current.entries()) {
        headerNaturalHeightMap.set(rowIndex, el.offsetHeight)
      }

      for (const [group, el] of this.spreadsheetGroupTallRefMap.current.entries()) {
        bodyNaturalHeightMap.set(group, el.offsetHeight)
      }

      for (const [group, el] of this.spreadsheetGroupWideRefMap.current.entries()) {
        bodyNaturalHeightMap.set(
          group,
          Math.max(
            el.offsetHeight,
            this.timeGroupWideRefMap.current.get(group).offsetHeight,
          )
        )
      }

      for (const [resource, el] of this.spreadsheetResourceRefMap.current.entries()) {
        bodyNaturalHeightMap.set(
          resource,
          Math.max(
            el.offsetHeight,
            this.timeResourceRefMap.current.get(resource).offsetHeight,
          ),
        )
      }

      this.setState({
        headerNaturalHeightMap,
        bodyNaturalHeightMap,
      })
    }
  }

  /*
  TODO: have Calendar, which creates view-harness and sets height on it, tell us about height explicitly?
  */
  handleViewInnerSizing = () => {
    this.setState({
      viewInnerHeight: this.twoColElRef.current.offsetHeight
    })
  }

  handleTwoColSizes = (spreadsheetViewportWidth: number, timeViewportWidth: number) => {
    this.setState({
      spreadsheetViewportWidth,
      timeViewportWidth,
    })
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth,
    })
  }

  handleSlatCoords = (slatCoords: TimelineCoords) => {
    this.setState({
      slatCoords,
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

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  handleScroll = (request: ScrollRequest) => {
    if (request.time) {
      this.handleTimeScroll(request.time)
    }
  }

  handleTimeScroll = (time: Duration) => {
    this.forcedTimeScroll = time
    this.applyTimeScroll()
  }

  applyTimeScroll() {
    let timeScroll = this.forcedTimeScroll

    if (timeScroll) {
      let { slatCoords } = this.state
      if (slatCoords) {
        let scrollLeft = slatCoords.coordFromLeft(slatCoords.durationToCoord(timeScroll))
        this.timeScrolls.scrollTo(scrollLeft)
      }
    }
  }

  applyResourceScroll() {
    let resourceScroll = this.currentResourceScroll

    if (resourceScroll) {
      let { currentGroupRowDisplays, currentResourceRowDisplays, currentBodyVerticals } = this
      let entity: Resource | Group | undefined

      // find entity. hack
      if (resourceScroll.resourceId) {
        for (const resourceRowDisplay of currentResourceRowDisplays) {
          if (resourceRowDisplay.resource.id === resourceScroll.resourceId) {
            entity = resourceRowDisplay.resource
            break
          }
        }
      } else if (resourceScroll.groupValue !== undefined) {
        for (const groupRowDisplay of currentGroupRowDisplays) {
          if (groupRowDisplay.group.value === resourceScroll.groupValue) {
            entity = groupRowDisplay.group
            break
          }
        }
      }

      if (entity) {
        const vertical = currentBodyVerticals && currentBodyVerticals.get(entity)

        if (vertical) {
          const { start, size } = vertical
          const end = start + size

          let scrollTop =
            resourceScroll.fromBottom != null ?
              end - resourceScroll.fromBottom : // pixels from bottom edge
              start // just use top edge

          this.bodyScrolls.scrollTo(scrollTop)
        }
      }
    }
  }

  queryResourceScroll(): ResourceScrollState {
    let { currentBodyHeightHierarchy, currentBodyVerticals } = this
    let scrollTop = this.bodyScrolls.y
    let scroll = {} as any

    let entityAtTop = findEntityByCoord(
      scrollTop,
      currentBodyHeightHierarchy,
      currentBodyVerticals,
    )

    if (entityAtTop) {
      let vertical = currentBodyVerticals.get(entityAtTop)
      let elTop = vertical.start
      let elBottom = elTop + vertical.size
      let elBottomRelScroller = elBottom - scrollTop

      scroll.fromBottom = elBottomRelScroller

      if (isEntityGroup(entityAtTop)) {
        scroll.groupValue = entityAtTop.value
      } else {
        scroll.resourceId = entityAtTop.id
      }
    }

    return scroll
  }

  // Resource INDIVIDUAL-Column Area Resizing
  // -----------------------------------------------------------------------------------------------

  private resizerElRefs = new RefMap<HTMLElement>(this.handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}

  handleColResizerEl(resizerEl: HTMLElement | null, index: string) {
    let { colDraggings } = this

    if (!resizerEl) {
      let dragging = colDraggings[index]

      if (dragging) {
        dragging.destroy()
        delete colDraggings[index]
      }
    } else {
      let dragging = this.initColResizing(resizerEl, parseInt(index, 10))

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
        let allCells = findElements(elementClosest(resizerEl, 'tr'), 'th')

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
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { currentBodyHeightHierarchy, currentBodyVerticals } = this
    let { dateProfile } = this.props

    let entityAtTop = findEntityByCoord(
      positionTop,
      currentBodyHeightHierarchy,
      currentBodyVerticals,
    )

    if (entityAtTop && !isEntityGroup(entityAtTop)) {
      let resource = entityAtTop
      let { start: top, size: height } = currentBodyVerticals.get(resource)
      let bottom = top + height
      let slatHit = this.slatsRef.current.positionToHit(positionLeft)

      if (slatHit) {
        return {
          dateProfile,
          dateSpan: {
            range: slatHit.dateSpan.range,
            allDay: slatHit.dateSpan.allDay,
            resourceId: resource.id,
          },
          rect: {
            left: slatHit.left,
            right: slatHit.right,
            top,
            bottom,
          },
          dayEl: slatHit.dayEl,
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
