import {
  h, createRef,
  subrenderer, Calendar, View, parseFieldSpecs, ComponentContext, memoize,
  Fragment, CssDimValue, ChunkContentCallbackArgs, isArraysEqual, DateMarker, NowTimer, PositionCache, ScrollRequest, ScrollResponder,
} from '@fullcalendar/core'
import {
  buildTimelineDateProfile, TimelineDateProfile, TimelineHeader,
  getTimelineNowIndicatorUnit, getTimelineViewClassNames, buildSlatCols,
  TimelineCoords
} from '@fullcalendar/timeline'
import { GroupNode, ResourceNode, ResourceViewProps, buildResourceTextFunc, buildRowNodes } from '@fullcalendar/resource-common'
import { __assign } from 'tslib'
import SpreadsheetRow from './SpreadsheetRow'
import SpreadsheetGroupRow from './SpreadsheetGroupRow'
import SpreadsheetHeader, { SPREADSHEET_COL_MIN_WIDTH } from './SpreadsheetHeader'
import ResourceTimelineGrid from './ResourceTimelineGrid'
import ResourceTimelineViewLayout from './ResourceTimelineViewLayout'


interface ResourceTimelineViewState {
  resourceAreaWidth: CssDimValue
  spreadsheetColWidths: number[]
  nowIndicatorDate?: DateMarker
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
  private tDateProfile: TimelineDateProfile
  private hasNesting = memoize(hasNesting)
  private buildRowNodes = memoize(buildRowNodes)
  private updateNowTimer = subrenderer(NowTimer)
  private layoutRef = createRef<ResourceTimelineViewLayout>()
  private rowNodes: (GroupNode | ResourceNode)[] = []
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
    let { superHeaderText, groupSpecs, orderSpecs, isVGrouping, colSpecs } = this.processColOptions(context.options, context.calendar)

    let tDateProfile = this.tDateProfile = this.buildTimelineDateProfile(
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

    let classNames = getTimelineViewClassNames(props.viewSpec, options.eventOverlap)
    if (!this.hasNesting(rowNodes)) {
      classNames.push('fc-flat')
    }

    return (
      <div class={classNames.join(' ')}>
        <ResourceTimelineViewLayout
          ref={this.layoutRef}
          forPrint={props.forPrint}
          isHeightAuto={props.isHeightAuto}
          spreadsheetCols={buildSpreadsheetCols(colSpecs, this.state.spreadsheetColWidths)}
          spreadsheetHeaderRows={
            <SpreadsheetHeader // TODO: rename to SpreadsheetHeaderRows
              superHeaderText={superHeaderText}
              colSpecs={colSpecs}
              onColWidthChange={this.handleColWidthChange}
            />
          }
          spreadsheetBodyRows={(contentArg: ChunkContentCallbackArgs) => (
            <Fragment>
              {renderSpreadsheetRows(rowNodes, colSpecs, contentArg.rowSyncHeights)}
            </Fragment>
          )}
          timeCols={buildSlatCols(tDateProfile, this.context.options.slotWidth || 30)}
          timeHeaderContent={(contentArg: ChunkContentCallbackArgs) => (
            <TimelineHeader
              clientWidth={contentArg.clientWidth}
              clientHeight={contentArg.clientHeight}
              tableMinWidth={contentArg.tableMinWidth}
              tableColGroupNode={contentArg.tableColGroupNode}
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
              nowIndicatorDate={state.nowIndicatorDate}
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
              nowIndicatorDate={state.nowIndicatorDate}
              onScrollLeftRequest={this.handleScrollLeftRequest}
            />
          )}
        />
      </div>
    )
  }



  componentDidMount() {
    this.subrender()
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
    this.subrender()
    this.scrollResponder.update(this.props.dateProfile !== prevProps.dateProfile)

    if (snapshot.resourceScroll) {
      this.handleScrollRequest(snapshot.resourceScroll) // TODO: this gets triggered too often
    }
  }


  componentWillUnmount() {
    this.subrenderDestroy()
    this.scrollResponder.detach()
  }


  subrender() {
    this.updateNowTimer({ // TODO: do BEFORE subrender, so we dont trigger another render
      enabled: this.context.options.nowIndicator,
      unit: getTimelineNowIndicatorUnit(this.tDateProfile), // expensive?
      callback: this.handleNowDate
    })
  }


  handleSlatCoords = (slatCoords: TimelineCoords) => {
    this.setState({ slatCoords })
  }


  handleRowCoords = (rowCoords: PositionCache) => {
    this.rowCoords = rowCoords
    this.scrollResponder.update(false) // TODO: could eliminate this if rowCoords lived in state
  }


  handleNowDate = (date: DateMarker) => {
    this.setState({
      nowIndicatorDate: date
    })
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
        let rowIdToIndex = this.buildRowIndex(this.rowNodes)
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
    let { rowCoords, rowNodes } = this

    if (rowCoords) {
      let layout = this.layoutRef.current
      let trBottoms = rowCoords.bottoms
      let scrollTop = layout.getResourceScroll()
      let scroll = {} as any

      for (let i = 0; i < trBottoms.length; i++) {
        let rowNode = rowNodes[i]
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


function buildRowIndex(rowNodes: (GroupNode | ResourceNode)[]) {
  let rowIdToIndex: { [id: string]: number } = {}

  for (let i = 0; i < rowNodes.length; i++) {
    rowIdToIndex[rowNodes[i].id] = i
  }

  return rowIdToIndex
}


function buildSpreadsheetCols(colSpecs, forcedWidths: number[]) {
  return colSpecs.map((colSpec, i) => {
    return {
      className: colSpec.isMain ? 'fc-main-col' : '',
      minWidth: SPREADSHEET_COL_MIN_WIDTH,
      width: forcedWidths[i] || ''
    }
  })
}


// TODO: make this a table maybe?!!!
function renderSpreadsheetRows(nodes: (ResourceNode | GroupNode)[], colSpecs, rowSyncHeights: number[]) {
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
          innerHeight={rowSyncHeights[index] || ''}
        />
      )
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


function processColOptions(options, calendar: Calendar) {
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

  let plainColSpecs = []
  let groupColSpecs = []
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
    let hGroupField = options.resourceGroupField
    if (hGroupField) {
      groupSpecs.push({
        field: hGroupField,
        text: options.resourceGroupText,
        render: options.resourceGroupRender
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
    superHeaderText,
    isVGrouping,
    groupSpecs,
    colSpecs: groupColSpecs.concat(plainColSpecs),
    orderSpecs: plainOrderSpecs
  }
}
