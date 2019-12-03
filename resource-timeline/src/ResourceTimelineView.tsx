import {
  h, createRef,
  subrenderer, Calendar, Hit, View, parseFieldSpecs, ComponentContext, memoize, DateProfile,
  Duration, DateProfileGenerator, SplittableProps
} from '@fullcalendar/core'
import { TimelineLane, TimeColsWidthSyncer, buildTimelineDateProfile, TimelineDateProfile, TimelineHeader, TimelineSlats, TimelineNowIndicator, getTimelineNowIndicatorUnit, getTimelineViewClassNames } from '@fullcalendar/timeline'
import { ResourceHash, GroupNode, ResourceNode, ResourceViewProps, ResourceSplitter, buildResourceTextFunc, buildRowNodes } from '@fullcalendar/resource-common'
import SpreadsheetColWidths from './SpreadsheetColWidths'
import { __assign } from 'tslib'
import SpreadsheetRow from './SpreadsheetRow'
import SpreadsheetGroupRow from './SpreadsheetGroupRow'
import ResourceTimelineLaneRow from './ResourceTimelineLaneRow'
import DividerRow from './DividerRow'
import ResourceTimelineViewLayout from './ResourceTimelineViewLayout'
import SpreadsheetHeader from './SpreadsheetHeader'
import SpreadsheetBody from './SpreadsheetBody'


export default class ResourceTimelineView extends View {

  private processOptions = memoize(this._processOptions)
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private hasNesting = memoize(hasNesting)
  private hasResourceBusinessHours = memoize(hasResourceBusinessHours)
  private buildRowNodes = memoize(buildRowNodes)
  private buildRowIndex = memoize(buildRowIndex)
  private registerInteractive = subrenderer(this._registerInteractive, this._unregisterInteractive)
  private renderBgLane = subrenderer(TimelineLane)
  private renderSpreadsheetColWidths = subrenderer(SpreadsheetColWidths)
  private timeColsWidthSyncer = new TimeColsWidthSyncer()
  private renderNowIndicatorMarkers = subrenderer(TimelineNowIndicator)
  private layoutRef = createRef<ResourceTimelineViewLayout>()
  private slatsRef = createRef<TimelineSlats>()
  private timeHeaderRef = createRef<TimelineHeader>()
  private spreadsheetHeaderRef = createRef<SpreadsheetHeader>()
  private spreadsheetBodyRef = createRef<SpreadsheetBody>()
  private rowNodes: (GroupNode | ResourceNode)[] = []
  private rowIdToIndex: { [id: string]: number } = {}
  private rowIdToComponent: { [id: string]: ResourceTimelineLaneRow } = {} // ONLY ResourceTimelineLaneRow instances

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


  render(props: ResourceViewProps, state: {}, context: ComponentContext) {
    let { options } = context
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
        <ResourceTimelineViewLayout
          ref={this.layoutRef}
          spreadsheetHeadContent={
            <SpreadsheetHeader
              ref={this.spreadsheetHeaderRef}
              superHeaderText={this.superHeaderText}
              colSpecs={this.colSpecs}
            />
          }
          spreadsheetBodyContent={
            <SpreadsheetBody colSpecs={this.colSpecs} ref={this.spreadsheetBodyRef}>
              {renderSpreadsheetRows(rowNodes, this.colSpecs)}
            </SpreadsheetBody>
          }
          timeHeadContent={
            <TimelineHeader
              ref={this.timeHeaderRef}
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
            />
          }
          timeBodyFgContent={
            <div class='fc-rows'>
              <table>
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
          }
          timeBodyBgContent={
            <TimelineSlats
              ref={this.slatsRef}
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
            />
          }
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
            ref={this.handleResourceRow}
            willUnmount={this.willUnmountResourceRow}
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
    this.startNowIndicator()
    this.scrollToInitialTime()
  }


  getSnapshotBeforeUpdate(prevProps: ResourceViewProps) {
    let layout = this.layoutRef.current

    return {
      resourceScroll: this.queryResourceScroll(),
      dateScrollLeft: layout.timeBodyScroller.enhancedScroller.getScrollLeft()
    }
  }


  componentDidUpdate(prevProps: ResourceViewProps, prevState: {}, snapshot) {
    this.subrender()

    let { resourceScroll, dateScrollLeft } = snapshot

    if (prevProps.dateProfile !== this.props.dateProfile) {
      this.scrollToInitialTime()

    } else {
      this.scrollLeft(dateScrollLeft)
    }

    if (resourceScroll.rowId) {
      this.scrollToResource(resourceScroll.rowId, resourceScroll.fromBottom)

    } else if (resourceScroll.top) {
      this.scrollTop(resourceScroll.top)
    }
  }


  componentWillUnmount() {
    this.stopNowIndicator()
    this.subrenderDestroy()
  }


  subrender() {
    let { props, context } = this
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)
    let layout = this.layoutRef.current

    // for all-resource bg events / selections / business-hours
    this.bgLane = this.renderBgLane({
      ...this.bgLaneProps,
      dateProfile: props.dateProfile,
      nextDayThreshold: context.nextDayThreshold,
      businessHours: hasResourceBusinessHours ? null : props.businessHours,
      fgContainerEl: null, // will render no fg events
      bgContainerEl: layout.timeBodyScroller.canvas.bgEl,
      dateProfileGenerator: props.dateProfileGenerator,
      tDateProfile: this.tDateProfile
    })

