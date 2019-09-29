import { ElementDragging, SplittableProps, memoizeRendering, PositionCache, Hit, View, createElement, parseFieldSpecs, ComponentContext, memoize, DateProfile, applyStyleProp, PointerDragEvent, Duration, DateProfileGenerator } from '@fullcalendar/core'
import { ScrollJoiner, TimelineLane, StickyScroller, TimeAxis } from '@fullcalendar/timeline'
import { ResourceHash, buildRowNodes, GroupNode, ResourceNode, ResourceViewProps, ResourceSplitter, buildResourceTextFunc } from '@fullcalendar/resource-common'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'
import Spreadsheet from './Spreadsheet'
import { __assign } from 'tslib'

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export default class ResourceTimelineView extends View {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  // child components
  spreadsheet: Spreadsheet
  timeAxis: TimeAxis
  lane: TimelineLane
  bodyScrollJoiner: ScrollJoiner
  spreadsheetBodyStickyScroller: StickyScroller
  isStickyScrollDirty = false

  timeAxisTbody: HTMLElement
  miscHeight: number
  rowNodes: (GroupNode | ResourceNode)[] = []
  rowComponents: (GroupRow | ResourceRow)[] = []
  rowComponentsById: { [id: string]: (GroupRow | ResourceRow) } = {}

  resourceAreaHeadEl: HTMLElement
  resourceAreaWidth?: number
  resourceAreaWidthDraggings: ElementDragging[] = []

  // internal state
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  rowPositions: PositionCache

  private splitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private renderSkeleton = memoizeRendering(this._renderSkeleton, this._unrenderSkeleton)
  private hasResourceBusinessHours = memoize(hasResourceBusinessHours)
  private buildRowNodes = memoize(buildRowNodes)
  private hasNesting = memoize(hasNesting)
  private updateHasNesting = memoizeRendering(this._updateHasNesting)
  private startInteractive = memoizeRendering(this._startInteractive, this._stopInteractive)


  _startInteractive(timeAxisEl: HTMLElement) {
    this.context.calendar.registerInteractiveComponent(this, { el: timeAxisEl })
  }


  _stopInteractive() {
    this.context.calendar.unregisterInteractiveComponent(this)
  }


  render(props: ResourceViewProps, context: ComponentContext) {
    super.render(props, context)

    this.renderSkeleton(context)

    let splitProps = this.splitter.splitProps(props)
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    this.spreadsheet.receiveProps({
      superHeaderText: this.superHeaderText,
      colSpecs: this.colSpecs
    }, context)

    this.timeAxis.receiveProps({
      dateProfileGenerator: props.dateProfileGenerator,
      dateProfile: props.dateProfile
    }, context)

    this.startInteractive(this.timeAxis.slats.el)

    // for all-resource bg events / selections / business-hours
    this.lane.receiveProps({
      ...splitProps[''],
      dateProfile: props.dateProfile,
      nextDayThreshold: context.nextDayThreshold,
      businessHours: hasResourceBusinessHours ? null : props.businessHours
    }, context)

    let newRowNodes = this.buildRowNodes(
      props.resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping,
      props.resourceEntityExpansions,
      context.options.resourcesInitiallyExpanded
    )

    this.updateHasNesting(this.hasNesting(newRowNodes))

    this.diffRows(newRowNodes)
    this.updateRowProps(
      props.dateProfile,
      hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
      splitProps
    )

    this.startNowIndicator(props.dateProfile, props.dateProfileGenerator)
  }


  _renderSkeleton(context: ComponentContext) {
    let { options, calendar } = context
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
    let isHGrouping = false

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
        isHGrouping = true
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
    this.isHGrouping = isHGrouping
    this.groupSpecs = groupSpecs
    this.colSpecs = groupColSpecs.concat(plainColSpecs)
    this.orderSpecs = plainOrderSpecs

    // START RENDERING...

    this.el.classList.add('fc-timeline')

    if (options.eventOverlap === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.resourceAreaHeadEl = this.el.querySelector('thead .fc-resource-area')
    this.setResourceAreaWidth(options.resourceAreaWidth)
    this.initResourceAreaWidthDragging()

    this.miscHeight = this.el.getBoundingClientRect().height

    this.spreadsheet = new Spreadsheet(
      this.resourceAreaHeadEl,
      this.el.querySelector('tbody .fc-resource-area')
    )

    this.timeAxis = new TimeAxis(
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    let timeAxisRowContainer = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(timeAxisRowContainer)
    this.timeAxisTbody = timeAxisRowContainer.querySelector('tbody')

    this.lane = new TimelineLane(
      null,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )

    this.bodyScrollJoiner = new ScrollJoiner('vertical', [
      this.spreadsheet.layout.bodyScroller,
      this.timeAxis.layout.bodyScroller
    ])

    // after scrolljoiner
    this.spreadsheetBodyStickyScroller = new StickyScroller(
      this.spreadsheet.layout.bodyScroller.enhancedScroll,
      context.isRtl,
      true // isVertical
    )
  }


  _unrenderSkeleton(context: ComponentContext) {
    this.startInteractive.unrender() // "unrender" bad name

    this.destroyRows() // wierd to call this here

    this.spreadsheet.destroy()
    this.timeAxis.destroy()
    this.lane.destroy()
    this.spreadsheetBodyStickyScroller.destroy()

    this.el.classList.remove('fc-timeline')
    this.el.classList.remove('fc-no-overlap')
  }


  renderSkeletonHtml() {
    let { theme } = this.context

    return `<table class="` + theme.getClass('tableGrid') + `"> \
<thead class="fc-head"> \
<tr> \
<td class="fc-resource-area ` + theme.getClass('widgetHeader') + `"></td> \
<td class="fc-divider fc-col-resizer ` + theme.getClass('widgetHeader') + `"></td> \
<td class="fc-time-area ` + theme.getClass('widgetHeader') + `"></td> \
</tr> \
</thead> \
<tbody class="fc-body"> \
<tr> \
<td class="fc-resource-area ` + theme.getClass('widgetContent') + `"></td> \
<td class="fc-divider fc-col-resizer ` + theme.getClass('widgetHeader') + `"></td> \
<td class="fc-time-area ` + theme.getClass('widgetContent') + `"></td> \
</tr> \
</tbody> \
</table>`
  }


  _updateHasNesting(isNesting: boolean) {
    let { classList } = this.el

    if (isNesting) {
      classList.remove('fc-flat')
    } else {
      classList.add('fc-flat')
    }
  }


  diffRows(newNodes) {
    let oldNodes = this.rowNodes
    let oldLen = oldNodes.length
    let oldIndexHash = {} // id -> index
    let oldI = 0
    let newI = 0

    for (oldI = 0; oldI < oldLen; oldI++) {
      oldIndexHash[oldNodes[oldI].id] = oldI
    }

    // iterate new nodes
    for (oldI = 0, newI = 0; newI < newNodes.length; newI++) {
      let newNode = newNodes[newI]
      let oldIFound = oldIndexHash[newNode.id]

      if (oldIFound != null && oldIFound >= oldI) {
        this.removeRows(newI, oldIFound - oldI, oldNodes) // won't do anything if same index
        oldI = oldIFound + 1
      } else {
        this.addRow(newI, newNode)
      }
    }

    // old rows that weren't found need to be removed
    this.removeRows(newI, oldLen - oldI, oldNodes) // won't do anything if same index

    this.rowNodes = newNodes
  }


  /*
  rowComponents is the in-progress result
  */
  addRow(index, rowNode) {
    let { rowComponents, rowComponentsById } = this

    let nextComponent = rowComponents[index]
    let newComponent = this.buildChildComponent(
      rowNode,
      this.spreadsheet.bodyTbody,
      nextComponent ? nextComponent.spreadsheetTr : null,
      this.timeAxisTbody,
      nextComponent ? nextComponent.timeAxisTr : null
    )

    rowComponents.splice(index, 0, newComponent)
    rowComponentsById[rowNode.id] = newComponent
  }


  removeRows(startIndex, len, oldRowNodes) {
    if (len) {
      let { rowComponents, rowComponentsById } = this

      for (let i = 0; i < len; i++) {
        let rowComponent = rowComponents[startIndex + i]

        rowComponent.destroy()

        delete rowComponentsById[oldRowNodes[i].id]
      }

      rowComponents.splice(startIndex, len)
    }
  }


  buildChildComponent(
    node: (GroupNode | ResourceNode),
    spreadsheetTbody: HTMLElement,
    spreadsheetNext: HTMLElement,
    timeAxisTbody: HTMLElement,
    timeAxisNext: HTMLElement
  ) {
    if ((node as GroupNode).group) {
      return new GroupRow(
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext
      )
    } else if ((node as ResourceNode).resource) {
      return new ResourceRow(
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext,
        this.timeAxis
      )
    }
  }


  updateRowProps(
    dateProfile: DateProfile,
    fallbackBusinessHours,
    splitProps: { [resourceId: string]: SplittableProps }
  ) {
    let { rowNodes, rowComponents, context } = this

    for (let i = 0; i < rowNodes.length; i++) {
      let rowNode = rowNodes[i]
      let rowComponent = rowComponents[i]

      if ((rowNode as GroupNode).group) {
        (rowComponent as GroupRow).receiveProps({
          spreadsheetColCnt: this.colSpecs.length,
          id: rowNode.id,
          isExpanded: rowNode.isExpanded,
          group: (rowNode as GroupNode).group
        }, context)
      } else {
        let resource = (rowNode as ResourceNode).resource

        ;(rowComponent as ResourceRow).receiveProps({
          ...splitProps[resource.id],
          dateProfile,
          nextDayThreshold: context.nextDayThreshold,
          businessHours: resource.businessHours || fallbackBusinessHours,
          colSpecs: this.colSpecs,
          id: rowNode.id,
          rowSpans: (rowNode as ResourceNode).rowSpans,
          depth: (rowNode as ResourceNode).depth,
          isExpanded: rowNode.isExpanded,
          hasChildren: (rowNode as ResourceNode).hasChildren,
          resource: (rowNode as ResourceNode).resource
        }, context)
      }
    }
  }


  updateSize(isResize, viewHeight, isAuto) {
    // FYI: this ordering is really important

    let { calendar } = this.context

    let isBaseSizing = isResize || calendar.isViewUpdated || calendar.isDatesUpdated || calendar.isEventsUpdated

    if (isBaseSizing) {
      this.syncHeadHeights()
    }

    // TODO: don't always call these (but guarding behind isBaseSizing was unreliable)
    this.timeAxis.updateSize(isResize, viewHeight - this.miscHeight, isAuto)
    this.spreadsheet.updateSize(isResize, viewHeight - this.miscHeight, isAuto)

    let rowSizingCnt = this.updateRowSizes(isResize)

    this.lane.updateSize(isResize) // is efficient. uses flags

    if (isBaseSizing || rowSizingCnt) {
      this.bodyScrollJoiner.update()
      this.timeAxis.layout.scrollJoiner.update() // hack

      this.rowPositions = new PositionCache(
        this.timeAxis.slats.el,
        this.rowComponents.map(function(rowComponent) {
          return rowComponent.timeAxisTr
        }),
        false, // isHorizontal
        true // isVertical
      )
      this.rowPositions.build()

      this.isStickyScrollDirty = true
    }
  }


  syncHeadHeights() {
    let spreadsheetHeadEl = this.spreadsheet.header.tableEl
    let timeAxisHeadEl = this.timeAxis.header.tableEl

    spreadsheetHeadEl.style.height = ''
    timeAxisHeadEl.style.height = ''

    let max = Math.max(
      spreadsheetHeadEl.getBoundingClientRect().height,
      timeAxisHeadEl.getBoundingClientRect().height
    )

    spreadsheetHeadEl.style.height =
      timeAxisHeadEl.style.height = max + 'px'
  }


  updateRowSizes(isResize: boolean): number { // mainly syncs row heights
    let dirtyRowComponents = this.rowComponents

    if (!isResize) {
      dirtyRowComponents = dirtyRowComponents.filter(function(rowComponent) {
        return rowComponent.isSizeDirty
      })
    }

    let elArrays = dirtyRowComponents.map(function(rowComponent) {
      return rowComponent.getHeightEls()
    })

    // reset to natural heights
    for (let elArray of elArrays) {
      for (let el of elArray) {
        el.style.height = ''
      }
    }

    // let rows update their contents' heights
    for (let rowComponent of dirtyRowComponents) {
      rowComponent.updateSize(isResize) // will reset isSizeDirty
    }

    let maxHeights = elArrays.map(function(elArray) {
      let maxHeight = null

      for (let el of elArray) {
        let height = el.getBoundingClientRect().height

        if (maxHeight === null || height > maxHeight) {
          maxHeight = height
        }
      }

      return maxHeight
    })

    for (let i = 0; i < elArrays.length; i++) {
      for (let el of elArrays[i]) {
        el.style.height = maxHeights[i] + 'px'
      }
    }

    return dirtyRowComponents.length
  }


  destroyRows() {
    for (let rowComponent of this.rowComponents) {
      rowComponent.destroy()
    }

    this.rowNodes = []
    this.rowComponents = []
  }


  destroy() {

    for (let resourceAreaWidthDragging of this.resourceAreaWidthDraggings) {
      resourceAreaWidthDragging.destroy()
    }

    this.renderSkeleton.unrender() // will call destroyRows

    super.destroy()
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator) {
    return this.timeAxis.getNowIndicatorUnit(dateProfile, dateProfileGenerator)
  }


  renderNowIndicator(date) {
    this.timeAxis.renderNowIndicator(date)
  }


  unrenderNowIndicator() {
    this.timeAxis.unrenderNowIndicator()
  }


  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down


  queryScroll() {
    let scroll = super.queryScroll()

    if (this.props.resourceStore) {
      __assign(scroll, this.queryResourceScroll())
    }

    return scroll
  }


  applyScroll(scroll, isResize) {
    super.applyScroll(scroll, isResize)

    if (this.props.resourceStore) {
      this.applyResourceScroll(scroll)
    }

    // avoid updating stickyscroll too often
    if (isResize || this.isStickyScrollDirty) {
      this.isStickyScrollDirty = false
      this.spreadsheetBodyStickyScroller.updateSize()
      this.timeAxis.updateStickyScrollers()
    }
  }


  computeDateScroll(duration: Duration) {
    return this.timeAxis.computeDateScroll(duration)
  }


  queryDateScroll() {
    return this.timeAxis.queryDateScroll()
  }


  applyDateScroll(scroll) {
    this.timeAxis.applyDateScroll(scroll)
  }


  queryResourceScroll() {
    let { rowComponents, rowNodes } = this
    let scroll = {} as any
    let scrollerTop = this.timeAxis.layout.bodyScroller.el.getBoundingClientRect().top // fixed position

    for (let i = 0; i < rowComponents.length; i++) {
      let rowComponent = rowComponents[i]
      let rowNode = rowNodes[i]

      let el = rowComponent.timeAxisTr
      let elBottom = el.getBoundingClientRect().bottom // fixed position

      if (elBottom > scrollerTop) {
        scroll.rowId = rowNode.id
        scroll.bottom = elBottom - scrollerTop
        break
      }
    }

    // TODO: what about left scroll state for spreadsheet area?
    return scroll
  }


  applyResourceScroll(scroll) {
    let rowId = scroll.forcedRowId || scroll.rowId

    if (rowId) {
      let rowComponent = this.rowComponentsById[rowId]

      if (rowComponent) {
        let el = rowComponent.timeAxisTr

        if (el) {
          let innerTop = this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.el.getBoundingClientRect().top
          let rowRect = el.getBoundingClientRect()
          let scrollTop =
            (scroll.forcedRowId ?
              rowRect.top : // just use top edge
              rowRect.bottom - scroll.bottom) - // pixels from bottom edge
            innerTop

          this.timeAxis.layout.bodyScroller.enhancedScroll.setScrollTop(scrollTop)
          this.spreadsheet.layout.bodyScroller.enhancedScroll.setScrollTop(scrollTop)
        }
      }
    }
  }

  // TODO: scrollToResource


  // Hit System
  // ------------------------------------------------------------------------------------------


  buildPositionCaches() {
    this.timeAxis.slats.updateSize()
    this.rowPositions.build()
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let { rowPositions } = this
    let slats = this.timeAxis.slats
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


  // Resource Area
  // ------------------------------------------------------------------------------------------------------------------


  setResourceAreaWidth(widthVal) {
    this.resourceAreaWidth = widthVal
    applyStyleProp(this.resourceAreaHeadEl, 'width', widthVal || '')
  }


  initResourceAreaWidthDragging() {
    let { calendar, isRtl } = this.context

    let resourceAreaDividerEls = Array.prototype.slice.call(
      this.el.querySelectorAll('.fc-col-resizer')
    )

    let ElementDraggingImpl = calendar.pluginSystem.hooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      this.resourceAreaWidthDraggings = resourceAreaDividerEls.map((el: HTMLElement) => {
        let dragging = new ElementDraggingImpl(el)
        let dragStartWidth
        let viewWidth

        dragging.emitter.on('dragstart', () => {
          dragStartWidth = this.resourceAreaWidth
          if (typeof dragStartWidth !== 'number') {
            dragStartWidth = this.resourceAreaHeadEl.getBoundingClientRect().width
          }
          viewWidth = this.el.getBoundingClientRect().width
        })

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          let newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)
          newWidth = Math.max(newWidth, MIN_RESOURCE_AREA_WIDTH)
          newWidth = Math.min(newWidth, viewWidth - MIN_RESOURCE_AREA_WIDTH)
          this.setResourceAreaWidth(newWidth)
        })

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

        return dragging
      })
    }
  }

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
