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
import {
  GroupRowDisplay,
  ResourceRowDisplay,
  VerticalPosition,
  buildHeaderHeightHierarchy,
  buildResourceDisplays,
  buildVerticalPositions,
  searchTopmostEntity,
} from './resource-table.js'
import { GroupTallCell } from './spreadsheet/GroupTallCell.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'
import { HeaderCell } from './spreadsheet/HeaderCell.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResizableTwoCol } from './ResizableTwoCol.js'
import { computeSlotWidth } from '../../timeline/src/TimelineView.js'

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
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private buildResourceDisplays = memoize(buildResourceDisplays)
  private buildHeaderHeightHierarchy = memoize(buildHeaderHeightHierarchy)
  private buildHeaderVerticalPositions = memoize(buildVerticalPositions)
  private buildBodyVerticalPositions = memoize(buildVerticalPositions)

  private twoColElRef = createRef<HTMLDivElement>()
  private superHeaderRef = createRef<HTMLDivElement>()
  private normalHeaderRef = createRef<HTMLDivElement>()
  private timeHeaderRefMap = new RefMapKeyed<number, HTMLDivElement>()
  private spreadsheetGroupTallRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private spreadsheetGroupWideRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private spreadsheetResourceRefMap = new RefMapKeyed<Resource, HTMLDivElement>()
  private timeGroupWideRefMap = new RefMapKeyed<Group, HTMLDivElement>()
  private timeResourceRefMap = new RefMapKeyed<Resource, HTMLDivElement>()

  // DERIVED
  private currentGroupRowDisplays: GroupRowDisplay[]
  private currentResourceRowDisplays: ResourceRowDisplay[]
  private currentBodyHeightHierarchy: ParentNode<Resource | Group>[]
  private currentBodyVerticalPositions?: Map<Resource | Group, VerticalPosition>

  // misc
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private bgSlicer = new TimelineLaneSlicer()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit creation :(
  private resourceLaneUnstableCount = 0

  // scroll stuff
  //
  private forcedTimeScroll?: Duration
  private currentResourceScroll?: ResourceScrollState
  //
  private spreadsheetHeaderScroll = new ScrollController()
  private spreadsheetBodyScroll = new ScrollController()
  private spreadsheetFooterScroll = new ScrollController()
  private timeHeaderScroll = new ScrollController()
  private timeBodyScroll = new ScrollController()
  private timeFooterScroll = new ScrollController()
  //
  // for time
  private timeScrolls = new ScrollJoiner([
    this.timeHeaderScroll,
    this.timeBodyScroll,
    this.timeFooterScroll,
  ], true)
  //
  // for resources
  private bodyScrolls = new ScrollJoiner([
    this.spreadsheetBodyScroll,
    this.timeBodyScroll,
  ])

  constructor(props: ResourceViewProps, context: ViewContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: [],
    }

    this.timeScrolls.addScrollListener(() => {
      this.forcedTimeScroll = undefined
    })

    this.bodyScrolls.addScrollListener(() => {
      this.currentResourceScroll = this.queryResourceScroll()
    })

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
    let { expandRows, direction } = options
    let isRTL = direction === 'rtl'

    let tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )

    let {
      groupSpecs,
      rowGroupDepth,
      orderSpecs,
      colSpecs,
      resourceColSpecs,
      superHeaderRendering,
    } = this.processColOptions(context.options)

    let resourceHierarchy = this.buildResourceHierarchy(
      props.resourceStore,
      groupSpecs,
      orderSpecs,
    )

    let {
      groupColDisplays,
      groupRowDisplays,
      resourceRowDisplays,
      heightHierarchy: bodyHeightHierarchy,
      anyNesting,
    } = this.buildResourceDisplays(
      resourceHierarchy,
      rowGroupDepth,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.currentGroupRowDisplays = groupRowDisplays
    this.currentResourceRowDisplays = resourceRowDisplays
    this.currentBodyHeightHierarchy = bodyHeightHierarchy

    let headerHeightHierarchy = this.buildHeaderHeightHierarchy(
      Boolean(superHeaderRendering),
      tDateProfile.cellRows.length,
    )

    // NOTE: TimelineHeader doesn't need top coordinates, only heights
    let [headerVerticalPositions, headerTotalHeight] = this.buildHeaderVerticalPositions(
      headerHeightHierarchy,
      state.headerNaturalHeightMap,
      undefined, // minHeight
    )

    let { viewInnerHeight } = state
    let bodyHeight = (viewInnerHeight !== undefined && headerTotalHeight !== undefined)
      ? viewInnerHeight - headerTotalHeight
      : undefined

    let [bodyVerticalPositions] = this.buildBodyVerticalPositions(
      bodyHeightHierarchy,
      state.bodyNaturalHeightMap,
      bodyHeight,
    )
    this.currentBodyVerticalPositions = bodyVerticalPositions

    let { slotMinWidth } = options
    let [normalSlotWidth, lastSlotWidth, timeCanvasWidth] = computeSlotWidth( // TODO: memoize
      tDateProfile,
      state.slotCushionMaxWidth,
      state.timeViewportWidth
    )

    let [spreadsheetColPositions, spreadsheetCanvasWidth] = computeSpreadsheetColPositions( // TODO: memoize
      colSpecs,
      state.spreadsheetColWidths,
      state.spreadsheetViewportWidth,
    )
    let spreadsheetBulkColsPosition = sliceSpreadsheetColPositions(
      spreadsheetColPositions,
      groupColDisplays.length,
    )

    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(resourceRowDisplays)

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

    let fallbackBusinessHours = hasResourceBusinessHours ? props.businessHours : null

    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /*
    TODO:
    - tabindex
    - forPrint / collapsibleWidth (not needed anymore?)
    */
    return (
      <ViewContainer
        elClasses={[
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

          // ----- spreadsheet -----

          startClassName='fc-newnew-flexparent'
          startContent={() => (
            <Fragment>
              {/* ----- spreadsheet HEADER ----- */}
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
                      const hposition = spreadsheetColPositions[colIndex] // could be undefined
                      return (
                        <div
                          key={colIndex}
                          style={{ width: hposition ? hposition.size : undefined }}
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
              {/* ----- spreadsheet BODY ----- */}
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
                  {/* ----- Group Columns > Cells ----- */}
                  <Fragment>
                    {groupColDisplays.map((groupCellDisplays, colIndex) => {
                      const hposition = spreadsheetColPositions[colIndex] // might be undefined
                      return (
                        <div
                          key={colIndex}
                          style={createHorizontalCss(hposition, isRTL)}
                        >
                          {groupCellDisplays.map((groupCellDisplay) => {
                            const { group } = groupCellDisplay
                            const position = bodyVerticalPositions && bodyVerticalPositions.get(group)
                            return (
                              <div
                                key={String(group.value) /* TODO: some sort of util!!! */}
                                class='fc-newnew-row'
                                role='row'
                                style={position as any /* !!! */}
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
                  {/* ----- Bulk-Row Container ----- */}
                  <div style={createHorizontalCss(spreadsheetBulkColsPosition, isRTL)}>
                    {/* ----- Group Bulk-Rows ----- */}
                    <Fragment>
                      {groupRowDisplays.map((groupRowDisplay) => {
                        const { group } = groupRowDisplay
                        const position = bodyVerticalPositions && bodyVerticalPositions.get(group)
                        return (
                          <div
                            key={String(group.value)}
                            class='fc-newnew-row'
                            role='row'
                            style={position as any /* !!! */}
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
                    {/* ----- Resource Bulk-Rows ----- */}
                    <Fragment>
                      {resourceRowDisplays.map((resourceRowDisplay) => {
                        const { resource } = resourceRowDisplay
                        const position = bodyVerticalPositions && bodyVerticalPositions.get(resource)
                        return (
                          <div
                            key={resource.id}
                            class='fc-newnew-row'
                            role='row'
                            style={position as any /* !!! */}
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
                    </Fragment>
                  </div>
                </div>
              </NewScroller>
              {/* ----- spreadsheet FOOTER scrollbar ----- */}
              <NewScroller
                horizontal
                onBottomScrollbarWidth={this.handleSpreadsheetBottomScrollbarWidth}
                elRef={this.spreadsheetFooterScroll.handleEl}
              >
                <div style={{ width: spreadsheetCanvasWidth }} />
              </NewScroller>
            </Fragment>
          )}

          // ----- time-axis -----

          endClassName='fc-newnew-flexparent'
          endContent={() => (
            <Fragment>
              {/* ----- time-axis HEADER ----- */}
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
                    onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
                    verticalPositions={headerVerticalPositions}
                    rowRefMap={this.timeHeaderRefMap}
                  />
                </div>
              </NewScroller>
              {/* ----- time-axis BODY (resources) ----- */}
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
                  className={[
                    'fc-timeline-body',
                    expandRows ? 'fc-timeline-body-expandrows' : '',
                  ].join(' ')}
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
                            const position = bodyVerticalPositions && bodyVerticalPositions.get(group)
                            return (
                              <div
                                key={String(group.value)}
                                class='fc-newnew-row'
                                role='row'
                                style={position as any /* !!! */}
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
                            const position = bodyVerticalPositions && bodyVerticalPositions.get(resource)
                            return (
                              <div
                                key={resource.id}
                                class='fc-newnew-row'
                                role='row'
                                style={position as any /* !!! */}
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
              {/* ----- time-axis FOOTER scrollbars ----- */}
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

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)

    this.handleTimeScroll(this.context.options.scrollTime)
    this.context.emitter.on('_scrollRequest', this.handleScroll)
  }

  componentDidUpdate(
    prevProps: ResourceViewProps,
    prevState: ResourceTimelineViewState,
  ) {
    this.handleSizing()

    // anything change that affects horizontal coordinates?
    if (
      prevProps.dateProfile !== this.props.dateProfile ||
      prevState.slatCoords !== this.state.slatCoords
    ) {
      this.applyTimeScroll()
    }

    // anything change that affects vertical coordinates?
    if (
      prevProps.resourceStore !== this.props.resourceStore ||
      prevProps.eventStore !== this.props.eventStore
    ) {
      this.applyResourceScroll()
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    this.context.emitter.off('_scrollRequest', this.handleScroll)
  }

  handleResourceLaneStable = (isStable) => {
    this.resourceLaneUnstableCount += (isStable ? -1 : 1)
    this.handleRowSizing()
  }

  handleSizing = () => {
    this.handleRowSizing()
    this.handleViewInnerHeight()
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

  handleViewInnerHeight = () => {
    this.setState({
      viewInnerHeight: this.twoColElRef.current.offsetHeight
    })
  }

  handleSlatCoords = (slatCoords: TimelineCoords) => {
    this.setState({
      slatCoords,
    })
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth,
    })
  }

  handleTwoColSizes = (spreadsheetViewportWidth: number, timeViewportWidth: number) => {
    this.setState({
      spreadsheetViewportWidth,
      timeViewportWidth,
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
      let { currentGroupRowDisplays, currentResourceRowDisplays, currentBodyVerticalPositions } = this
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
        const position = currentBodyVerticalPositions && currentBodyVerticalPositions.get(entity)

        if (position) {
          const { top, height } = position
          const bottom = top + height

          let scrollTop =
            resourceScroll.fromBottom != null ?
              bottom - resourceScroll.fromBottom : // pixels from bottom edge
              top // just use top edge

          this.bodyScrolls.scrollTo(scrollTop)
        }
      }
    }
  }

  queryResourceScroll(): ResourceScrollState {
    let { currentBodyHeightHierarchy, currentBodyVerticalPositions } = this
    let scrollTop = this.bodyScrolls.y
    let scroll = {} as any

    let entityAtTop = searchTopmostEntity(
      scrollTop,
      currentBodyHeightHierarchy,
      currentBodyVerticalPositions,
    )

    if (entityAtTop) {
      let position = currentBodyVerticalPositions.get(entityAtTop)
      let elTop = position.top
      let elBottom = elTop + position.height
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
  // ------------------------------------------------------------------------------------------

  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}

  _handleColResizerEl(resizerEl: HTMLElement | null, index: string) {
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
  // ------------------------------------------------------------------------------------------

  handleBodyEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { currentBodyHeightHierarchy, currentBodyVerticalPositions } = this
    let { dateProfile } = this.props

    let entityAtTop = searchTopmostEntity(
      positionTop,
      currentBodyHeightHierarchy,
      currentBodyVerticalPositions,
    )

    if (entityAtTop && !isEntityGroup(entityAtTop)) {
      let resource = entityAtTop
      let { top, height } = currentBodyVerticalPositions.get(resource)
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

function computeSpreadsheetColPositions(
  colSpecs: ColSpec[],
  forcedWidths: number[],
  availableWidth: number | undefined,
): [{ start: number, size: number }[], number] {
  return null as any
}

function sliceSpreadsheetColPositions(
  colPositions: { start: number, size: number }[],
  startIndex: number,
): { start: number, size: number } | undefined {
  return null as any
}

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
  let rowGroupDepth = 0

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
    rowGroupDepth = 1
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
    rowGroupDepth,
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

function createHorizontalCss(
  props: { start: number, size: number } | undefined,
  isRTL: boolean,
): { left?: number, right?: number, width: number } | undefined {
  if (props) {
    return {
      [isRTL ? 'right' : 'left']: props.start,
      width: props.size,
    }
  }
}
