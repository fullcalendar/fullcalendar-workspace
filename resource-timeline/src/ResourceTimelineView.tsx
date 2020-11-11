import {
  createElement, createRef, ViewContext, memoize,
  Fragment, CssDimValue, ChunkContentCallbackArgs, isArraysEqual, PositionCache,
  ScrollRequest, ScrollResponder, ViewRoot, BaseComponent, ViewOptionsRefined,
} from '@fullcalendar/common'
import {
  buildTimelineDateProfile, TimelineHeader,
  buildSlatCols,
  TimelineCoords,
  TimelineDateProfile,
} from '@fullcalendar/timeline'
import {
  GroupNode, ResourceNode, ResourceViewProps, buildRowNodes,
  ColSpec, GroupSpec, DEFAULT_RESOURCE_ORDER,
} from '@fullcalendar/resource-common'
import { __assign } from 'tslib'
import { SpreadsheetRow } from './SpreadsheetRow'
import { SpreadsheetGroupRow } from './SpreadsheetGroupRow'
import { SpreadsheetHeader } from './SpreadsheetHeader'
import { ResourceTimelineGrid } from './ResourceTimelineGrid'
import { ResourceTimelineViewLayout } from './ResourceTimelineViewLayout'

interface ResourceTimelineViewState {
  resourceAreaWidth: CssDimValue
  spreadsheetColWidths: number[]
  slatCoords?: TimelineCoords
  slotCushionMaxWidth?: number
}

interface ResourceTimelineViewSnapshot {
  resourceScroll?: ResourceScrollState
}

interface ResourceScrollState {
  rowId: string
  fromBottom: number
}

export class ResourceTimelineView extends BaseComponent<ResourceViewProps, ResourceTimelineViewState> {
  private processColOptions = memoize(processColOptions)
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private hasNesting = memoize(hasNesting)
  private buildRowNodes = memoize(buildRowNodes)
  private layoutRef = createRef<ResourceTimelineViewLayout>()
  private rowNodes: (GroupNode | ResourceNode)[] = []
  private renderedRowNodes: (GroupNode | ResourceNode)[] = []
  private buildRowIndex = memoize(buildRowIndex)
  private rowCoords: PositionCache
  private scrollResponder: ScrollResponder

