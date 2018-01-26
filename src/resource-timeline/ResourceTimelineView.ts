import * as $ from 'jquery'
import {
  DragListener, CoordCache, parseFieldSpecs, compareByFieldSpecs, flexibleCompare
} from 'fullcalendar'
import ScrollJoiner from '../util/ScrollJoiner'
import ResourceComponentFootprint from '../models/ResourceComponentFootprint'
import { default as ResourceViewMixin, ResourceViewInterface } from '../ResourceViewMixin'
import TimelineView from '../timeline/TimelineView'
import Spreadsheet from './Spreadsheet'
import ResourceTimelineEventRenderer from './ResourceTimelineEventRenderer'
import RowParent from './row/RowParent'
import ResourceRow from './row/ResourceRow'
import HRowGroup from './row/HRowGroup'
import VRowGroup from './row/VRowGroup'
import EventRow from './row/EventRow'


export default class ResourceTimelineView extends TimelineView {

  initResourceView: ResourceViewInterface['initResourceView']
  getResourceTextFunc: ResourceViewInterface['getResourceTextFunc']

  // configuration for View monkeypatch
  canHandleSpecificResources: boolean

  // configuration for DateComponent monkeypatch
  isResourceFootprintsEnabled: boolean

  // renders non-resource bg events only
  eventRendererClass: any // initialized after class definition

  // time area
  timeBodyTbodyEl: any

  // spreadsheet area
  spreadsheet: any

  // divider
  dividerEls: any
  dividerWidth: any

  // resource rendering options
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  // resource rows
  tbodyHash: any // used by RowParent
  rowHierarchy: any
  resourceRowHash: { [resourceId: string]: ResourceRow }
  nestingCnt: number
  isNesting: any
  eventRows: any
  shownEventRows: any
  resourceScrollJoiner: any
  rowsNeedingHeightSync: any

  // positioning
  rowCoordCache: any

  // business hours
  indiBizCnt: number // number of resources with "independent" business hour definition
  isIndiBizRendered: boolean // are resources displaying business hours individually?
  isGenericBizRendered: boolean // is generic business hours rendered? (means all resources have same)
  genericBiz: any // generic (non-resource-specific) business hour generator


  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.canHandleSpecificResources = true
    this.isResourceFootprintsEnabled = true
    this.nestingCnt = 0
    this.indiBizCnt = 0
    this.isIndiBizRendered = false
    this.isGenericBizRendered = false

