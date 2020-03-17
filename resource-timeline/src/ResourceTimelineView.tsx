import {
  h, createRef,
  View, parseFieldSpecs, ComponentContext, memoize,
  Fragment, CssDimValue, ChunkContentCallbackArgs, isArraysEqual, PositionCache, ScrollRequest, ScrollResponder, buildHashFromArray, memoizeHashlike, ViewRoot,
} from '@fullcalendar/core'
import {
  buildTimelineDateProfile, TimelineHeader,
  getTimelineViewClassNames, buildSlatCols,
  TimelineCoords
} from '@fullcalendar/timeline'
import { GroupNode, ResourceNode, ResourceViewProps, buildRowNodes, ColSpec, GroupSpec } from '@fullcalendar/resource-common'
import { __assign } from 'tslib'
import SpreadsheetRow from './SpreadsheetRow'
import SpreadsheetGroupRow from './SpreadsheetGroupRow'
import SpreadsheetHeader from './SpreadsheetHeader'
import ResourceTimelineGrid from './ResourceTimelineGrid'
import ResourceTimelineViewLayout from './ResourceTimelineViewLayout'


interface ResourceTimelineViewState {
  resourceAreaWidth: CssDimValue
  spreadsheetColWidths: number[]
  slatCoords?: TimelineCoords
}

interface ResourceTimelineViewSnapshot {
  resourceScroll?: ResourceScrollState
}

interface ResourceScrollState {
  rowId: string
  fromBottom: number
}


export default class ResourceTimelineView extends View<ResourceTimelineViewState> {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private processColOptions = memoize(processColOptions)
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private hasNesting = memoize(hasNesting)
  private buildRowNodes = memoize(buildRowNodes)
  private getReportRowHeights = memoizeHashlike((reportRowHeight, rowId) => reportRowHeight.bind(null, rowId))
  private layoutRef = createRef<ResourceTimelineViewLayout>()
  private rowNodes: (GroupNode | ResourceNode)[] = []
  private renderedRowNodes: (GroupNode | ResourceNode)[] = []
  private buildRowIndex = memoize(buildRowIndex)
  private rowCoords: PositionCache
  private scrollResponder: ScrollResponder


