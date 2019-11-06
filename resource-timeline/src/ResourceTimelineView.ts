import { renderer, Calendar, ElementDragging, PositionCache, Hit, View, parseFieldSpecs, ComponentContext, memoize, DateProfile, applyStyleProp, PointerDragEvent,
  Duration, DateProfileGenerator, renderViewEl, findElements, createElement, SplittableProps, listRenderer, ListRendererItem, DomLocation } from '@fullcalendar/core'
import { ScrollJoiner, TimelineLane, TimeAxis, ClippedScroller, buildTimelineDateProfile, TimelineDateProfile } from '@fullcalendar/timeline'
import { ResourceHash, GroupNode, ResourceNode, ResourceViewProps, ResourceSplitter, buildResourceTextFunc, buildRowNodes } from '@fullcalendar/resource-common'
import Spreadsheet from './Spreadsheet'
import { __assign } from 'tslib'
import SpreadsheetRow from './SpreadsheetRow'
import SpreadsheetGroupRow, { SpreadsheetGroupRowProps } from './SpreadsheetGroupRow'
import ResourceTimelineLaneRow, { ResourceTimelineLaneRowProps } from './ResourceTimelineLaneRow'
import DividerRow from './DividerRow'

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

export default class ResourceTimelineView extends View {

  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processOptions = memoize(this._processOptions)
  private renderSkeleton = renderer(renderSkeleton)
  private renderTimeAxisTableWrap = renderer(renderTimeAxisTableWrap)
  private registerInteractive = renderer(this._registerInteractive, this._unregisterInteractive)
  private initResourceAreaResizing = renderer(this._initResourceAreaResizing, this._destroyResourceAreaResizing)
  private initBodyScrollJoiner = renderer(this._initBodyScrollJoiner, this._destroyBodyScrollJoiner)
  private hasNesting = memoize(hasNesting)
  private updateElHasNesting = memoize(updateElHasNesting)
  private hasResourceBusinessHours = memoize(hasResourceBusinessHours)
  private renderBgLane = renderer(TimelineLane)
  private renderTimeAxis = renderer(TimeAxis)
  private renderSpreadsheet = renderer(Spreadsheet)
  private buildRowNodes = memoize(buildRowNodes)
  private buildRowIdToIndex = memoize(buildRowIdToIndex)
  private buildSpreadsheetRowList = memoize(buildSpreadsheetRowList)
  private buildTimeAxisRowList = memoize(buildTimeAxisRowList)
  private renderSpreadsheetRows = listRenderer()
  private renderTimeAxisRows = listRenderer()

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private spreadsheet: Spreadsheet
  private timeAxis: TimeAxis
  private bgLane: TimelineLane // only for BG!!!!
  private bodyScrollJoiner: ScrollJoiner
  private isStickyScrollDirty = false
  private miscHeight: number
  private resourceAreaHeadEl: HTMLElement
  private resourceAreaWidth?: number
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private spreadsheetRows: (SpreadsheetRow | SpreadsheetGroupRow)[]
  private timeAxisRows: (ResourceTimelineLaneRow | DividerRow)[]
  private rowIdToIndex: { [rowId: string]: number } = {}
  private rowNodes: (GroupNode | ResourceNode)[]
  private rowPositions: PositionCache

  // computed options
  private superHeaderText: any
  private isVGrouping: any // used by row generation
  private groupSpecs: any // used by row generation
  private colSpecs: any
  private orderSpecs: any // used by row generation


  render(props: ResourceViewProps, context: ComponentContext) {
    this.processOptions(context.options, context.calendar)

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      context.options,
      props.dateProfileGenerator
    )

    let rowNodes = this.buildRowNodes(
      props.resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping,
      props.resourceEntityExpansions,
      context.options.resourcesInitiallyExpanded
    )