    this.initResourceView()
    this.processResourceOptions()
    this.spreadsheet = new Spreadsheet(this)
    this.rowHierarchy = new RowParent(this)
    this.rowHierarchy.isExpanded = true // hack to always show, regardless of resourcesInitiallyExpanded
    this.resourceRowHash = {}
  }


  // Resource Options
  // ------------------------------------------------------------------------------------------------------------------


  processResourceOptions() {
    const allColSpecs = this.opt('resourceColumns') || []
    const labelText = this.opt('resourceLabelText') // TODO: view.override
    const defaultLabelText = 'Resources' // TODO: view.defaults
    let superHeaderText = null

    if (!allColSpecs.length) {
      allColSpecs.push({
        labelText: labelText || defaultLabelText,
        text: this.getResourceTextFunc()
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
  }


  // Skeleton Rendering
  // ------------------------------------------------------------------------------------------------------------------


  renderSkeleton() {
    super.renderSkeleton()

    const { theme } = this.calendar

    this.spreadsheet.el = this.el.find('tbody .fc-resource-area')
    this.spreadsheet.headEl = this.el.find('thead .fc-resource-area')
    this.spreadsheet.renderSkeleton()
    // ^ is not a Grid/DateComponent

    // only non-resource grid needs this, so kill it
    // TODO: look into better solution
    this.segContainerEl.remove()
    this.segContainerEl = null

    const timeBodyContainerEl = $(`\
<div class="fc-rows"> \
<table class="` + theme.getClass('tableGrid') + `"> \
<tbody/> \
</table> \
</div>\
`).appendTo(this.timeBodyScroller.canvas.contentEl)
    this.timeBodyTbodyEl = timeBodyContainerEl.find('tbody')

    this.tbodyHash = { // needed for rows to render
      spreadsheet: this.spreadsheet.tbodyEl,
      event: this.timeBodyTbodyEl
    }

    this.resourceScrollJoiner = new ScrollJoiner('vertical', [
      this.spreadsheet.bodyScroller,
      this.timeBodyScroller
    ])

    this.initDividerMoving()
  }


  renderSkeletonHtml() {
    const { theme } = this.calendar

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


  // Divider Moving
  // ------------------------------------------------------------------------------------------------------------------


  initDividerMoving() {
    const left = this.opt('resourceAreaWidth')
    this.dividerEls = this.el.find('.fc-divider')

    // tableWidth available after spreadsheet.renderSkeleton
    this.dividerWidth = left != null ? left : this.spreadsheet.tableWidth

    if (this.dividerWidth != null) {
      this.positionDivider(this.dividerWidth)
    }

    this.dividerEls.on('mousedown', (ev) => {
      this.dividerMousedown(ev)
    })
  }


  dividerMousedown(ev) {
    const isRTL = this.opt('isRTL')
    const minWidth = 30
    const maxWidth = this.el.width() - 30
    const origWidth = this.getNaturalDividerWidth()

    const dragListener = new DragListener({
      dragStart: () => {
        this.dividerEls.addClass('fc-active')
      },
      drag: (dx, dy) => {
        let width
        if (isRTL) {
          width = origWidth - dx
        } else {
          width = origWidth + dx
        }

        width = Math.max(width, minWidth)
        width = Math.min(width, maxWidth)

        this.dividerWidth = width
        this.positionDivider(width)
        this.calendar.updateViewSize()
      }, // if in render queue, will wait until end
      dragEnd: () => {
        this.dividerEls.removeClass('fc-active')
      }
    })

    dragListener.startInteraction(ev)
  }


  getNaturalDividerWidth() {
    return this.el.find('.fc-resource-area').width() // TODO: don't we have this cached?
  }


  positionDivider(w) {
    this.el.find('.fc-resource-area').css('width', w) // TODO: don't we have this cached?
  }


  // Sizing
  // ------------------------------------------------------------------------------------------------------------------


  updateSize(totalHeight, isAuto, isResize) {

    let bodyHeight
    if (this.rowsNeedingHeightSync) {
      this.syncRowHeights(this.rowsNeedingHeightSync)
      this.rowsNeedingHeightSync = null
    } else { // a resize or an event rerender
      this.syncRowHeights() // sync all
    }

    const headHeight = this.syncHeadHeights()

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - headHeight - this.queryMiscHeight()
    }

    this.timeBodyScroller.setHeight(bodyHeight)
    this.spreadsheet.bodyScroller.setHeight(bodyHeight)
    this.spreadsheet.updateSize()

    // do children AFTER because of ScrollFollowerSprite abs position issues
    super.updateSize(totalHeight, isAuto, isResize)

    // do once spreadsheet area and event slat area have correct height, for gutters
    this.resourceScrollJoiner.update()
  }


  queryMiscHeight() {
    return this.el.outerHeight() -
      Math.max(this.spreadsheet.headScroller.el.outerHeight(), this.timeHeadScroller.el.outerHeight()) -
      Math.max(this.spreadsheet.bodyScroller.el.outerHeight(), this.timeBodyScroller.el.outerHeight())
  }


  syncHeadHeights() {
    this.spreadsheet.headHeight('auto')
    this.headHeight('auto')

    const headHeight = Math.max(this.spreadsheet.headHeight(), this.headHeight())

    this.spreadsheet.headHeight(headHeight)
    this.headHeight(headHeight)

    return headHeight
  }


  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down


  queryResourceScroll() {
    const scroll = {} as any
    const scrollerTop = this.timeBodyScroller.scrollEl.offset().top // TODO: use getClientRect

    for (let rowObj of this.getVisibleRows()) {
      if (rowObj.resource) {
        const el = rowObj.getTr('event')
        const elBottom = el.offset().top + el.outerHeight()

        if (elBottom > scrollerTop) {
          scroll.resourceId = rowObj.resource.id
          scroll.bottom = elBottom - scrollerTop
          break
        }
      }
    }

    // TODO: what about left scroll state for spreadsheet area?
    return scroll
  }


  applyResourceScroll(scroll) {
    if (scroll.resourceId) {
      const row = this.getResourceRow(scroll.resourceId)
      if (row) {
        const el = row.getTr('event')
        if (el) {
          const innerTop = this.timeBodyScroller.canvas.el.offset().top // TODO: use -scrollHeight or something
          const elBottom = el.offset().top + el.outerHeight()
          const scrollTop = elBottom - scroll.bottom - innerTop
          this.timeBodyScroller.setScrollTop(scrollTop)
          this.spreadsheet.bodyScroller.setScrollTop(scrollTop)
        }
      }
    }
  }


  scrollToResource(resource) {
    const row = this.getResourceRow(resource.id)
    if (row) {
      const el = row.getTr('event')
      if (el) {
        const innerTop = this.timeBodyScroller.canvas.el.offset().top // TODO: use -scrollHeight or something
        const scrollTop = el.offset().top - innerTop
        this.timeBodyScroller.setScrollTop(scrollTop)
        this.spreadsheet.bodyScroller.setScrollTop(scrollTop)
      }
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------------------------------


  prepareHits() {
    const shownEventRows = []

    super.prepareHits()

    this.eventRows = this.getEventRows()
    this.eventRows.forEach((row) => {
      if (row.get('isInDom')) {
        shownEventRows.push(row)
      }
    })

    const trArray = shownEventRows.map((row) => (
      row.getTr('event')[0]
    ))

    this.shownEventRows = shownEventRows

    this.rowCoordCache = new CoordCache({
      els: trArray,
      isVertical: true
    })
    this.rowCoordCache.build()
  }


  releaseHits() {
    super.releaseHits()
    this.eventRows = null
    this.shownEventRows = null
    this.rowCoordCache.clear()
  }


  queryHit(leftOffset, topOffset): any {
    const simpleHit = super.queryHit(leftOffset, topOffset)
    if (simpleHit) {
      const rowIndex = this.rowCoordCache.getVerticalIndex(topOffset)
      if (rowIndex != null) {
        return {
          resourceId: this.shownEventRows[rowIndex].resource.id,
          snap: simpleHit.snap,
          component: this, // need this unfortunately :(
          left: simpleHit.left,
          right: simpleHit.right,
          top: this.rowCoordCache.getTopOffset(rowIndex),
          bottom: this.rowCoordCache.getBottomOffset(rowIndex)
        }
      }
    }
  }


  getHitFootprint(hit) {
    const componentFootprint = super.getHitFootprint(hit)

    return new ResourceComponentFootprint(
      componentFootprint.unzonedRange,
      componentFootprint.isAllDay,
      hit.resourceId
    )
  }


  getHitEl(hit) {
    return this.getSnapEl(hit.snap)
  }


  // Resource Data
  // ------------------------------------------------------------------------------------------------------------------


  renderResources(resources) {
    for (let resource of resources) {
      this.renderResource(resource)
    }
  }


  unrenderResources() {
    this.rowHierarchy.removeElement()
    this.rowHierarchy.removeChildren()

    for (let id in this.resourceRowHash) {
      this.removeChild(this.resourceRowHash[id]) // for DateComponent!
    }

    this.resourceRowHash = {}
  }


  renderResource(resource) {
    this.insertResource(resource)
  }


  unrenderResource(resource) {
    this.removeResource(resource)
  }


  // Event Rendering
  // ------------------------------------------------------------------------------------------------------------------


  executeEventRender(eventsPayload) {
    const payloadsByResourceId = {}
    const genericPayload = {}
    let resourceId

    for (let eventDefId in eventsPayload) {
      const eventInstanceGroup = eventsPayload[eventDefId]
      const eventDef = eventInstanceGroup.getEventDef()
      const resourceIds = eventDef.getResourceIds()

      if (resourceIds.length) {
        for (resourceId of resourceIds) {
          let bucket = payloadsByResourceId[resourceId] || (payloadsByResourceId[resourceId] = {})
          bucket[eventDefId] = eventInstanceGroup
        }
      // only render bg segs that have no resources
      } else if (eventDef.hasBgRendering()) {
        genericPayload[eventDefId] = eventInstanceGroup
      }
    }

    this.eventRenderer.render(genericPayload)

    for (resourceId in payloadsByResourceId) {
      const resourceEventsPayload = payloadsByResourceId[resourceId]
      const row = this.getResourceRow(resourceId)

      if (row) {
        row.executeEventRender(resourceEventsPayload)
      }
    }

  }


  // Business Hours Rendering
  // ------------------------------------------------------------------------------------------------------------------


  renderBusinessHours(businessHourGenerator) {
    this.genericBiz = businessHourGenerator // save for later
    this.isIndiBizRendered = false
    this.isGenericBizRendered = false

    if (this.indiBizCnt) {
      this.isIndiBizRendered = true

      for (let row of this.getEventRows()) {
        row.renderBusinessHours(
          (row as ResourceRow).resource.businessHourGenerator ||
          businessHourGenerator
        )
      }
    } else {
      this.isGenericBizRendered = true
      this.businessHourRenderer.render(businessHourGenerator)
    }
  }


  updateIndiBiz() {
    if (
      (this.indiBizCnt && this.isGenericBizRendered) ||
      (!this.indiBizCnt && this.isIndiBizRendered)
    ) {
      this.unrenderBusinessHours()
      this.renderBusinessHours(this.genericBiz)
    }
  }


  // Row Management
  // ------------------------------------------------------------------------------------------------------------------


  // creates a row for the given resource and inserts it into the hierarchy.
  // if `parentResourceRow` is given, inserts it as a direct child
  // does not render
  insertResource(resource, parentResourceRow?) {
    const noExplicitParent = !parentResourceRow
    const row = new ResourceRow(this, resource)

    if (!parentResourceRow) {
      if (resource.parent) {
        parentResourceRow = this.getResourceRow(resource.parent.id)
      } else if (resource.parentId) {
        parentResourceRow = this.getResourceRow(resource.parentId)
      }
    }

    if (parentResourceRow) {
      this.insertRowAsChild(row, parentResourceRow)
    } else {
      this.insertRow(row)
    }

    this.addChild(row) // for DateComponent!
    this.resourceRowHash[resource.id] = row

    if (resource.businessHourGenerator) {
      this.indiBizCnt++

      // hack to get dynamically-added resources with custom business hours to render
      if (this.isIndiBizRendered) {
        row.businessHourGenerator = resource.businessHourGenerator
      }

      this.updateIndiBiz()
    }

    for (let childResource of resource.children) {
      this.insertResource(childResource, row)
    }

    if (noExplicitParent && computeIsChildrenVisible(row.parent)) {
      row.renderSkeleton()
    }

    return row
  }


  // does not unrender
  removeResource(resource) {
    const row = this.resourceRowHash[resource.id]

    if (row) {
      delete this.resourceRowHash[resource.id]

      this.removeChild(row) // for DateComponent!

      row.removeFromParentAndDom()

      if (resource.businessHourGenerator) {
        this.indiBizCnt--
        this.updateIndiBiz()
      }
    }

    return row
  }


  // inserts the given row into the hierarchy.
  // `parent` can be any tree root of the hierarchy.
  // `orderSpecs` will recursively create groups within the root before inserting the row.
  insertRow(row, parent = this.rowHierarchy, groupSpecs = this.groupSpecs) {
    if (groupSpecs.length) {
      const group = this.ensureResourceGroup(row, parent, groupSpecs[0])

      if (group instanceof HRowGroup) {
        this.insertRowAsChild(row, group) // horizontal rows can only be one level deep
      } else {
        this.insertRow(row, group, groupSpecs.slice(1))
      }
    } else {
      this.insertRowAsChild(row, parent)
    }
  }


  // inserts the given row as a direct child of the given parent
  insertRowAsChild(row, parent) {
    return parent.addChildRowNode(row, this.computeChildRowPosition(row, parent))
  }


  // computes the position at which the given node should be inserted into the parent's children
  // if no specific position is determined, returns null
  computeChildRowPosition(child, parent) {
    if (this.orderSpecs.length) {
      for (let i = 0; i < parent.children.length; i++) {
        const sibling = parent.children[i]
        const cmp = this.compareResources(sibling.resource || {}, child.resource || {})
        if (cmp > 0) { // went 1 past. insert at i
          return i
        }
      }
    }
    return null
  }


  // given two resources, returns a cmp value (-1, 0, 1)
  compareResources(a, b) {
    return compareByFieldSpecs(a, b, this.orderSpecs)
  }


  // given information on how a row should be inserted into one of the parent's child groups,
  // ensure a child group exists, creating it if necessary, and then return it.
  // spec MIGHT NOT HAVE AN ORDER
  ensureResourceGroup(row, parent, spec) {
    let i
    let testGroup
    const groupValue = (row.resource || {})[spec.field] // the groupValue of the row
    let group = null

    // find an existing group that matches, or determine the position for a new group
    if (spec.order) {
      for (i = 0; i < parent.children.length; i++) {
        testGroup = parent.children[i]
        const cmp = flexibleCompare(testGroup.groupValue, groupValue) * spec.order
        if (cmp === 0) { // an exact match with an existing group
          group = testGroup
          break
        } else if (cmp > 0) { // the row's desired group is after testGroup. insert at this position
          break
        }
      }
    } else { // the groups are unordered
      for (i = 0; i < parent.children.length; i++) {
        testGroup = parent.children[i]
        if (testGroup.groupValue === groupValue) {
          group = testGroup
          break
        }
      }
    } // `i` will be at the end if group was not found

    // create a new group
    if (!group) {
      if (this.isVGrouping) {
        group = new VRowGroup(this, spec, groupValue)
      } else {
        group = new HRowGroup(this, spec, groupValue)
      }

      parent.addChildRowNode(group, i)
      group.renderSkeleton() // always immediately render groups
    }

    return group
  }


  // Row Rendering
  // ------------------------------------------------------------------------------------------------------------------


  descendantAdded(row) {
    const wasNesting = this.isNesting
    const isNesting = Boolean(
      this.nestingCnt += row.depth ? 1 : 0
    )

    if (wasNesting !== isNesting) {

      this.el.toggleClass('fc-nested', isNesting)
        .toggleClass('fc-flat', !isNesting)

      this.isNesting = isNesting
    }
  }


  descendantRemoved(row) {
    const wasNesting = this.isNesting
    const isNesting = Boolean(
      this.nestingCnt -= row.depth ? 1 : 0
    )

    if (wasNesting !== isNesting) {

      this.el.toggleClass('fc-nested', isNesting)
        .toggleClass('fc-flat', !isNesting)

      this.isNesting = isNesting
    }
  }


  descendantShown(row) {
    (this.rowsNeedingHeightSync || (this.rowsNeedingHeightSync = [])).push(row)
  }


  descendantHidden(row) {
    if (!this.rowsNeedingHeightSync) { // signals to updateSize that specific rows hidden
      this.rowsNeedingHeightSync = []
    }
  }


  // visibleRows is flat. does not do recursive
  syncRowHeights(visibleRows = this.getVisibleRows(), safe = false) {

    for (let row of visibleRows) {
      row.setTrInnerHeight('')
    }

    const innerHeights = visibleRows.map((row) => {
      let h = row.getMaxTrInnerHeight()
      if (safe) {
        h += h % 2 // FF and zoom only like even numbers for alignment
      }
      return h
    })

    for (let i = 0; i < visibleRows.length; i++) {
      let row = visibleRows[i]
      row.setTrInnerHeight(innerHeights[i])
    }

    if (!safe) {
      const h1 = this.spreadsheet.tbodyEl.height()
      const h2 = this.timeBodyTbodyEl.height()
      if (Math.abs(h1 - h2) > 1) {
        this.syncRowHeights(visibleRows, true)
      }
    }
  }


  // Row Querying
  // ------------------------------------------------------------------------------------------------------------------


  getVisibleRows() {
    const result = []

    for (let row of this.rowHierarchy.getRows()) {
      if (row.get('isInDom')) {
        result.push(row)
      }
    }

    return result
  }


  getEventRows(): EventRow[] {
    return this.rowHierarchy.getRows().filter((row) => (
      row instanceof EventRow
    ))
  }


  getResourceRow(resourceId) {
    return this.resourceRowHash[resourceId]
  }


  // Selection
  // ------------------------------------------------------------------------------------------------------------------


  renderSelectionFootprint(componentFootprint) {
    if (componentFootprint.resourceId) {
      const rowObj = this.getResourceRow(componentFootprint.resourceId)

      if (rowObj) {
        return rowObj.renderSelectionFootprint(componentFootprint)
      }
    } else {
      return super.renderSelectionFootprint(componentFootprint)
    }
  }


  // Event Resizing (route to rows)
  // ------------------------------------------------------------------------------------------------------------------


  renderEventResize(eventFootprints, seg, isTouch) {
    const map = groupEventFootprintsByResourceId(eventFootprints)

    for (let resourceId in map) {
      const resourceEventFootprints = map[resourceId]
      let rowObj = this.getResourceRow(resourceId)

      // render helpers
      rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)

      // render highlight
      for (let eventFootprint of resourceEventFootprints) {
        rowObj.renderHighlight(eventFootprint.componentFootprint)
      }
    }
  }


  unrenderEventResize() {
    for (let rowObj of this.getEventRows()) {
      rowObj.helperRenderer.unrender()
      rowObj.unrenderHighlight()
    }
  }


  // DnD (route to rows)
  // ------------------------------------------------------------------------------------------------------------------


  renderDrag(eventFootprints, seg, isTouch) {
    const map = groupEventFootprintsByResourceId(eventFootprints)
    let resourceEventFootprints
    let resourceId
    let rowObj

    if (seg) {
      // draw helper
      for (resourceId in map) {
        resourceEventFootprints = map[resourceId]
        rowObj = this.getResourceRow(resourceId)
        rowObj.helperRenderer.renderEventDraggingFootprints(resourceEventFootprints, seg, isTouch)
      }

      return true // signal helper rendered
    } else {
      // draw highlight
      for (resourceId in map) {
        resourceEventFootprints = map[resourceId]

        for (let eventFootprint of resourceEventFootprints) {
          rowObj = this.getResourceRow(resourceId)
          rowObj.renderHighlight(eventFootprint.componentFootprint)
        }
      }

      return false // signal helper not rendered
    }
  }


  unrenderDrag() {
    for (let rowObj of this.getEventRows()) {
      rowObj.helperRenderer.unrender()
      rowObj.unrenderHighlight()
    }
  }

}

ResourceTimelineView.prototype.eventRendererClass = ResourceTimelineEventRenderer

ResourceViewMixin.mixInto(ResourceTimelineView)


// Utils
// ------------------------------------------------------------------------------------------------------------------


function groupEventFootprintsByResourceId(eventFootprints) {
  const map = {}

  for (let eventFootprint of eventFootprints) {
    (map[eventFootprint.componentFootprint.resourceId] || (map[eventFootprint.componentFootprint.resourceId] = []))
      .push(eventFootprint)
  }

  return map
}


/*
if `current` is null, returns true
*/
function computeIsChildrenVisible(current) {
  while (current) {
    if (!current.isExpanded) {
      return false
    }
    current = current.parent
  }
  return true
}