  constructor(props: ResourceViewProps, context: ComponentContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: []
    }
  }


  render(props: ResourceViewProps, state: ResourceTimelineViewState, context: ComponentContext) {
    let { options } = context
    let { dateProfile } = props
    let { superHeaderRendering, groupSpecs, orderSpecs, isVGrouping, colSpecs } = this.processColOptions(context.options)

    let tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      context.options,
      props.dateProfileGenerator
    )

    let rowNodes = this.rowNodes = this.buildRowNodes(
      props.resourceStore,
      groupSpecs,
      orderSpecs,
      isVGrouping,
      props.resourceEntityExpansions,
      context.options.resourcesInitiallyExpanded
    )

    let extraClassNames = getTimelineViewClassNames(options.eventOverlap)
    if (!this.hasNesting(rowNodes)) {
      extraClassNames.push('fc-flat')
    }

    return (
      <ViewRoot viewSpec={props.viewSpec}>
        {(rootElRef, classNames) => (
          <div ref={rootElRef} class={extraClassNames.concat(classNames).join(' ')}>
            <ResourceTimelineViewLayout
              ref={this.layoutRef}
              forPrint={props.forPrint}
              isHeightAuto={props.isHeightAuto}
              spreadsheetCols={buildSpreadsheetCols(colSpecs, state.spreadsheetColWidths)}
              spreadsheetHeaderRows={
                <SpreadsheetHeader // TODO: rename to SpreadsheetHeaderRows
                  superHeaderRendering={superHeaderRendering}
                  colSpecs={colSpecs}
                  onColWidthChange={this.handleColWidthChange}
                />
              }
              spreadsheetBodyRows={(contentArg: ChunkContentCallbackArgs) => {
                let reportRowHeights = this.getReportRowHeights(
                  buildHashFromArray(rowNodes, (rowNode) => [
                    rowNode.id,
                    [ contentArg.reportRowHeight, rowNode.id ]
                  ])
                )

                return (
                  <Fragment>
                    {this.renderSpreadsheetRows(rowNodes, colSpecs, contentArg.rowSyncHeights, reportRowHeights)}
                  </Fragment>
                )
              }}
              timeCols={buildSlatCols(tDateProfile, this.context.options.slotMinWidth || 30)}
              timeHeaderContent={(contentArg: ChunkContentCallbackArgs) => (
                <TimelineHeader
                  clientWidth={contentArg.clientWidth}
                  clientHeight={contentArg.clientHeight}
                  tableMinWidth={contentArg.tableMinWidth}
                  tableColGroupNode={contentArg.tableColGroupNode}
                  dateProfile={dateProfile}
                  tDateProfile={tDateProfile}
                  slatCoords={state.slatCoords}
                />
              )}
              timeBodyContent={(contentArg: ChunkContentCallbackArgs) => (
                <ResourceTimelineGrid
                  clientWidth={contentArg.clientWidth}
                  clientHeight={contentArg.clientHeight}
                  tableMinWidth={contentArg.tableMinWidth}
                  tableColGroupNode={contentArg.tableColGroupNode}
                  vGrowRows={contentArg.vGrowRows}
                  tDateProfile={tDateProfile}
                  dateProfile={dateProfile}
                  dateProfileGenerator={props.dateProfileGenerator}
                  rowNodes={rowNodes}
                  businessHours={props.businessHours}
                  dateSelection={props.dateSelection}
                  eventStore={props.eventStore}
                  eventUiBases={props.eventUiBases}
                  eventSelection={props.eventSelection}
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  resourceStore={props.resourceStore}
                  nextDayThreshold={context.nextDayThreshold}
                  rowInnerHeights={contentArg.rowSyncHeights}
                  onSlatCoords={this.handleSlatCoords}
                  onRowCoords={this.handleRowCoords}
                  onScrollLeftRequest={this.handleScrollLeftRequest}
                  onRowHeight={contentArg.reportRowHeight}
                />
              )}
            />
          </div>
        )}
      </ViewRoot>
    )
  }


  renderSpreadsheetRows(nodes: (ResourceNode | GroupNode)[], colSpecs: ColSpec[], rowSyncHeights: { [rowKey: string]: number }, reportRowHeights) {
    return nodes.map((node) => {
      if ((node as GroupNode).group) {
        return (
          <SpreadsheetGroupRow
            key={node.id}
            id={node.id}
            spreadsheetColCnt={colSpecs.length}
            isExpanded={node.isExpanded}
            group={(node as GroupNode).group}
            innerHeight={rowSyncHeights[node.id] || ''}
            onRowHeight={reportRowHeights[node.id]}
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
            innerHeight={rowSyncHeights[node.id] || ''}
            onRowHeight={reportRowHeights[node.id]}
          />
        )
      }
    })
  }


  componentDidMount() {
    this.renderedRowNodes = this.rowNodes
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }


  getSnapshotBeforeUpdate(): ResourceTimelineViewSnapshot {
    if (!this.props.forPrint) {
      return { resourceScroll: this.queryResourceScroll() }
    } else {
      return {}
    }
  }


  componentDidUpdate(prevProps: ResourceViewProps, prevState: ResourceTimelineViewState, snapshot: ResourceTimelineViewSnapshot) {
    this.renderedRowNodes = this.rowNodes
    this.scrollResponder.update(this.props.dateProfile !== prevProps.dateProfile)

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
  }


  queryResourceScroll(): ResourceScrollState {
    let { rowCoords, renderedRowNodes } = this

    if (rowCoords) {
      let layout = this.layoutRef.current
      let trBottoms = rowCoords.bottoms
      let scrollTop = layout.getResourceScroll()
      let scroll = {} as any

      for (let i = 0; i < trBottoms.length; i++) {
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
  }


  // Resource INDIVIDUAL-Column Area Resizing
  // ------------------------------------------------------------------------------------------


  handleColWidthChange = (colWidths: number[]) => {
    this.setState({
      spreadsheetColWidths: colWidths
    })
  }

}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidths: isArraysEqual
})


function buildRowIndex(rowNodes: (GroupNode | ResourceNode)[]) {
  let rowIdToIndex: { [id: string]: number } = {}

  for (let i = 0; i < rowNodes.length; i++) {
    rowIdToIndex[rowNodes[i].id] = i
  }

  return rowIdToIndex
}


function buildSpreadsheetCols(colSpecs: ColSpec[], forcedWidths: number[]) {
  return colSpecs.map((colSpec, i) => {
    return {
      className: colSpec.isMain ? 'fc-main-col' : '',
      width: forcedWidths[i] || colSpec.width || ''
    }
  })
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


function processColOptions(options) {
  let allColSpecs: ColSpec[] = options.resourceAreaColumns || []
  let superHeaderRendering = null

  if (!allColSpecs.length) {
    allColSpecs.push({
      labelClassNames: options.resourceAreaLabelClassNames,
      labelContent: options.resourceAreaLabelContent || 'Resources', // TODO: view.defaults
      labelDidMount: options.resourceAreaLabelDidMount,
      labelWillUnmount: options.resourceAreaLabelWillUnmount
    })

  } else if (options.resourceAreaLabelContent) { // weird way to determine if content
    superHeaderRendering = {
      labelClassNames: options.resourceAreaLabelClassNames,
      labelContent: options.resourceAreaLabelContent,
      labelDidMount: options.resourceAreaLabelDidMount,
      labelWillUnmount: options.resourceAreaLabelWillUnmount
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
        cellWillUnmount: colSpec.cellWillUnmount || options.resourceGroupLaneWillUnmount
      })
    } else {
      plainColSpecs.push(colSpec)
    }
  }

  // BAD: mutates a user-supplied option
  // the "label" for the resource is the "cell" for the spreadsheet :(
  // TODO: revive "header" terminology instead?
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
        laneWillUnmount: options.resourceGroupLaneWillUnmount
      })
    }
  }

  let allOrderSpecs = parseFieldSpecs(options.resourceOrder)
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
    orderSpecs: plainOrderSpecs
  }
}
