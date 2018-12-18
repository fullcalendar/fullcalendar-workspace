import { SplittableProps, memoizeRendering, PositionCache, Hit, OffsetTracker, View, ViewSpec, createElement, parseFieldSpecs, ComponentContext, DateProfileGenerator, memoize, assignTo, DateProfile } from 'fullcalendar'
import TimeAxis from '../timeline/TimeAxis'
import { ResourceHash } from '../structs/resource'
import { buildRowNodes, GroupNode, ResourceNode } from '../common/resource-hierarchy'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'
import ScrollJoiner from '../util/ScrollJoiner'
import Spreadsheet from './Spreadsheet'
import TimelineLane from '../timeline/TimelineLane'
import { ResourceViewProps } from '../View'
import ResourceSplitter from '../common/ResourceSplitter'
import { buildResourceTextFunc } from '../common/resource-rendering'

export default class ResourceTimelineView extends View {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  // child components
  spreadsheet: Spreadsheet
  timeAxis: TimeAxis
  lane: TimelineLane
  bodyScrollJoiner: ScrollJoiner

  timeAxisTbody: HTMLElement
  miscHeight: number
  rowNodes: (GroupNode | ResourceNode)[] = []
  rowComponents: (GroupRow | ResourceRow)[] = []
  rowComponentsById: { [id: string]: (GroupRow | ResourceRow) } = {}

  // internal state
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  rowPositions: PositionCache
  offsetTracker: OffsetTracker

  private splitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private hasResourceBusinessHours = memoize(hasResourceBusinessHours)
  private buildRowNodes = memoize(buildRowNodes)
  private hasNesting = memoize(hasNesting)
  private _updateHasNesting = memoizeRendering(this.updateHasNesting)


  constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement) {
    super(context, viewSpec, dateProfileGenerator, parentEl)

    let allColSpecs = this.opt('resourceColumns') || []
    let labelText = this.opt('resourceLabelText') // TODO: view.override
    let defaultLabelText = 'Resources' // TODO: view.defaults
    let superHeaderText = null

    if (!allColSpecs.length) {
      allColSpecs.push({
        labelText: labelText || defaultLabelText,
        text: buildResourceTextFunc(this.opt('resourceText'), this.calendar)
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
      const hGroupField = this.opt('resourceGroupField')
      if (hGroupField) {
        isHGrouping = true
        groupSpecs.push({
          field: hGroupField,
          text: this.opt('resourceGroupText'),
          render: this.opt('resourceGroupRender')
        })
      }
    }

    const allOrderSpecs = parseFieldSpecs(this.opt('resourceOrder'))
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

    if (this.opt('eventOverlap') === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()

    this.miscHeight = this.el.offsetHeight

    this.spreadsheet = new Spreadsheet(
      this.context,
      this.el.querySelector('thead .fc-resource-area'),
      this.el.querySelector('tbody .fc-resource-area')
    )

    this.timeAxis = new TimeAxis(
      this.context,
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    let timeAxisRowContainer = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(timeAxisRowContainer)
    this.timeAxisTbody = timeAxisRowContainer.querySelector('tbody')

    this.lane = new TimelineLane(
      this.context,
      null,
      this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.bgEl,
      this.timeAxis
    )

    this.bodyScrollJoiner = new ScrollJoiner('vertical', [
      this.spreadsheet.layout.bodyScroller,
      this.timeAxis.layout.bodyScroller
    ])

    this.spreadsheet.receiveProps({
      superHeaderText: this.superHeaderText,
      colSpecs: this.colSpecs
    })
  }

  renderSkeletonHtml() {
    let { theme } = this
    let width = this.opt('resourceAreaWidth') as any
    let widthAttr = ''

    if (width) {
      widthAttr = 'style="width:' + (typeof width === 'number' ? width + 'px' : width) + '"'
    }

    return `<table class="` + theme.getClass('tableGrid') + `"> \
<thead class="fc-head"> \
<tr> \
<td class="fc-resource-area ` + theme.getClass('widgetHeader') + `" ` + widthAttr + `></td> \
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

  render(props: ResourceViewProps) {
    super.render(props)

    let splitProps = this.splitter.splitProps(props)
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    this.timeAxis.receiveProps({
      dateProfile: props.dateProfile
    })

    // for all-resource bg events / selections / business-hours
    this.lane.receiveProps(
      Object.assign({}, splitProps[''], {
        dateProfile: props.dateProfile,
        nextDayThreshold: this.nextDayThreshold,
        businessHours: hasResourceBusinessHours ? null : props.businessHours
      })
    )

    let newRowNodes = this.buildRowNodes(
      props.resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping,
      props.resourceEntityExpansions,
      this.opt('resourcesInitiallyExpanded')
    )

    this._updateHasNesting(this.hasNesting(newRowNodes))

    this.diffRows(newRowNodes)
    this.renderRows(
      props.dateProfile,
      hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
      splitProps
    )
  }

  updateHasNesting(isNesting: boolean) {
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
        this.context,
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext
      )
    } else if ((node as ResourceNode).resource) {
      return new ResourceRow(
        this.context,
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext,
        this.timeAxis
      )
    }
  }

  renderRows(
    dateProfile: DateProfile,
    fallbackBusinessHours,
    splitProps: { [resourceId: string]: SplittableProps }
  ) {
    let { rowNodes, rowComponents } = this

    for (let i = 0; i < rowNodes.length; i++) {
      let rowNode = rowNodes[i]
      let rowComponent = rowComponents[i]

      if ((rowNode as GroupNode).group) {
        (rowComponent as GroupRow).receiveProps({
          spreadsheetColCnt: this.colSpecs.length,
          id: rowNode.id,
          isExpanded: rowNode.isExpanded,
          group: (rowNode as GroupNode).group
        })
      } else {
        let resource = (rowNode as ResourceNode).resource;

        (rowComponent as ResourceRow).receiveProps(
          Object.assign({}, splitProps[resource.id], {
            dateProfile,
            nextDayThreshold: this.nextDayThreshold,
            businessHours: resource.businessHours || fallbackBusinessHours,
            colSpecs: this.colSpecs,
            id: rowNode.id,
            rowSpans: (rowNode as ResourceNode).rowSpans,
            depth: (rowNode as ResourceNode).depth,
            isExpanded: rowNode.isExpanded,
            hasChildren: (rowNode as ResourceNode).hasChildren,
            resource: (rowNode as ResourceNode).resource
          })
        )
      }
    }
  }

  updateSize(isResize, viewHeight, isAuto) {
    // FYI: this ordering is really important

    let { calendar } = this

    let isBaseSizing = isResize || calendar.isViewUpdated || calendar.isDatesUpdated || calendar.isEventsUpdated

    if (isBaseSizing) {
      this.syncHeadHeights()
      this.timeAxis.updateSize(isResize, viewHeight - this.miscHeight, isAuto)
      this.spreadsheet.updateSize(isResize, viewHeight - this.miscHeight, isAuto)
    }

    let rowSizingCnt = this.updateRowSizes(isResize)

    this.lane.updateSize(isResize) // is efficient. uses flags

    if (isBaseSizing || rowSizingCnt) {
      this.bodyScrollJoiner.update()
      this.timeAxis.layout.scrollJoiner.update() // hack
    }
  }

  syncHeadHeights() {
    let spreadsheetHeadEl = this.spreadsheet.header.tableEl
    let timeAxisHeadEl = this.timeAxis.header.tableEl

    spreadsheetHeadEl.style.height = ''
    timeAxisHeadEl.style.height = ''

    let max = Math.max(
      spreadsheetHeadEl.offsetHeight,
      timeAxisHeadEl.offsetHeight
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
        let height = el.offsetHeight

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

  destroy() {
    for (let rowComponent of this.rowComponents) {
      rowComponent.destroy()
    }

    this.rowNodes = []
    this.rowComponents = []

    this.spreadsheet.destroy()
    this.timeAxis.destroy()

    super.destroy()
  }


  // Now Indicator
  // ------------------------------------------------------------------------------------------

  getNowIndicatorUnit(dateProfile: DateProfile) {
    return this.timeAxis.getNowIndicatorUnit(dateProfile)
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
      assignTo(scroll, this.queryResourceScroll())
    }

    return scroll
  }

  applyScroll(scroll) {
    super.applyScroll(scroll)

    if (this.props.resourceStore) {
      this.applyResourceScroll(scroll)
    }
  }

  computeInitialDateScroll() {
    return this.timeAxis.computeInitialDateScroll()
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

  prepareHits() {
    let originEl = this.timeAxis.slats.el

    this.offsetTracker = new OffsetTracker(originEl)

    this.rowPositions = new PositionCache(
      originEl,
      this.rowComponents.map(function(rowComponent) {
        return rowComponent.timeAxisTr
      }),
      false, // isHorizontal
      true // isVertical
    )
    this.rowPositions.build()
  }

  releaseHits() {
    this.offsetTracker.destroy()
    this.rowPositions = null
  }

  queryHit(leftOffset, topOffset): Hit {
    let { offsetTracker, rowPositions } = this
    let slats = this.timeAxis.slats
    let rowIndex = rowPositions.topToIndex(topOffset - offsetTracker.computeTop())

    if (rowIndex != null) {
      let resource = (this.rowNodes[rowIndex] as ResourceNode).resource

      if (resource) { // not a group

        if (offsetTracker.isWithinClipping(leftOffset, topOffset)) {
          let slatHit = slats.positionToHit(leftOffset - offsetTracker.computeLeft())

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
  }

}

ResourceTimelineView.prototype.isInteractable = true


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
