import {
  h, createRef,
  subrenderer, Calendar, Hit, View, parseFieldSpecs, ComponentContext, memoize, DateProfile,
  Duration, DateProfileGenerator, SplittableProps, PositionCache, Fragment, CssDimValue, ChunkContentCallbackArgs, ElementDragging, PointerDragEvent, isArraysEqual, componentNeedsResize, RefMap, DateMarker, NowTimer
} from '@fullcalendar/core'
import { TimelineLane, buildTimelineDateProfile, TimelineDateProfile, TimelineHeader, TimelineSlats, TimelineNowIndicator, getTimelineNowIndicatorUnit, getTimelineViewClassNames, buildSlatCols, computeDefaultSlotWidth } from '@fullcalendar/timeline'
import { ResourceHash, GroupNode, ResourceNode, ResourceViewProps, ResourceSplitter, buildResourceTextFunc, buildRowNodes } from '@fullcalendar/resource-common'
import { __assign } from 'tslib'
import SpreadsheetRow from './SpreadsheetRow'
import SpreadsheetGroupRow from './SpreadsheetGroupRow'
import ResourceTimelineLaneRow from './ResourceTimelineLaneRow'
import DividerRow from './DividerRow'
import SpreadsheetHeader, { SPREADSHEET_COL_MIN_WIDTH } from './SpreadsheetHeader'
import { ScrollGrid } from '@fullcalendar/scrollgrid'


const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

interface ResourceTimelineViewState {
  resourceAreaWidth: CssDimValue
  spreadsheetColWidths: number[]
  slotMinWidth?: number
  nowIndicatorDate?: DateMarker
}

interface ResourceTimelineViewSnapshot {
  resourceScroll?: ResourceScrollState
}

interface ResourceScrollState {
  rowId: string
  fromBottom: number
}

const STATE_IS_SIZING = {
  resourceAreaWidth: true,
  spreadsheetColWidths: true,
  slotMinWidth: true
}


export default class ResourceTimelineView extends View<ResourceTimelineViewState> {

  private processOptions = memoize(this._processOptions)
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private hasNesting = memoize(hasNesting)
  private hasResourceBusinessHours = memoize(hasResourceBusinessHours)
  private buildRowNodes = memoize(buildRowNodes)
  private buildRowIndex = memoize(buildRowIndex)
  private registerInteractive = subrenderer(this._registerInteractive, this._unregisterInteractive)
  private renderBgLane = subrenderer(TimelineLane)
  private updateNowTimer = subrenderer(NowTimer)
  private renderNowIndicator = subrenderer(TimelineNowIndicator)
  private scrollGridRef = createRef<ScrollGrid>()
  private timeHeaderScrollerElRef = createRef<HTMLDivElement>()
  private timeBodyScrollerElRef = createRef<HTMLDivElement>()
  private slatsRef = createRef<TimelineSlats>()
  private laneRootElRef = createRef<HTMLDivElement>()
  private laneBgElRef = createRef<HTMLDivElement>()
  private rowNodes: (GroupNode | ResourceNode)[] = []
  private renderedRowNodes: (GroupNode | ResourceNode)[] = [] // made it to DOM
  private rowIdToIndex: { [id: string]: number } = {}
  private rowComponentRefs = new RefMap<ResourceTimelineLaneRow>() // ONLY ResourceTimelineLaneRow refs, not dividers
  private rowPositions: PositionCache
  private spreadsheetHeaderChunkElRef = createRef<HTMLTableCellElement>()
  private spreadsheetResizerDragging: ElementDragging

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private bgLaneProps: SplittableProps
  private tDateProfile: TimelineDateProfile
  private bgLane: TimelineLane
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho

  // computed options
  private superHeaderText: any
  private isVGrouping: any // used by row generation
  private groupSpecs: any // used by row generation
  private colSpecs: any
  private orderSpecs: any // used by row generation