    this.registerInteractive({
      timeBodyEl: layout.timeBodyScroller.canvas.rootEl
    })

    this.renderSpreadsheetColWidths({
      header: this.spreadsheetHeaderRef.current,
      body: this.spreadsheetBodyRef.current,
      colSpecs: this.colSpecs
    })
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


  updateSize(isResize, viewHeight, isAuto) {
    let { bgLane } = this
    let layout = this.layoutRef.current
    let header = this.timeHeaderRef.current
    let slats = this.slatsRef.current

    if (isResize || this.isLayoutSizeDirty()) {
      let availableWidth = layout.getTimeAvailableWidth()
      let { containerWidth, containerMinWidth } = this.timeColsWidthSyncer.updateSize({
        availableWidth,
        header,
        slats,
        tDateProfile: this.tDateProfile,
        dateProfile: this.props.dateProfile
      }, this.context)

      layout.setTimeWidths(containerWidth, containerMinWidth)
      layout.syncHeadRowHeights()
      layout.setHeight(viewHeight, isAuto) // needs to happen after syncHeadRowHeights

      // needs to happen after layout adjusted, so last cell isn't stretched
      slats.buildPositionCaches()
    }

    let resourceRows = this.getResourceRows()

    // these methods are all efficient, use flags
    for (let resourceRow of resourceRows) { resourceRow.computeSizes(isResize, slats) }
    bgLane.computeSizes(isResize, slats)
    for (let resourceRow of resourceRows) { resourceRow.assignSizes(isResize, slats) }
    bgLane.assignSizes(isResize, slats)

    layout.syncBodyRowHeights()
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    return getTimelineNowIndicatorUnit(this.tDateProfile)
  }


  renderNowIndicator(date) {
    let layout = this.layoutRef.current

    this.renderNowIndicatorMarkers({
      headParentEl: layout.timeHeadScroller.canvas.rootEl,
      bodyParentEl: layout.timeBodyScroller.canvas.rootEl,
      tDateProfile: this.tDateProfile,
      slats: this.slatsRef.current,
      date
    })
  }


  unrenderNowIndicator() {
    this.renderNowIndicatorMarkers(false)
  }


  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down
  // TODO: what about left scroll state for spreadsheet area?


  scrollToTime(duration: Duration) {
    this.afterSizing(() => { // hack
      let slats = this.slatsRef.current
      let left = slats.computeDurationLeft(duration)

      this.scrollLeft(left)
    })
  }


  scrollLeft(left: number) {
    this.afterSizing(() => { // hack
      let layout = this.layoutRef.current

      // TODO: lame we have to update both. use the scrolljoiner instead maybe
      layout.timeBodyScroller.enhancedScroller.setScrollLeft(left)
      layout.timeHeadScroller.enhancedScroller.setScrollLeft(left)
    })
  }


  scrollToResource(resourceId: string, fromBottom?: number) {
    this.afterSizing(() => { // hack
      let layout = this.layoutRef.current
      let trs = layout.bodyRowSyncer.hContainersTrs[1] // 1 = time axis. TODO: use for position as well?
      let index = this.rowIdToIndex[resourceId]

      if (index != null) {
        let tr = trs[index]
        let innerTop = layout.timeBodyScroller.canvas.rootEl.getBoundingClientRect().top
        let rowRect = tr.getBoundingClientRect()
        let scrollTop =
          (fromBottom == null ?
            rowRect.top : // just use top edge
            rowRect.bottom - fromBottom) - // pixels from bottom edge
          innerTop

        this.scrollTop(scrollTop)
      }
    })
  }


  scrollTop(top: number) {
    this.afterSizing(() => { // hack
      let layout = this.layoutRef.current

      // TODO: lame we have to update both. use the scrolljoiner instead maybe
      layout.timeBodyScroller.enhancedScroller.scroller.controller.setScrollTop(top)
      layout.spreadsheetBodyScroller.enhancedScroller.scroller.controller.setScrollTop(top)

      layout.updateStickyScrolling() // strange place to do this. but guaranteed to be last
    })
  }


  queryResourceScroll(): { rowId: string, fromBottom: number } {
    let { rowNodes } = this
    let scroll = {} as any
    let layout = this.layoutRef.current
    let trs = layout.bodyRowSyncer.hContainersTrs[1] // 1 = time axis ... TODO: use for position as well?
    let scrollerTop = layout.timeBodyScroller.clipEl.getBoundingClientRect().top // fixed position

    for (let i = 0; i < trs.length; i++) {
      let rowNode = rowNodes[i]
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
    this.slatsRef.current.buildPositionCaches()
    // NOTE: the layout's rowHeightSyncer updates all the time :)
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let layout = this.layoutRef.current
    let rowPositions = layout.bodyRowSyncer.rowPositions
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


  handleResourceRow = (component: ResourceTimelineLaneRow) => {
    if (component) {
      let { resourceId } = component.props
      this.rowIdToComponent[resourceId] = component
    }
  }


  willUnmountResourceRow = (resourceId: string) => {
    delete this.rowIdToComponent[resourceId]
  }


  getResourceRows() {
    let { rowIdToComponent } = this
    let components: ResourceTimelineLaneRow[] = []

    for (let rowNode of this.rowNodes) {
      if ((rowNode as ResourceNode).resource) {
        components.push(
          rowIdToComponent[(rowNode as ResourceNode).resource.id]
        )
      }
    }

    return components
  }


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