    let {
      rootEl,
      resourceAreaHeadEl,
      resourceAreaBodyEl,
      resourceAreaResizerEls,
      timeAreaHeadEl,
      timeAreaBodyEl
    } = this.renderSkeleton({ type: props.viewSpec.type })

    let splitProps = this.resourceSplitter.splitProps(props)
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    let spreadsheet = this.renderSpreadsheet({
      headerContainerEl: resourceAreaHeadEl,
      bodyContainerEl: resourceAreaBodyEl,
      superHeaderText: this.superHeaderText,
      colSpecs: this.colSpecs
    })

    let timeAxis = this.renderTimeAxis({
      headerContainerEl: timeAreaHeadEl,
      bodyContainerEl: timeAreaBodyEl,
      dateProfile: props.dateProfile,
      tDateProfile
    })

    let timeAxisBodyScroller = timeAxis.layout.bodyScroller
    let spreadsheetBodyScroller = spreadsheet.layout.bodyScroller

    // for all-resource bg events / selections / business-hours
    let bgLane = this.renderBgLane({
      ...splitProps[''],
      dateProfile: props.dateProfile,
      nextDayThreshold: context.nextDayThreshold,
      businessHours: hasResourceBusinessHours ? null : props.businessHours,
      fgContainerEl: null, // will render no fg events
      bgContainerEl: timeAxisBodyScroller.enhancedScroller.canvas.bgEl,
      dateProfileGenerator: props.dateProfileGenerator,
      tDateProfile
    })

    let timeAxisTableWrapRes = this.renderTimeAxisTableWrap({ parentEl: timeAxisBodyScroller.enhancedScroller.canvas.contentEl })

    this.rowIdToIndex = this.buildRowIdToIndex(rowNodes)

    let spreadsheetRowList = this.buildSpreadsheetRowList(rowNodes, this.colSpecs)
    let timeAxisRowList = this.buildTimeAxisRowList(
      rowNodes,
      props.dateProfile,
      props.dateProfileGenerator,
      tDateProfile,
      context.nextDayThreshold,
      hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
      splitProps
    )

    this.spreadsheetRows = this.renderSpreadsheetRows({ parentEl: spreadsheet.bodyTbody }, spreadsheetRowList) as any
    this.timeAxisRows = this.renderTimeAxisRows({ parentEl: timeAxisTableWrapRes.tbodyEl }, timeAxisRowList) as any

    this.spreadsheet = spreadsheet
    this.timeAxis = timeAxis
    this.bgLane = bgLane
    this.rowNodes = rowNodes

    this.updateElHasNesting({ el: rootEl, isNesting: this.hasNesting(rowNodes) })
    this.startNowIndicator()
    this.registerInteractive({ timeAxisEl: timeAxis.slats.rootEl })
    this.initResourceAreaResizing({ resourceAreaResizerEls })
    this.initBodyScrollJoiner({ spreadsheetBodyScroller, timeAxisBodyScroller })