  constructor(props: ResourceViewProps, context: ComponentContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: []
    }
  }


  render(props: ResourceViewProps, state: ResourceTimelineViewState, context: ComponentContext) {
    let { options, theme } = context
    let { dateProfile } = props

    this.processOptions(context.options, context.calendar)

    let tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      context.options,
      props.dateProfileGenerator
    )

    let rowNodes = this.rowNodes = this.buildRowNodes(
      props.resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping,
      props.resourceEntityExpansions,
      context.options.resourcesInitiallyExpanded
    )

    this.rowIdToIndex = this.buildRowIndex(rowNodes)

    let splitProps = this.resourceSplitter.splitProps(props)
    this.bgLaneProps = splitProps['']

    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    let classNames = getTimelineViewClassNames(props.viewSpec, options.eventOverlap)
    if (!this.hasNesting(rowNodes)) {
      classNames.push('fc-flat')
    }

    return (
      <div class={classNames.join(' ')}>
        <ScrollGrid
          ref={this.scrollGridRef}
          forPrint={props.forPrint}
          vGrow={!props.isHeightAuto}
          colGroups={[
            {
              width: this.state.resourceAreaWidth,
              cols: buildSpreadsheetCols(this.colSpecs, this.state.spreadsheetColWidths)
            },
            { cols: [] }, // for the divider
            {
              cols: buildSlatCols(tDateProfile, this.state.slotMinWidth)
            }
          ]}
          sections={[
            {
              type: 'head',
              chunks: [
                {
                  vGrowRows: true,
                  elRef: this.spreadsheetHeaderChunkElRef,
                  className: 'fc-resource-area',
                  rowContent: (
                    <SpreadsheetHeader
                      superHeaderText={this.superHeaderText}
                      colSpecs={this.colSpecs}
                      onColWidthChange={this.handleColWidthChange}
                    />
                  )
                },
                { outerContent: (
                  <td
                    ref={this.handleSpreadsheetResizerEl}
                    rowSpan={2}
                    class={'fc-divider fc-col-resizer ' + theme.getClass('tableCellShaded')}
                  />
                ) },
                {
                  className: 'fc-time-area',
                  scrollerElRef: this.timeHeaderScrollerElRef,
                  rowContent: (
                    <TimelineHeader
                      dateProfile={dateProfile}
                      tDateProfile={tDateProfile}
                    />
                  )
                }
              ]
            },
            {
              type: 'body',
              vGrow: true,
              vGrowRows: Boolean(context.options.expandRows),
              syncRowHeights: true,
              chunks: [
                {
                  className: 'fc-resource-area',
                  rowContent: (
                    <Fragment>
                      {renderSpreadsheetRows(rowNodes, this.colSpecs)}
                    </Fragment>
                  )
                },
                { outerContent: null },
                {
                  className: 'fc-time-area',
                  scrollerElRef: this.timeBodyScrollerElRef,
                  content: (contentArg: ChunkContentCallbackArgs) => {
                    return (
                      <div ref={this.laneRootElRef} style={{
                        // weird. TODO: give an actual classname
                        position: 'relative',
                        minWidth: contentArg.tableMinWidth,
                        minHeight: '100%'
                      }}>
                        <div class='fc-content'>
                          <table
                            class={theme.getClass('table')}
                            style={{
                              minWidth: contentArg.tableMinWidth,
                              width: contentArg.tableWidth,
                              height: contentArg.tableHeight
                            }}
                          >
                            <tbody>
                              {this.renderTimeAxisRows(
                                rowNodes,
                                props.dateProfile,
                                props.dateProfileGenerator,
                                tDateProfile,
                                context.nextDayThreshold,
                                hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
                                splitProps
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div class='fc-bg' ref={this.laneBgElRef}>
                          <div class='fc-slats'>
                            <table class={theme.getClass('table')} style={{
                              minWidth: contentArg.tableMinWidth,
                              width: contentArg.tableWidth
                            }}>
                              {contentArg.tableColGroupNode}
                              <tbody>
                                <TimelineSlats
                                  ref={this.slatsRef}
                                  dateProfile={dateProfile}
                                  tDateProfile={tDateProfile}
                                />
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )
                  }
                }
              ]
            }
          ]}
        />
      </div>
    )
  }


  renderTimeAxisRows(
    nodes: (ResourceNode | GroupNode)[],
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    nextDayThreshold: Duration,
    fallbackBusinessHours,
    splitProps: { [resourceId: string]: SplittableProps }
  ) {
    let { rowComponentRefs } = this

    return nodes.map((node) => {
      if ((node as GroupNode).group) {
        return (
          <DividerRow key={node.id} />
        )

      } else if ((node as ResourceNode).resource) {
        let resource = (node as ResourceNode).resource

        return (
          <ResourceTimelineLaneRow
            key={node.id}
            ref={rowComponentRefs.createRef(resource.id)}
            {...splitProps[resource.id]}
            resourceId={resource.id}
            dateProfile={dateProfile}
            dateProfileGenerator={dateProfileGenerator}
            tDateProfile={tDateProfile}
            nextDayThreshold={nextDayThreshold}
            businessHours={resource.businessHours || fallbackBusinessHours}
          />
        )
      }
    })
  }


  componentDidMount() {
    this.subrender()
    this.handleSizing(false, true)
    this.context.addResizeHandler(this.handleSizing)
  }


  getSnapshotBeforeUpdate(): ResourceTimelineViewSnapshot {
    if (!this.props.forPrint) {
      return {
        resourceScroll: this.queryResourceScroll()
      }
    } else {
      return {}
    }
  }


  componentDidUpdate(prevProps: ResourceViewProps, prevState: ResourceTimelineViewState, snapshot: ResourceTimelineViewSnapshot) {
    this.subrender()

    if (componentNeedsResize(prevProps, this.props, prevState, this.state, STATE_IS_SIZING)) {
      this.handleSizing(false, prevProps.dateProfile !== this.props.dateProfile, snapshot.resourceScroll)
    }
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
    this.subrenderDestroy()
  }


  subrender() {
    let { props, context } = this
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    // for all-resource bg events / selections / business-hours
    this.bgLane = this.renderBgLane({
      ...this.bgLaneProps,
      dateProfile: props.dateProfile,
      nextDayThreshold: context.nextDayThreshold,
      businessHours: hasResourceBusinessHours ? null : props.businessHours,
      fgContainerEl: null, // will render no fg events
      bgContainerEl: this.laneBgElRef.current,
      dateProfileGenerator: props.dateProfileGenerator,
      tDateProfile: this.tDateProfile
    })

    // TODO: do BEFORE subrender, so we dont trigger another render
    this.updateNowTimer({
      enabled: this.context.options.nowIndicator,
      unit: getTimelineNowIndicatorUnit(this.tDateProfile), // expensive?
      callback: this.handleNowDate
    })

    this.registerInteractive({
      timeBodyEl: this.laneRootElRef.current
    })

    this.renderedRowNodes = this.rowNodes
  }


  private _processOptions(options, calendar: Calendar) {
    let allColSpecs = options.resourceColumns || []
    let labelText = options.resourceLabelText // TODO: view.override
    let defaultLabelText = 'Resources' // TODO: view.defaults
    let superHeaderText = null

    if (!allColSpecs.length) {
      allColSpecs.push({
        labelText: labelText || defaultLabelText,
        text: buildResourceTextFunc(options.resourceText, calendar)
      })
    } else {
      superHeaderText = labelText
    }

    const plainColSpecs = []
    const groupColSpecs = []
    let groupSpecs = []
    let isVGrouping = false

    for (let colSpec of allColSpecs) {
      if (colSpec.group) {
        groupColSpecs.push(colSpec)
      } else {
        plainColSpecs.push(colSpec)
      }
    }

    plainColSpecs[0].isMain = true

    if (groupColSpecs.length) {
      groupSpecs = groupColSpecs
      isVGrouping = true
    } else {
      const hGroupField = options.resourceGroupField
      if (hGroupField) {
        groupSpecs.push({
          field: hGroupField,
          text: options.resourceGroupText,
          render: options.resourceGroupRender
        })
      }
    }

    const allOrderSpecs = parseFieldSpecs(options.resourceOrder)
    const plainOrderSpecs = []

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

    this.superHeaderText = superHeaderText
    this.isVGrouping = isVGrouping
    this.groupSpecs = groupSpecs
    this.colSpecs = groupColSpecs.concat(plainColSpecs)
    this.orderSpecs = plainOrderSpecs
  }


  _registerInteractive(props: { timeBodyEl: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, { el: props.timeBodyEl })
  }


  _unregisterInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  handleSizing = (forced: boolean, hasNewDates?: boolean, resourceScroll?: ResourceScrollState) => {
    if (!this.props.forPrint) {
      this.setState({
        slotMinWidth: this.computeSlotMinWidth()
      }, () => { // TODO: find a way to not execute callback if not updated

        this.buildPositionCaches()
        let slats = this.slatsRef.current

        // these methods are all efficient, use flags
        let resourceRows = this.getResourceRows()
        for (let resourceRow of resourceRows) { resourceRow.computeSizes(forced, slats) }
        this.bgLane.computeSizes(forced, slats)
        for (let resourceRow of resourceRows) { resourceRow.assignSizes(forced, slats) }
        this.bgLane.assignSizes(forced, slats)

        this.renderNowIndicator({
          headParentEl: this.timeHeaderScrollerElRef.current,
          bodyParentEl: this.laneRootElRef.current,
          tDateProfile: this.tDateProfile,
          slats: this.slatsRef.current,
          date: this.state.nowIndicatorDate
        })

        if (hasNewDates) {
          this.scrollToInitialTime()
        }

        if (resourceScroll) {
          this.scrollToResource(resourceScroll.rowId, resourceScroll.fromBottom)
        }
      })
    }
  }


  computeSlotMinWidth() {
    let slotMinWidth = this.context.options.slotWidth || '' // the option is called `slotWidth` but is actually a css min-width

    if (slotMinWidth === '') {
      slotMinWidth = computeDefaultSlotWidth(this.timeHeaderScrollerElRef.current, this.tDateProfile)
    }

    return slotMinWidth
  }


  handleNowDate = (date: DateMarker) => {
    this.setState({
      nowIndicatorDate: date
    })
  }


  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down


  scrollToTime(duration: Duration) {
    let slats = this.slatsRef.current
    let scrollLeft = slats.computeDurationLeft(duration)
    let scrollGrid = this.scrollGridRef.current

    scrollGrid.forceScrollLeft(2, scrollLeft) // 1 = the time area
  }


  scrollToResource(resourceId: string, fromBottom?: number) {
    let scrollGrid = this.scrollGridRef.current
    let trs = scrollGrid.sectionRowSets[1][1] // the timeline body rows
    let index = this.rowIdToIndex[resourceId]

    if (index != null) {
      let tr = trs[index]
      let innerTop = this.laneRootElRef.current.getBoundingClientRect().top
      let rowRect = tr.getBoundingClientRect()
      let scrollTop =
        (fromBottom == null ?
          rowRect.top : // just use top edge
          rowRect.bottom - fromBottom) - // pixels from bottom edge
        innerTop

      scrollGrid.forceScrollTop(1, scrollTop) // 1 = the body
    }
  }


  queryResourceScroll(): ResourceScrollState {
    let { renderedRowNodes } = this
    let scroll = {} as any
    let scrollGrid = this.scrollGridRef.current
    let trs = scrollGrid.sectionRowSets[1][1] // the timeline body rows
    let scrollerTop = this.timeBodyScrollerElRef.current.getBoundingClientRect().top // fixed position

    for (let i = 0; i < trs.length; i++) {
      let rowNode = renderedRowNodes[i]
      let el = trs[i]
      let elBottom = el.getBoundingClientRect().bottom // fixed position

      if (elBottom > scrollerTop) {
        scroll.rowId = rowNode.id
        scroll.fromBottom = elBottom - scrollerTop
        break
      }
    }

    return scroll
  }


  // Hit System
  // ------------------------------------------------------------------------------------------


  buildPositionCaches() {
    let scrollGrid = this.scrollGridRef.current

    this.rowPositions = new PositionCache(
      this.laneRootElRef.current,
      scrollGrid.sectionRowSets[1][1], // the timeline body trs
      false,
      true // isVertical
    )
    this.rowPositions.build()

    this.slatsRef.current.buildPositionCaches()
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rowPositions = this.rowPositions
    let slats = this.slatsRef.current
    let rowIndex = rowPositions.topToIndex(positionTop)

    if (rowIndex != null) {
      let resource = (this.rowNodes[rowIndex] as ResourceNode).resource

      if (resource) { // not a group
        let slatHit = slats.positionToHit(positionLeft)

        if (slatHit) {
          return {
            component: this,
            dateSpan: {
              range: slatHit.dateSpan.range,
              allDay: slatHit.dateSpan.allDay,
              resourceId: resource.id
            },
            rect: {
              left: slatHit.left,
              right: slatHit.right,
              top: rowPositions.tops[rowIndex],
              bottom: rowPositions.bottoms[rowIndex]
            },
            dayEl: slatHit.dayEl,
            layer: 0
          }
        }
      }
    }
  }


  // Indexing the Rows
  // ------------------------------------------------------------------------------------------


  getResourceRows() {
    let { rowComponentRefs } = this
    let components: ResourceTimelineLaneRow[] = []

    for (let rowNode of this.rowNodes) {
      if ((rowNode as ResourceNode).resource) {
        components.push(
          rowComponentRefs.currentMap[(rowNode as ResourceNode).resource.id]
        )
      }
    }

    return components
  }


  // Resource Area Resizing
  // ------------------------------------------------------------------------------------------


  handleSpreadsheetResizerEl = (resizerEl: HTMLElement | null) => {
    if (resizerEl) {
      this.initSpreadsheetResizing(resizerEl)
    } else {
      this.destroySpreadsheetResizing()
    }
  }


  initSpreadsheetResizing(resizerEl: HTMLElement) {
    let { isRtl, pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl
    let spreadsheetHeadEl = this.spreadsheetHeaderChunkElRef.current

    if (ElementDraggingImpl) {
      let dragging = this.spreadsheetResizerDragging = new ElementDraggingImpl(resizerEl)
      let dragStartWidth
      let viewWidth

      dragging.emitter.on('dragstart', () => {
        dragStartWidth = this.state.resourceAreaWidth
        if (typeof dragStartWidth !== 'number') {
          dragStartWidth = spreadsheetHeadEl.getBoundingClientRect().width
        }
        viewWidth = (this.base as HTMLElement).getBoundingClientRect().width
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
        newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
        newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)

        this.setState({ // TODO: debounce?
          resourceAreaWidth: newWidth
        })
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
    }
  }


  destroySpreadsheetResizing() {
    this.spreadsheetResizerDragging.destroy()
  }


  // Resource INDIVIDUAL-Column Area Resizing
  // ------------------------------------------------------------------------------------------


  handleColWidthChange = (colIndex: number, colWidth: number) => {
    let widths = this.state.spreadsheetColWidths.concat([]) // copy! TODO: use util?
    widths[colIndex] = colWidth

    this.setState({
      spreadsheetColWidths: widths
    })
  }

}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidths: isArraysEqual
})


