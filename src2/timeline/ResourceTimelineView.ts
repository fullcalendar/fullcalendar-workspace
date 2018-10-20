import { View, createElement, parseFieldSpecs, DateComponentRenderState, createEmptyEventStore, EventDef, EventStore } from 'fullcalendar'
import TimeAxis from './TimeAxis'
import { ResourceHash } from '../structs/resource'
import { buildRowNodes, isNodesEqual, GroupNode, ResourceNode } from './resource-hierarchy'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'
import ScrollJoiner from '../util/ScrollJoiner'
import Spreadsheet from './Spreadsheet'
import TimelineLane from './TimelineLane'

const LOOKAHEAD = 3

export default class ResourceTimelineView extends View {

  // child components
  spreadsheet: Spreadsheet
  timeAxis: TimeAxis
  lane: TimelineLane
  bodyScrollJoiner: ScrollJoiner

  timeAxisTbody: HTMLElement
  miscHeight: number
  rowNodes: (GroupNode | ResourceNode)[] = []
  rowComponents: (GroupRow | ResourceRow)[] = []

  // internal state
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    let allColSpecs = this.opt('resourceColumns') || []
    let labelText = this.opt('resourceLabelText') // TODO: view.override
    let defaultLabelText = 'Resources' // TODO: view.defaults
    let superHeaderText = null

