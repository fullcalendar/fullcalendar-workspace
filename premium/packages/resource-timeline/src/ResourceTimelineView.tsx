import { CssDimValue } from '@fullcalendar/core'
import {
  ViewContext, memoize,
  ChunkContentCallbackArgs, isArraysEqual,
  ScrollRequest, ScrollResponder, ViewContainer, BaseComponent, ViewOptionsRefined,
  RefMap, ElementDragging,
  findElements,
  elementClosest,
  PointerDragEvent,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import {
  buildTimelineDateProfile, TimelineHeader,
  buildSlatCols,
  TimelineCoords,
  TimelineDateProfile,
} from '@fullcalendar/timeline/internal'
import {
  ResourceViewProps,
  ColSpec, GroupSpec, DEFAULT_RESOURCE_ORDER,
  buildResourceHierarchy,
  Group,
  Resource,
  ParentNode,
  isEntityGroup,
} from '@fullcalendar/resource/internal'
import { SpreadsheetRow } from './SpreadsheetRow.js'
import { SpreadsheetGroupRow } from './SpreadsheetGroupRow.js'
import { ResourceTimelineGrid } from './ResourceTimelineGrid.js'
import { ResourceTimelineViewLayout } from './ResourceTimelineViewLayout.js'
import {
  GroupCellDisplay,
  GroupRowDisplay,
  NaturalHeightMap,
  ResourceRowDisplay,
  VerticalPosition,
  buildHeaderHeightHierarchy,
  buildResourceDisplays,
  buildVerticalPositions,
  searchTopmostEntity,
} from './resource-table.js'
import { SpreadsheetGroupCell } from './SpreadsheetGroupCell.js'
import { SpreadsheetSuperHeaderCell } from './SpreadsheetSuperHeaderCell.js'
import { SpreadsheetHeaderCell } from './SpreadsheetHeaderCell.js'

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
  resourceId?: string
  groupValue?: any
  fromBottom: number
}

const SPREADSHEET_COL_MIN_WIDTH = 20

export class ResourceTimelineView extends BaseComponent<ResourceViewProps, ResourceTimelineViewState> {
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private buildResourceDisplays = memoize(buildResourceDisplays)
  private buildHeaderHeightHierarchy = memoize(buildHeaderHeightHierarchy)
  private buildHeaderVerticalPositions = memoize(buildVerticalPositions)
  private buildBodyVerticalPositions = memoize(buildVerticalPositions)
  private layoutRef = createRef<ResourceTimelineViewLayout>()
  private scrollResponder: ScrollResponder
  private expandBodyToHeight: number | undefined

  // TODO: make stateful
  // (have sub-components report their natural heights via callbacks)
  private headerNaturalHeightMap: Map<boolean | number, NaturalHeightMap>
  private bodyNaturalHeightMap: Map<Resource | Group, NaturalHeightMap>

  // DERIVED
  private currentGroupRowDisplays: GroupRowDisplay[]
  private currentResourceRowDisplays: ResourceRowDisplay[]
  private currentBodyHeightHierarchy: ParentNode<Resource | Group>[]
  private currentBodyVerticalPositions: Map<Resource | Group, VerticalPosition>

  constructor(props: ResourceViewProps, context: ViewContext) {
    super(props, context)

    this.state = {
      resourceAreaWidth: context.options.resourceAreaWidth,
      spreadsheetColWidths: [],
    }
  }

  render() {
    let { props, state, context, bodyNaturalHeightMap, headerNaturalHeightMap } = this
    let { options, viewSpec } = context

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
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
    let headerVerticalPositions = this.buildHeaderVerticalPositions(
      headerHeightHierarchy,
      headerNaturalHeightMap,
      undefined, // minHeight
    )

    let bodyVerticalPositions = this.currentBodyVerticalPositions = this.buildBodyVerticalPositions(
      bodyHeightHierarchy,
      bodyNaturalHeightMap,
      this.expandBodyToHeight, // minHeight
    )

    let { slotMinWidth } = options
    let slatCols =
      buildSlatCols(tDateProfile, slotMinWidth ||
      this.computeFallbackSlotMinWidth(tDateProfile))

    return (
      <ViewContainer
        elClasses={[
          'fc-resource-timeline',
          !anyNesting && 'fc-resource-timeline-flat', // flat means there's no nesting
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
            <Fragment>
              {Boolean(superHeaderRendering) && (
                <tr key="row-super" role="row">
                  <SpreadsheetSuperHeaderCell
                    renderHooks={superHeaderRendering}
                  />
                </tr>
              )}
              <tr key="row" role="row">
                {colSpecs.map((colSpec, i) => (
                  <SpreadsheetHeaderCell
                    colSpec={colSpec}
                    resizer={i < colSpecs.length - 1}
                    resizerElRef={this.resizerElRefs.createRef(i)}
                  />
                ))}
              </tr>
            </Fragment>
          )}
          spreadsheetBodyRows={() => (
            <Fragment>
              {this.renderSpreadsheetRows(
                groupColDisplays,
                groupRowDisplays,
                resourceRowDisplays,
                resourceColSpecs,
                bodyVerticalPositions,
              )}
            </Fragment>
          )}
          timeCols={slatCols}
          timeHeaderContent={(contentArg: ChunkContentCallbackArgs) => (
            <TimelineHeader
              clientWidth={contentArg.clientWidth}
              clientHeight={contentArg.clientHeight}
              tableMinWidth={contentArg.tableMinWidth}
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              slatCoords={state.slatCoords}
              onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
              verticalPositions={headerVerticalPositions}
            />
          )}
          timeBodyContent={(contentArg: ChunkContentCallbackArgs) => {
            // TODO: converge with ResourceTimelineLanes::minHeight
            this.expandBodyToHeight = contentArg.expandRows ? contentArg.clientHeight : undefined

            return (
              <ResourceTimelineGrid
                dateProfile={props.dateProfile}
                clientWidth={contentArg.clientWidth}
                clientHeight={contentArg.clientHeight}
                tableMinWidth={contentArg.tableMinWidth}
                expandRows={contentArg.expandRows}
                tDateProfile={tDateProfile}
                groupRowDisplays={groupRowDisplays}
                resourceRowDisplays={resourceRowDisplays}
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
                verticalPositions={bodyVerticalPositions}
                heightHierarchy={this.currentBodyHeightHierarchy}
              />
            )
          }}
        />
      </ViewContainer>
    )
  }