function buildSpreadsheetCols(colSpecs, forcedWidths: number[]) {
  return colSpecs.map((colSpec, i) => {
    return {
      className: colSpec.isMain ? 'fc-main-col' : '',
      minWidth: SPREADSHEET_COL_MIN_WIDTH,
      width: forcedWidths[i] || ''
    }
  })
}


function renderSpreadsheetRows(nodes: (ResourceNode | GroupNode)[], colSpecs) {
  return nodes.map((node) => {
    if ((node as GroupNode).group) {
      return (
        <SpreadsheetGroupRow
          key={node.id}
          id={node.id}
          spreadsheetColCnt={colSpecs.length}
          isExpanded={node.isExpanded}
          group={(node as GroupNode).group}
        />
      )
    } else if ((node as ResourceNode).resource) {
      return (
        <SpreadsheetRow
          key={node.id}
          colSpecs={colSpecs}
          rowSpans={(node as ResourceNode).rowSpans}
          depth={(node as ResourceNode).depth}
          isExpanded={node.isExpanded}
          hasChildren={(node as ResourceNode).hasChildren}
          resource={(node as ResourceNode).resource}
        />
      )
    }
  })
}


function hasResourceBusinessHours(resourceStore: ResourceHash) {
  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    if (resource.businessHours) {
      return true
    }
  }

  return false
}


function hasNesting(nodes: (GroupNode | ResourceNode)[]) {
  for (let node of nodes) {
    if ((node as GroupNode).group) {
      return true
    } else if ((node as ResourceNode).resource) {
      if ((node as ResourceNode).hasChildren) {
        return true
      }
    }
  }

  return false
}


function buildRowIndex(rowNodes: (GroupNode | ResourceNode)[]) {
  let rowIdToIndex: { [id: string]: number } = {}

  for (let i = 0; i < rowNodes.length; i++) {
    rowIdToIndex[rowNodes[i].id] = i
  }

  return rowIdToIndex
}