    if (!allColSpecs.length) {
      allColSpecs.push({
        labelText: labelText || defaultLabelText,
        text: 'Resources!' // this.getResourceTextFunc()
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

  renderSkeleton() {
    this.el.classList.add('fc-timeline')
    this.el.innerHTML = this.renderSkeletonHtml()

    this.miscHeight = this.el.offsetHeight

    this.spreadsheet = new Spreadsheet(
      this,
      this.el.querySelector('thead .fc-resource-area'),
      this.el.querySelector('tbody .fc-resource-area')
    )

    this.timeAxis = new TimeAxis(
      this,
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    let timeAxisRowContainer = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(timeAxisRowContainer)
    this.timeAxisTbody = timeAxisRowContainer.querySelector('tbody')

    this.lane = new TimelineLane(this.view)
    this.lane.setParents(
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
    let theme = this.getTheme()

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

  renderChildren(props: DateComponentRenderState, forceFlags) {

    // not best place for this
    // TODO: cache
    let hasResourceBusinessHours = this.hasResourceBusinessHours(props.resourceStore)

    // TODO: rename. done by PUBLIC ID
    // TODO: cache
    let eventStoresByResourceId = splitEventStores(props.eventStore)

    this.timeAxis.receiveProps({
      dateProfile: props.dateProfile
    })

    this.lane.render({
      dateProfile: props.dateProfile,
      businessHours: hasResourceBusinessHours ? createEmptyEventStore() : props.businessHours, // BAD for caching!?
      eventStore: eventStoresByResourceId[''] || createEmptyEventStore(), // BAD for caching!?
      eventUis: props.eventUis,
      dateSelection: (props.dateSelection && !props.dateSelection.resourceId) ? props.dateSelection : null,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,

      // gahhhhh
      resource: null,
      resourceStore: null,
    }, forceFlags)

    this.receiveResourceData(props.resourceStore)
    this.renderRows(
      props,
      forceFlags,
      hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
      eventStoresByResourceId
    )
  }

  hasResourceBusinessHours(resourceStore: ResourceHash) {
    for (let resourceId in resourceStore) {
      let resource = resourceStore[resourceId]

      if (resource.businessHours) {
        return true
      }
    }

    return false
  }

  receiveResourceData(resourceStore: ResourceHash) {
    let { rowComponents } = this
    let oldRowNodes = this.rowNodes
    let newRowNodes = buildRowNodes(
      resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping
    )
    let oldI = 0
    let newI = 0

    for (newI = 0; newI < newRowNodes.length; newI++) {
      let newRow = newRowNodes[newI]
      let oldRowFound = false

      if (oldI < oldRowNodes.length) {
        let oldRow = oldRowNodes[oldI]

        if (isNodesEqual(oldRow, newRow)) {
          oldRowFound = true
          oldI++
        } else {

          for (let oldLookaheadI = oldI; oldLookaheadI < oldI + LOOKAHEAD; oldLookaheadI++) {
            let oldLookaheadRow = oldRowNodes[oldLookaheadI]

            if (isNodesEqual(oldLookaheadRow, newRow)) {
              removeRows(rowComponents, oldI, oldLookaheadI)
              oldI = oldLookaheadI
              oldRowFound = true
              break
            }
          }
        }
      }

      if (!oldRowFound) {
        this.addRow(rowComponents, newI, newRow)
      }
    }

    this.rowNodes = newRowNodes
  }

  addRow(rowComponents, index, rowNode) {
    let nextComponent = rowComponents[index]
    let newComponent = this.buildChildComponent(
      rowNode,
      this.spreadsheet.bodyTbody,
      nextComponent ? nextComponent.spreadsheetTr : null,
      this.timeAxisTbody,
      nextComponent ? nextComponent.timeAxisTr : null
    )

    rowComponents.splice(index, 0, newComponent)
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
        this,
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext
      )
    } else if ((node as ResourceNode).resource) {
      return new ResourceRow(
        this,
        spreadsheetTbody,
        spreadsheetNext,
        timeAxisTbody,
        timeAxisNext,
        this.timeAxis
      )
    }
  }

  renderRows(props: DateComponentRenderState, forceFlags, fallbackBusinessHours, eventStoresByResourceId) {
    let { rowNodes, rowComponents } = this

    for (let i = 0; i < rowNodes.length; i++) {
      let rowNode = rowNodes[i]
      let rowComponent = rowComponents[i]

      if ((rowNode as GroupNode).group) {
        (rowComponent as GroupRow).receiveProps({
          group: (rowNode as GroupNode).group,
          spreadsheetColCnt: this.colSpecs.length
        })
      } else {
        let resourceId = (rowNode as ResourceNode).resource.resourceId
        let resourcePublicId = (rowNode as ResourceNode).resource.publicId;

        (rowComponent as ResourceRow).receiveProps({
          dateProfile: props.dateProfile,
          businessHours: props.businessHours || fallbackBusinessHours,
          eventStore: (resourcePublicId && eventStoresByResourceId[resourcePublicId]) || createEmptyEventStore(), // TODO: bad for caching
          eventUis: props.eventUis,
          dateSelection: (props.dateSelection && props.dateSelection.resourceId === resourceId) ? props.dateSelection : null,
          eventSelection: props.eventSelection,
          eventDrag: props.eventDrag,
          eventResize: props.eventResize,
          resourceStore: null, // gaaaahhhh

          resource: (rowNode as ResourceNode).resource,
          resourceFields: (rowNode as ResourceNode).resourceFields,
          rowSpans: (rowNode as ResourceNode).rowSpans,
          depth: (rowNode as ResourceNode).depth,
          hasChildren: (rowNode as ResourceNode).hasChildren,
          colSpecs: this.colSpecs
        })
      }
    }
  }

  updateSize(totalHeight, isAuto, force) {
    // FYI: this ordering is really important

    this.syncHeadHeights()

    this.timeAxis.updateHeight(totalHeight - this.miscHeight, isAuto)
    this.spreadsheet.updateHeight(totalHeight - this.miscHeight, isAuto)

    for (let rowComponent of this.rowComponents) {
      rowComponent.updateSize()
    }

    this.syncRowHeights()
    this.lane.updateSize(totalHeight, isAuto, force)
    this.bodyScrollJoiner.update()
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

  syncRowHeights() {
    let elArrays = this.rowComponents.map(function(rowComponent) {
      return rowComponent.getHeightEls()
    })

    for (let elArray of elArrays) {
      for (let el of elArray) {
        el.style.height = ''
      }
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
  }

  removeElement() {
    for (let rowComponent of this.rowComponents) {
      rowComponent.destroy()
    }

    this.rowNodes = []
    this.rowComponents = []

    this.spreadsheet.destroy()
    this.timeAxis.destroy()

    super.removeElement()
  }

}

function removeRows(rowComponents, startRemoveI, endRemoveI) {
  for (let i = startRemoveI; i < endRemoveI; i++) {
    rowComponents[i].removeElement()
  }

  rowComponents.splice(startRemoveI, endRemoveI - startRemoveI)
}

function splitEventStores(eventStore: EventStore) {
  let { defs, instances } = eventStore
  let eventStoresByResourceId = {}

  for (let defId in defs) {
    let def = defs[defId]
    let resourceIds = extractEventResourceIds(def)

    if (!resourceIds.length) { // TODO: more DRY
      resourceIds = [ '' ]
    }

    for (let resourceId of resourceIds) {
      (eventStoresByResourceId[resourceId] ||
        (eventStoresByResourceId[resourceId] = createEmptyEventStore())
      ).defs[defId] = def
    }
  }

  for (let instanceId in instances) {
    let instance = instances[instanceId]
    let def = defs[instance.defId]
    let resourceIds = extractEventResourceIds(def)

    if (!resourceIds.length) { // TODO: more DRY
      resourceIds = [ '' ]
    }

    for (let resourceId of resourceIds) {
      eventStoresByResourceId[resourceId]
        .instances[instanceId] = instance
    }
  }

  return eventStoresByResourceId
}

function extractEventResourceIds(def: EventDef) {
  let resourceIds = def.extendedProps.resourceIds || [] /// put in real Def object?
  let resourceId = def.extendedProps.resourceId

  if (resourceId) {
    resourceIds.push(resourceId)
  }

  return resourceIds
}
