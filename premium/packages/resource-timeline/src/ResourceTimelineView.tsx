import { CssDimValue } from '@fullcalendar/core'
import {
  ViewContext, memoize,
  ChunkContentCallbackArgs, isArraysEqual,
  ScrollRequest, ScrollResponder, ViewContainer, BaseComponent, ViewOptionsRefined,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import {
  buildTimelineDateProfile, TimelineHeader,
  buildSlatCols,
  TimelineCoords,
  TimelineDateProfile,
} from '@fullcalendar/timeline/internal'
import {
  ParentNode, GroupNode, ResourceNode, ResourceViewProps, buildRowNodes,
  ColSpec, GroupSpec, DEFAULT_RESOURCE_ORDER,
} from '@fullcalendar/resource/internal'
import { SpreadsheetRow } from './SpreadsheetRow.js'
import { SpreadsheetGroupRow } from './SpreadsheetGroupRow.js'
import { SpreadsheetHeader } from './SpreadsheetHeader.js'
import { ResourceTimelineGrid } from './ResourceTimelineGrid.js'
import { ResourceTimelineViewLayout } from './ResourceTimelineViewLayout.js'
import { RowSyncer } from './RowSyncer.js'

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
  private scrollResponder: ScrollResponder
  private rowSyncer: RowSyncer // TODO: make another for the spreadsheet/timeline header
  private rowHierarchy: ParentNode[] = []
  private rowNodes: (GroupNode | ResourceNode)[] = []
  private expandBodyToHeight: number | string = ''

  constructor(props: ResourceViewProps, context: ViewContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: [],
    }

    this.rowSyncer = new RowSyncer()
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

    let [rowHierarchy, rowNodes] = this.buildRowNodes(
      props.resourceStore,
      groupSpecs,
      orderSpecs,
      isVGrouping,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )
    this.rowHierarchy = rowHierarchy
    this.rowNodes = rowNodes
    this.rowSyncer.preupdate()

    let { slotMinWidth } = options
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    return (
      <ViewContainer
        elClasses={[
          'fc-resource-timeline',
          !this.hasNesting(rowNodes) && 'fc-resource-timeline-flat', // flat means there's no nesting
          'fc-timeline',
          options.eventOverlap === false ?
            'fc-timeline-overlap-disabled' :
            'fc-timeline-overlap-enabled',
        ]}
        viewSpec={viewSpec}
      >
        <ResourceTimelineViewLayout
          ref={this.layoutRef}
          forPrint={props.forPrint}
          isHeightAuto={props.isHeightAuto}
          spreadsheetCols={
            buildSpreadsheetCols(colSpecs, state.spreadsheetColWidths, '')
          }
          spreadsheetHeaderRows={() => (
            <SpreadsheetHeader // TODO: rename to SpreadsheetHeaderRows
              superHeaderRendering={superHeaderRendering}
              colSpecs={colSpecs}
              onColWidthChange={this.handleColWidthChange}
            />
          )}
          spreadsheetBodyRows={() => (
            <Fragment>
              {this.renderSpreadsheetRows(rowNodes, colSpecs)}
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
              onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
            />
          )}
          timeBodyContent={(contentArg: ChunkContentCallbackArgs) => {
            // TODO: converge with ResourceTimelineLanes::minHeight
            this.expandBodyToHeight = contentArg.expandRows ? contentArg.clientHeight : ''

            return (
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
                onSlatCoords={this.handleSlatCoords}
                onScrollLeftRequest={this.handleScrollLeftRequest}
                rowSyncer={this.rowSyncer}
              />
            )
          }}
        />
      </ViewContainer>
    )
  }

  renderSpreadsheetRows(nodes: (ResourceNode | GroupNode)[], colSpecs: ColSpec[]) {
    return nodes.map((node) => {
      if ((node as GroupNode).group) {
        return (
          <SpreadsheetGroupRow
            key={node.id}
            id={node.id}
            spreadsheetColCnt={colSpecs.length}
            isExpanded={node.isExpanded}
            group={(node as GroupNode).group}
            rowSyncer={this.rowSyncer}
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
            rowSyncer={this.rowSyncer}
          />
        )
      }

      return null
    })
  }

  componentDidMount() {
    // row syncer
    this.rowSyncer.addTotalSizeListener(this.handleTotalBodyHeight)
    this.updateRowSyncer()
    this.context.addResizeHandler(this.preUpdateRowSyncer, 'pre')
    this.context.addResizeHandler(this.updateRowSyncer, 'post')

    // scroll responder
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }

  getSnapshotBeforeUpdate(): ResourceTimelineViewSnapshot {
    if (!this.props.forPrint) { // because print-view is always zero?
      return { resourceScroll: this.queryResourceScroll() }
    }
    return {}
  }

  componentDidUpdate(prevProps: ResourceViewProps, prevState: ResourceTimelineViewState, snapshot: ResourceTimelineViewSnapshot) {
    // row syncer
    this.updateRowSyncer()

    // scroll responder
    this.scrollResponder.update(prevProps.dateProfile !== this.props.dateProfile)
    if (snapshot.resourceScroll) {
      this.handleScrollRequest(snapshot.resourceScroll) // TODO: this gets triggered too often
    }
  }

  componentWillUnmount() {
    // row syncer
    this.rowSyncer.removeTotalSizeListener(this.handleTotalBodyHeight)
    this.context.removeResizeHandler(this.preUpdateRowSyncer, 'pre')
    this.context.removeResizeHandler(this.updateRowSyncer, 'post')

    // scroll responder
    this.scrollResponder.detach()
  }

  handleSlatCoords = (slatCoords: TimelineCoords) => {
    this.setState({ slatCoords })
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth: Math.ceil(slotCushionMaxWidth), // for less rerendering TODO: DRY
    })
  }

  computeFallbackSlotMinWidth(tDateProfile: TimelineDateProfile) { // TODO: duplicate definition
    return Math.max(30, ((this.state.slotCushionMaxWidth || 0) / tDateProfile.slotsPerLabel))
  }

  // Row Syncer
  // ------------------------------------------------------------------------------------------------------------------

  preUpdateRowSyncer = () => {
    this.rowSyncer.preupdate()
  }

  updateRowSyncer = () => {
    this.rowSyncer.update({
      rowHierarchy: this.rowHierarchy,
      rowNodes: this.rowNodes,
      expandToHeight: this.expandBodyToHeight,
    })
  }

  handleTotalBodyHeight = (h: number) => {
    this.scrollResponder.update(false)
  }

  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down

  handleScrollLeftRequest = (scrollLeft: number) => { // for ResourceTimelineGrid
    let layout = this.layoutRef.current
    layout.forceTimeScroll(scrollLeft)
  }

  handleScrollRequest = (request: ScrollRequest & ResourceScrollState) => { // only handles resource scroll
    let { rowSyncer } = this
    let { rowId } = request
    let layout = this.layoutRef.current

    // find
    let rowNode: (GroupNode | ResourceNode)
    for (const lookRowNode of this.rowNodes) {
      if (lookRowNode.id === rowId) {
        rowNode = lookRowNode
        break
      }
    }

    if (rowNode) {
      const top = rowSyncer.getPosition(rowNode)
      const bottom = top + rowSyncer.getSize(rowNode)

      if (top !== undefined) {
        let scrollTop =
          request.fromBottom != null ?
            bottom - request.fromBottom : // pixels from bottom edge
            top // just use top edge

        layout.forceResourceScroll(scrollTop)
        return true
      }
    }

    return null
  }

  queryResourceScroll(): ResourceScrollState {
    let { rowSyncer } = this
    let layout = this.layoutRef.current
    let scrollTop = layout.getResourceScroll()
    let scroll = {} as any

    for (const rowNode of this.rowNodes) {
      const elTop = rowSyncer.getPosition(rowNode)
      const elBottom = elTop + rowSyncer.getSize(rowNode)

      if (elBottom !== undefined) {
        const elBottomRelScroller = elBottom - scrollTop

        if (elBottomRelScroller > 0) {
          scroll.rowId = rowNode.id
          scroll.fromBottom = elBottom
          break
        }
      }
    }

    return scroll
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
