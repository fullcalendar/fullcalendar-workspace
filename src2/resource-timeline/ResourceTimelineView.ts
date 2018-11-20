import { View, ViewSpec, ViewProps, createElement, parseFieldSpecs, createEmptyEventStore, EventStore, ComponentContext, DateProfileGenerator, reselector, assignTo } from 'fullcalendar'
import TimeAxis from '../timeline/TimeAxis'
import { ResourceHash } from '../structs/resource'
import { buildRowNodes, GroupNode, ResourceNode } from '../common/resource-hierarchy'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'
import ScrollJoiner from '../util/ScrollJoiner'
import Spreadsheet from './Spreadsheet'
import TimelineLane from '../timeline/TimelineLane'
import { extractEventResourceIds } from '../common/resource-aware-slicing'

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
  rowComponentsById: { [id: string]: (GroupRow | ResourceRow) } = {}

  // internal state
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  private hasResourceBusinessHours = reselector(hasResourceBusinessHours)
  private splitEventStores = reselector(splitEventStores)
  private buildRowNodes = reselector(buildRowNodes)

  constructor(context: ComponentContext, viewSpec: ViewSpec, dateProfileGenerator: DateProfileGenerator, parentEl: HTMLElement) {
    super(context, viewSpec, dateProfileGenerator, parentEl)

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

    // START RENDERING...

    this.el.classList.add('fc-timeline')
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

  render(props: ViewProps) {
    super.render(props)

    let resourceStore = (props as any).resourceStore

    let hasResourceBusinessHours = this.hasResourceBusinessHours(resourceStore)
    let eventStoresByResourceId = this.splitEventStores(props.eventStore)

    this.timeAxis.receiveProps({
      dateProfile: props.dateProfile
    })

    this.lane.receiveProps({
      dateProfile: props.dateProfile,
      businessHours: hasResourceBusinessHours ? null : props.businessHours,
      eventStore: eventStoresByResourceId[''] || null,
      eventUis: props.eventUis,
      dateSelection: (props.dateSelection && !props.dateSelection.resourceId) ? props.dateSelection : null,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize
    })

    let newRowNodes = this.buildRowNodes(
      resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping
    )

    this.diffRow(newRowNodes)
    this.renderRows(
      props,
      hasResourceBusinessHours ? props.businessHours : null, // CONFUSING, comment
      eventStoresByResourceId
    )
  }

  diffRow(newRowNodes) {
    let oldRowNodes = this.rowNodes
    let finalNodes = [] // same as newRowNodes, but with old nodes if equal to the new
    let oldI = 0
    let newI = 0

    for (newI = 0; newI < newRowNodes.length; newI++) {
      let newRow = newRowNodes[newI]
      let oldRowFound = false

      if (oldI < oldRowNodes.length) {
        let oldRow = oldRowNodes[oldI]

        if (oldRow.id === newRow.id) {
          finalNodes.push(oldRow)
          oldRowFound = true
          oldI++
        } else {

          for (let oldLookaheadI = oldI; oldLookaheadI < oldI + LOOKAHEAD; oldLookaheadI++) {
            let oldLookaheadRow = oldRowNodes[oldLookaheadI]

            if (oldLookaheadRow.id === newRow.id) {
              this.removeRows(oldI, oldLookaheadI, oldRowNodes)
              oldI = oldLookaheadI
              oldRowFound = true
              break
            }
          }
        }
      }

      if (!oldRowFound) {
        this.addRow(newI, newRow)
        finalNodes.push(newRow)
      }
    }

    this.rowNodes = finalNodes
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

  removeRows(startRemoveI, endRemoveI, oldRowNodes) {
    let { rowComponents, rowComponentsById } = this

    for (let i = startRemoveI; i < endRemoveI; i++) {
      let rowComponent = rowComponents[i]

      rowComponent.destroy()

      delete rowComponentsById[oldRowNodes[i].id]
    }

    rowComponents.splice(startRemoveI, endRemoveI - startRemoveI)
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

  renderRows(viewProps: ViewProps, fallbackBusinessHours, eventStoresByResourceId) {
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
        let resource = (rowNode as ResourceNode).resource
        let resourceId = (rowNode as ResourceNode).resource.resourceId
        let resourcePublicId = (rowNode as ResourceNode).resource.publicId;

        (rowComponent as ResourceRow).receiveProps({
          dateProfile: viewProps.dateProfile,
          businessHours: resource.businessHours || fallbackBusinessHours,
          eventStore: (resourcePublicId && eventStoresByResourceId[resourcePublicId]) || null,
          eventUis: viewProps.eventUis,
          dateSelection: (viewProps.dateSelection && viewProps.dateSelection.resourceId === resourceId) ? viewProps.dateSelection : null,
          eventSelection: viewProps.eventSelection,
          eventDrag: viewProps.eventDrag,
          eventResize: viewProps.eventResize,
          resource,
          resourceFields: (rowNode as ResourceNode).resourceFields,
          rowSpans: (rowNode as ResourceNode).rowSpans,
          depth: (rowNode as ResourceNode).depth,
          hasChildren: (rowNode as ResourceNode).hasChildren,
          colSpecs: this.colSpecs
        })
      }
    }
  }

  updateSize(viewHeight, isAuto, isResize) {
    // FYI: this ordering is really important

    this.syncHeadHeights()

    this.timeAxis.updateSize(viewHeight - this.miscHeight, isAuto, isResize)
    this.spreadsheet.updateSize(viewHeight - this.miscHeight, isAuto, isResize)

    for (let rowComponent of this.rowComponents) {
      rowComponent.updateSize(viewHeight, isAuto, isResize)
    }

    this.syncRowHeights()
    this.lane.updateSize(viewHeight, isAuto, isResize)
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


  // Scrolling
  // ------------------------------------------------------------------------------------------------------------------
  // this is useful for scrolling prev/next dates while resource is scrolled down

  queryScroll() {
    let scroll = super.queryScroll()

    if ((this.props as any).resourceStore) {
      assignTo(scroll, this.queryResourceScroll())
    }

    return scroll
  }

  applyScroll(scroll) {
    super.applyScroll(scroll)

    if ((this.props as any).resourceStore) {
      this.applyResourceScroll(scroll)
    }
  }

  computeInitialDateScroll() {
    return this.timeAxis.computeInitialDateScroll()
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
    if (scroll.rowId) {
      let rowComponent = this.rowComponentsById[scroll.rowId]

      if (rowComponent) {
        let el = rowComponent.timeAxisTr

        if (el) {
          let innerTop = this.timeAxis.layout.bodyScroller.el.getBoundingClientRect().top // TODO: use -scrollHeight or something
          let elBottom = el.getBoundingClientRect().bottom
          let scrollTop = elBottom - scroll.bottom - innerTop // both fixed positions

          this.timeAxis.layout.bodyScroller.enhancedScroll.setScrollTop(scrollTop)
          this.spreadsheet.layout.bodyScroller.enhancedScroll.setScrollTop(scrollTop)
        }
      }
    }
  }

  // TODO: scrollToResource

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

function hasResourceBusinessHours(resourceStore: ResourceHash) {
  for (let resourceId in resourceStore) {
    let resource = resourceStore[resourceId]

    if (resource.businessHours) {
      return true
    }
  }

  return false
}