  /*
  TODO: tabindex
  */
  renderSpreadsheetRows(
    groupColDisplays: GroupCellDisplay[][],
    groupRowDisplays: GroupRowDisplay[],
    resourceRowDisplays: ResourceRowDisplay[],
    resourceColSpecs: ColSpec[],
    verticalPositions: Map<Resource | Group, VerticalPosition>,
  ) {
    return (
      <Fragment>
        {groupColDisplays.map((groupCellDisplays, cellIndex) => (
          <div key={cellIndex}>{/* TODO: assign left/width */}
            {groupCellDisplays.map((groupCellDisplay) => (
              <SpreadsheetGroupCell
                key={String(groupCellDisplay.group.value)}
                colSpec={groupCellDisplay.group.spec}
                fieldValue={groupCellDisplay.group.value}
                top={verticalPositions.get(groupCellDisplay.group).top}
                height={verticalPositions.get(groupCellDisplay.group).height}
              />
            ))}
          </div>
        ))}
        <div>{/* TODO: assign left/width */}
          {groupRowDisplays.map((groupRowDisplay) => (
            <SpreadsheetGroupRow
              key={String(groupRowDisplay.group.value)}
              group={groupRowDisplay.group}
              isExpanded={groupRowDisplay.isExpanded}
              top={verticalPositions.get(groupRowDisplay.group).top}
              height={verticalPositions.get(groupRowDisplay.group).height}
            />
          ))}
        </div>
        <div>{/* TODO: assign left/width */}
          {resourceRowDisplays.map((resourceRowDisplay) => (
            <SpreadsheetRow
              key={resourceRowDisplay.resource.id}
              resource={resourceRowDisplay.resource}
              depth={resourceRowDisplay.depth}
              hasChildren={resourceRowDisplay.hasChildren}
              isExpanded={resourceRowDisplay.isExpanded}
              colSpecs={resourceColSpecs}
              top={verticalPositions.get(resourceRowDisplay.resource).top}
              height={verticalPositions.get(resourceRowDisplay.resource).height}
            />
          ))}
        </div>
      </Fragment>
    )
  }

  componentDidMount() {
    this.scrollResponder = this.context.createScrollResponder(this.handleScrollRequest)
  }

  getSnapshotBeforeUpdate(): ResourceTimelineViewSnapshot {
    if (!this.props.forPrint) { // because print-view is always zero?
      return { resourceScroll: this.queryResourceScroll() }
    }
    return {}
  }

  componentDidUpdate(prevProps: ResourceViewProps, prevState: ResourceTimelineViewState, snapshot: ResourceTimelineViewSnapshot) {
    this.scrollResponder.update(
      prevProps.dateProfile !== this.props.dateProfile,
      // TODO: && bodyVericalPositions stable
    )

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
    let { currentGroupRowDisplays, currentResourceRowDisplays, currentBodyVerticalPositions } = this
    let layout = this.layoutRef.current
    let entity: Resource | Group | undefined

    // find entity. hack
    if (request.resourceId) {
      for (const resourceRowDisplay of currentResourceRowDisplays) {
        if (resourceRowDisplay.resource.id === request.resourceId) {
          entity = resourceRowDisplay.resource
          break
        }
      }
    } else if (request.groupValue) { // okay for falsiness?
      for (const groupRowDisplay of currentGroupRowDisplays) {
        if (groupRowDisplay.group.value === request.groupValue) {
          entity = groupRowDisplay.group
          break
        }
      }
    }

    if (entity) {
      const position = currentBodyVerticalPositions.get(entity)

      if (position) {
        const { top, height } = position
        const bottom = top + height

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
    let { currentBodyHeightHierarchy, currentBodyVerticalPositions } = this
    let layout = this.layoutRef.current
    let scrollTop = layout.getResourceScroll()
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
}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidths: isArraysEqual,
})

// !!!
function buildSpreadsheetCols(colSpecs: ColSpec[], forcedWidths: number[], fallbackWidth: CssDimValue = '') {
  return colSpecs.map((colSpec, i) => ({
    className: colSpec.isMain ? 'fc-main-col' : '',
    width: forcedWidths[i] || colSpec.width || fallbackWidth,
  }))
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