  constructor(props: ResourceViewProps, context: ViewContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: [],
    }
  }

  render() {
    let { props, state, context } = this
    let { options, viewSpec } = context
    let { superHeaderRendering, groupSpecs, orderSpecs, isVGrouping, colSpecs } = this.processColOptions(context.options)

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )

    let rowNodes = this.rowNodes = this.buildRowNodes(
      props.resourceStore,
      groupSpecs,
      orderSpecs,
      isVGrouping,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )

    let extraClassNames = [
      'fc-resource-timeline',
      this.hasNesting(rowNodes) ? '' : 'fc-resource-timeline-flat', // flat means there's no nesting
      'fc-timeline',
      options.eventOverlap === false ? 'fc-timeline-overlap-disabled' : 'fc-timeline-overlap-enabled',
    ]

    let { slotMinWidth } = options
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    return (
      <ViewRoot viewSpec={viewSpec}>
        {(rootElRef, classNames) => (
          <div ref={rootElRef} className={extraClassNames.concat(classNames).join(' ')}>
            <ResourceTimelineViewLayout
              ref={this.layoutRef}
              forPrint={props.forPrint}
              isHeightAuto={props.isHeightAuto}
              spreadsheetCols={
                buildSpreadsheetCols(colSpecs, state.spreadsheetColWidths, '')
              }
              spreadsheetHeaderRows={(contentArg: ChunkContentCallbackArgs) => (
                <SpreadsheetHeader // TODO: rename to SpreadsheetHeaderRows
                  superHeaderRendering={superHeaderRendering}
                  colSpecs={colSpecs}
                  onColWidthChange={this.handleColWidthChange}
                  rowInnerHeights={contentArg.rowSyncHeights}
                />
              )}
              spreadsheetBodyRows={(contentArg: ChunkContentCallbackArgs) => (
                <Fragment>
                  {this.renderSpreadsheetRows(rowNodes, colSpecs, contentArg.rowSyncHeights)}
                </Fragment>
              )}
              timeCols={slatCols}
              timeHeaderContent={(contentArg: ChunkContentCallbackArgs) => (
                <TimelineHeader
                  clientWidth={contentArg.clientWidth}
                  clientHeight={contentArg.clientHeight}
                  tableMinWidth={contentArg.tableMinWidth}
                  tableColGroupNode={contentArg.tableColGroupNode}
                  dateProfile={props.dateProfile}
                  tDateProfile={tDateProfile}
                  slatCoords={state.slatCoords}
                  rowInnerHeights={contentArg.rowSyncHeights}
                  onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
                />
              )}
              timeBodyContent={(contentArg: ChunkContentCallbackArgs) => (
                <ResourceTimelineGrid
                  dateProfile={props.dateProfile}
                  clientWidth={contentArg.clientWidth}
                  clientHeight={contentArg.clientHeight}
                  tableMinWidth={contentArg.tableMinWidth}
                  tableColGroupNode={contentArg.tableColGroupNode}
                  expandRows={contentArg.expandRows}
                  tDateProfile={tDateProfile}
                  rowNodes={rowNodes}
                  businessHours={props.businessHours}
                  dateSelection={props.dateSelection}
                  eventStore={props.eventStore}
                  eventUiBases={props.eventUiBases}
                  eventSelection={props.eventSelection}
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  resourceStore={props.resourceStore}
                  nextDayThreshold={context.options.nextDayThreshold}
                  rowInnerHeights={contentArg.rowSyncHeights}
                  onSlatCoords={this.handleSlatCoords}
                  onRowCoords={this.handleRowCoords}
                  onScrollLeftRequest={this.handleScrollLeftRequest}
                  onRowHeightChange={contentArg.reportRowHeightChange}
                />
              )}
            />
          </div>
        )}
      </ViewRoot>
    )
  }

  renderSpreadsheetRows(nodes: (ResourceNode | GroupNode)[], colSpecs: ColSpec[], rowSyncHeights: number[]) {
    return nodes.map((node, index) => {
      if ((node as GroupNode).group) {
        return (
          <SpreadsheetGroupRow
            key={node.id}
            id={node.id}
            spreadsheetColCnt={colSpecs.length}
            isExpanded={node.isExpanded}
            group={(node as GroupNode).group}
            innerHeight={rowSyncHeights[index] || ''}
          />
        )
      }

      if ((node as ResourceNode).resource) {
        return (
          <SpreadsheetRow
            key={node.id}
            colSpecs={colSpecs}
            rowSpans={(node as ResourceNode).rowSpans}
            depth={(node as ResourceNode).depth}
            isExpanded={node.isExpanded}
            hasChildren={(node as ResourceNode).hasChildren}
            resource={(node as ResourceNode).resource}
            innerHeight={rowSyncHeights[index] || ''}
          />
        )
      }

      return null
    })
  }

  componentDidMount() {
    this.renderedRowNodes = this.rowNodes
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }

  getSnapshotBeforeUpdate(): ResourceTimelineViewSnapshot {
    if (!this.props.forPrint) { // because print-view is always zero?
      return { resourceScroll: this.queryResourceScroll() }
    }
    return {}
  }

  componentDidUpdate(prevProps: ResourceViewProps, prevState: ResourceTimelineViewState, snapshot: ResourceTimelineViewSnapshot) {
    this.renderedRowNodes = this.rowNodes

    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)

    if (snapshot.resourceScroll) {
      this.handleScrollRequest(snapshot.resourceScroll) // TODO: this gets triggered too often
    }
  }

  componentWillUnmount() {
    this.scrollResponder.detach()
  }

  handleSlatCoords = (slatCoords: TimelineCoords) => {
    this.setState({ slatCoords })
  }

  handleRowCoords = (rowCoords: PositionCache) => {
    this.rowCoords = rowCoords
    this.scrollResponder.update(false) // TODO: could eliminate this if rowCoords lived in state
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth: Math.ceil(slotCushionMaxWidth), // for less rerendering TODO: DRY
    })
  }

  computeFallbackSlotMinWidth(tDateProfile: TimelineDateProfile) { // TODO: duplicate definition
    return Math.max(30, ((this.state.slotCushionMaxWidth || 0) / tDateProfile.slotsPerLabel))
  }

  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down

  handleScrollLeftRequest = (scrollLeft: number) => { // for ResourceTimelineGrid
    let layout = this.layoutRef.current
    layout.forceTimeScroll(scrollLeft)
  }

  handleScrollRequest = (request: ScrollRequest & ResourceScrollState) => { // only handles resource scroll
    let { rowCoords } = this
    let layout = this.layoutRef.current
    let rowId = request.rowId || request.resourceId

    if (rowCoords) {
      if (rowId) {
        let rowIdToIndex = this.buildRowIndex(this.renderedRowNodes)
        let index = rowIdToIndex[rowId]

        if (index != null) {
          let scrollTop =
            (request.fromBottom != null ?
              rowCoords.bottoms[index] - request.fromBottom : // pixels from bottom edge
              rowCoords.tops[index] // just use top edge
            )
          layout.forceResourceScroll(scrollTop)
        }
      }

      return true
    }
    return null
  }

  queryResourceScroll(): ResourceScrollState {
    let { rowCoords, renderedRowNodes } = this

    if (rowCoords) {
      let layout = this.layoutRef.current
      let trBottoms = rowCoords.bottoms
      let scrollTop = layout.getResourceScroll()
      let scroll = {} as any

      for (let i = 0; i < trBottoms.length; i += 1) {
        let rowNode = renderedRowNodes[i]
        let elBottom = trBottoms[i] - scrollTop // from the top of the scroller

        if (elBottom > 0) {
          scroll.rowId = rowNode.id
          scroll.fromBottom = elBottom
          break
        }
      }

      return scroll
    }
    return null
  }

  // Resource INDIVIDUAL-Column Area Resizing
  // ------------------------------------------------------------------------------------------

  handleColWidthChange = (colWidths: number[]) => {
    this.setState({
      spreadsheetColWidths: colWidths,
    })
  }
}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidths: isArraysEqual,
})