    return rootEl
  }


  componentDidMount() {
    this.miscHeight = this.rootEl.getBoundingClientRect().height - Math.max(
      this.spreadsheet.layout.queryTotalHeight(),
      this.timeAxis.layout.queryTotalHeight()
    )
  }


  _processOptions(options, calendar: Calendar) {
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


  _registerInteractive(props: { timeAxisEl: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, { el: props.timeAxisEl })
  }


  _unregisterInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  _initBodyScrollJoiner(props: { spreadsheetBodyScroller: ClippedScroller, timeAxisBodyScroller: ClippedScroller }) {
    this.bodyScrollJoiner = new ScrollJoiner('vertical', [
      props.spreadsheetBodyScroller,
      props.timeAxisBodyScroller
    ])
  }


  _destroyBodyScrollJoiner() {
    this.bodyScrollJoiner.destroy()
  }


  updateSize(isResize, viewHeight, isAuto) {
    // FYI: this ordering is really important

    let isBaseSizing = isResize || this.isLayoutSizeDirty()

    if (isBaseSizing) {
      this.syncHeadHeights()
    }

    // TODO: don't always call these (but guarding behind isBaseSizing was unreliable)
    this.timeAxis.updateSize(isResize, viewHeight - this.miscHeight, isAuto)
    this.spreadsheet.updateSize(isResize, viewHeight - this.miscHeight, isAuto)

    let rowSizingCnt = this.updateRowSizes(isResize)

    this.bgLane.updateSize(isResize, this.timeAxis) // is efficient. uses flags

    if (isBaseSizing || rowSizingCnt) {
      this.bodyScrollJoiner.update()
      this.timeAxis.layout.buildScrollJoiner.current.update() // hack

      this.rowPositions = new PositionCache(
        this.timeAxis.slats.rootEl,
        this.timeAxisRows.map(function(rowComponent) {
          return rowComponent.rootEl
        }),
        false, // isHorizontal
        true // isVertical
      )
      this.rowPositions.build()

      this.isStickyScrollDirty = true
    }
  }


  syncHeadHeights() {
    let spreadsheetHeadEl = this.spreadsheet.header.rootEl
    let timeAxisHeadEl = this.timeAxis.header.rootEl

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
    let { spreadsheetRows, timeAxisRows, timeAxis } = this
    let rowCnt = spreadsheetRows.length
    let dirtyIndices: number[] = []

    for (let i = 0; i < rowCnt; i++) {
      if (isResize || spreadsheetRows[i].isSizeDirty || (timeAxisRows[i] as ResourceTimelineLaneRow).isSizeDirty) {
        dirtyIndices.push(i)
      }
    }

    let elArrays = dirtyIndices.map(function(i) {
      return [
        spreadsheetRows[i].heightEl,
        timeAxisRows[i].heightEl
      ]
    })

    // reset to natural heights
    for (let elArray of elArrays) {
      for (let el of elArray) {
        el.style.height = ''
      }
    }

    // let rows update their contents' heights
    for (let i of dirtyIndices) {
      spreadsheetRows[i].isSizeDirty = false

      let timeAxisRow = timeAxisRows[i]
      if (timeAxisRow instanceof ResourceTimelineLaneRow) {
        timeAxisRow.updateSize(isResize, timeAxis) // will reset isSizeDirty
      }
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

    return dirtyIndices.length
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------


  getNowIndicatorUnit() {
    return this.timeAxis.getNowIndicatorUnit()
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
      this.spreadsheet.updateStickyScrollers()
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
    let { timeAxisRows, rowNodes } = this
    let scroll = {} as any
    let scrollerTop = this.timeAxis.layout.bodyScroller.rootEl.getBoundingClientRect().top // fixed position

    for (let i = 0; i < timeAxisRows.length; i++) {
      let timeAxisRow = timeAxisRows[i]
      let rowNode = rowNodes[i]

      let el = timeAxisRow.rootEl
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
      let index = this.rowIdToIndex[rowId]

      if (index != null) {
        let timeAxisRow = this.timeAxisRows[index]

        if (timeAxisRow) {
          let el = timeAxisRow.rootEl

          if (el) {
            let innerTop = this.timeAxis.layout.bodyScroller.enhancedScroller.canvas.el.getBoundingClientRect().top
            let rowRect = el.getBoundingClientRect()
            let scrollTop =
              (scroll.forcedRowId ?
                rowRect.top : // just use top edge
                rowRect.bottom - scroll.bottom) - // pixels from bottom edge
              innerTop

            this.timeAxis.layout.bodyScroller.enhancedScroller.scroller.controller.setScrollTop(scrollTop)
            this.spreadsheet.layout.bodyScroller.enhancedScroller.scroller.controller.setScrollTop(scrollTop)
          }
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


  _initResourceAreaResizing({ resourceAreaResizerEls }: { resourceAreaResizerEls: HTMLElement[] }, context: ComponentContext) {
    let { isRtl, pluginHooks } = context

    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      return resourceAreaResizerEls.map((el: HTMLElement) => {
        let dragging = new ElementDraggingImpl(el)
        let dragStartWidth
        let viewWidth

        dragging.emitter.on('dragstart', () => {
          dragStartWidth = this.resourceAreaWidth
          if (typeof dragStartWidth !== 'number') {
            dragStartWidth = this.resourceAreaHeadEl.getBoundingClientRect().width
          }
          viewWidth = this.rootEl.getBoundingClientRect().width
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

    } else {
      return []
    }
  }


  _destroyResourceAreaResizing(draggings: ElementDragging[]) {
    for (let dragging of draggings) {
      dragging.destroy()
    }
  }

}


function renderSkeleton(props: { type: string }, context: ComponentContext) {
  let { options, theme } = context

  let el = renderViewEl(props.type)

  el.classList.add('fc-timeline')
  if (options.eventOverlap === false) {
    el.classList.add('fc-no-overlap')
  }

  el.innerHTML = `<table class="` + theme.getClass('tableGrid') + `"> \
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

  return {
    rootEl: el,
    resourceAreaHeadEl: el.querySelector('thead .fc-resource-area') as HTMLElement,
    resourceAreaBodyEl: el.querySelector('tbody .fc-resource-area') as HTMLElement,
    timeAreaHeadEl: el.querySelector('thead .fc-time-area') as HTMLElement,
    timeAreaBodyEl: el.querySelector('tbody .fc-time-area') as HTMLElement,
    resourceAreaResizerEls: findElements(el, '.fc-col-resizer')
  }
}


function renderTimeAxisTableWrap(funcProps: DomLocation) {
  let wrapEl = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')

  return {
    rootEl: wrapEl,
    tbodyEl: wrapEl.querySelector('tbody') as HTMLElement
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


function updateElHasNesting(props: { el: HTMLElement, isNesting: boolean }) {
  let { classList } = props.el

  if (props.isNesting) {
    classList.remove('fc-flat')
  } else {
    classList.add('fc-flat')
  }
}


function buildRowIdToIndex(nodes: (ResourceNode | GroupNode)[]) {
  let hash: { [rowId: string]: number } = {}

  for (let i = 0; i < nodes.length; i++) {
    hash[nodes[i].id] = i
  }

  return hash
}


function buildSpreadsheetRowList(nodes: (ResourceNode | GroupNode)[], colSpecs) {
  return nodes.map((node) => {
    if ((node as GroupNode).group) {
      return {
        id: node.id,
        componentClass: SpreadsheetGroupRow,
        props: {
          spreadsheetColCnt: colSpecs.length,
          id: node.id,
          isExpanded: node.isExpanded,
          group: (node as GroupNode).group
        } as SpreadsheetGroupRowProps
      }
    } else if ((node as ResourceNode).resource) {
      return {
        id: node.id,
        componentClass: SpreadsheetRow,
        props: {
          colSpecs,
          id: node.id,
          rowSpans: (node as ResourceNode).rowSpans,
          depth: (node as ResourceNode).depth,
          isExpanded: node.isExpanded,
          hasChildren: (node as ResourceNode).hasChildren,
          resource: (node as ResourceNode).resource
        }
      } as ListRendererItem<SpreadsheetRow>
    }
  })
}


function buildTimeAxisRowList(
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
      return {
        id: node.id,
        componentClass: DividerRow,
        props: {}
      }
    } else if ((node as ResourceNode).resource) {
      let resource = (node as ResourceNode).resource

      return {
        id: node.id,
        componentClass: ResourceTimelineLaneRow,
        props: {
          ...splitProps[resource.id],
          resourceId: resource.id,
          dateProfile,
          dateProfileGenerator,
          tDateProfile,
          nextDayThreshold,
          businessHours: resource.businessHours || fallbackBusinessHours
        } as ResourceTimelineLaneRowProps
      }
    }
  })
}