function buildRowIndex(rowNodes: (GroupNode | ResourceNode)[]) {
  let rowIdToIndex: { [id: string]: number } = {}

  for (let i = 0; i < rowNodes.length; i += 1) {
    rowIdToIndex[rowNodes[i].id] = i
  }

  return rowIdToIndex
}

function buildSpreadsheetCols(colSpecs: ColSpec[], forcedWidths: number[], fallbackWidth: CssDimValue = '') {
  return colSpecs.map((colSpec, i) => ({
    className: colSpec.isMain ? 'fc-main-col' : '',
    width: forcedWidths[i] || colSpec.width || fallbackWidth,
  }))
}

function hasNesting(nodes: (GroupNode | ResourceNode)[]) {
  for (let node of nodes) {
    if ((node as GroupNode).group) {
      return true
    }

    if ((node as ResourceNode).resource) {
      if ((node as ResourceNode).hasChildren) {
        return true
      }
    }
  }

  return false
}

function processColOptions(options: ViewOptionsRefined) {
  let allColSpecs: ColSpec[] = options.resourceAreaColumns || []
  let superHeaderRendering = null

  if (!allColSpecs.length) {
    allColSpecs.push({
      headerClassNames: options.resourceAreaHeaderClassNames,
      headerContent: options.resourceAreaHeaderContent || 'Resources', // TODO: view.defaults
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

  let plainColSpecs: ColSpec[] = []
  let groupColSpecs: ColSpec[] = [] // part of the colSpecs, but filtered out in order to put first
  let groupSpecs: GroupSpec[] = []
  let isVGrouping = false

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
      plainColSpecs.push(colSpec)
    }
  }

  // BAD: mutates a user-supplied option
  let mainColSpec = plainColSpecs[0]
  mainColSpec.isMain = true
  mainColSpec.cellClassNames = mainColSpec.cellClassNames || options.resourceLabelClassNames
  mainColSpec.cellContent = mainColSpec.cellContent || options.resourceLabelContent
  mainColSpec.cellDidMount = mainColSpec.cellDidMount || options.resourceLabelDidMount
  mainColSpec.cellWillUnmount = mainColSpec.cellWillUnmount || options.resourceLabelWillUnmount

  if (groupColSpecs.length) {
    groupSpecs = groupColSpecs
    isVGrouping = true
  } else {
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
    superHeaderRendering,
    isVGrouping,
    groupSpecs,
    colSpecs: groupColSpecs.concat(plainColSpecs),
    orderSpecs: plainOrderSpecs,
  }
}
