import { DateComponentRenderState, RenderForceFlags, assignTo, parseFieldSpecs, createElement } from 'fullcalendar'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import TimelineLane from './TimelineLane'
import ClippedScroller from '../util/ClippedScroller'
import ScrollerCanvas from '../util/ScrollerCanvas'
import ScrollJoiner from '../util/ScrollJoiner'
import AbstractTimelineView from './AbstractTimelineView'
import { ResourceHash } from '../structs/resource'
import { buildRows, isNodesEqual, GroupNode, ResourceNode } from './resource-hierarchy'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'

const LOOKAHEAD = 3

export default class TimelineView extends AbstractTimelineView {

  tDateProfile: TimelineDateProfile

  timeHeadEl: HTMLElement
  timeBodyEl: HTMLElement
  spreadsheetHeadEl: HTMLElement
  spreadsheetBodyEl: HTMLElement
  spreadsheetTbody: HTMLElement // INSIDE the spreadsheetBodyEl
  timeTbody: HTMLElement // INSIDE the timeBodyEl

  headScroller: ClippedScroller
  bodyScroller: ClippedScroller
  scrollJoiner: ScrollJoiner

  spreadsheetHeadScroller: ClippedScroller
  spreadsheetBodyScroller: ClippedScroller
  splitpaneScrollJoiner: ScrollJoiner

  header: TimelineHeader
  slats: TimelineSlats
  lane: TimelineLane

  rowNodes: (GroupNode | ResourceNode)[] = []
  rowComponents: (GroupRow | ResourceRow)[] = []

  // resource rendering options
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any

  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.processResourceOptions()

    this.addChild(
      this.header = new TimelineHeader(this.view)
    )
    this.addChild(
      this.slats = new TimelineSlats(this.view)
    )
    this.addChild(
      this.lane = new TimelineLane(this.view)
    )
  }

  processResourceOptions() {
    const allColSpecs = this.opt('resourceColumns') || []
    const labelText = this.opt('resourceLabelText') // TODO: view.override
    const defaultLabelText = 'Resources' // TODO: view.defaults
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

    if (this.opt('eventOverlap') === false) {
      this.el.classList.add('fc-no-overlap')
    }

    this.el.innerHTML = this.renderSkeletonHtml()
    this.timeHeadEl = this.el.querySelector('thead .fc-time-area')
    this.timeBodyEl = this.el.querySelector('tbody .fc-time-area')
    this.spreadsheetHeadEl = this.el.querySelector('thead .fc-resource-area')
    this.spreadsheetBodyEl = this.el.querySelector('tbody .fc-resource-area')

    this.headScroller = new ClippedScroller('clipped-scroll', 'hidden')
    this.headScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.headScroller.render()

    this.bodyScroller = new ClippedScroller('auto', 'auto')
    this.bodyScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.bodyScroller.render()

    this.scrollJoiner = new ScrollJoiner('horizontal', [
      this.headScroller.enhancedScroll,
      this.bodyScroller.enhancedScroll
    ])

    this.timeHeadEl.appendChild(this.headScroller.el)
    this.timeBodyEl.appendChild(this.bodyScroller.el)

    this.header.setElement(this.headScroller.enhancedScroll.canvas.contentEl) // TODO: give own root el
    this.bodyScroller.enhancedScroll.canvas.bgEl.appendChild(this.slats.el)

    this.spreadsheetHeadScroller = new ClippedScroller('clipped-scroll', 'hidden')
    this.spreadsheetHeadScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.spreadsheetHeadScroller.render()

    this.spreadsheetBodyScroller = new ClippedScroller('auto', 'clipped-scroll')
    this.spreadsheetBodyScroller.enhancedScroll.canvas = new ScrollerCanvas()
    this.spreadsheetBodyScroller.render()

    this.spreadsheetHeadEl.appendChild(this.spreadsheetHeadScroller.el)
    this.spreadsheetBodyEl.appendChild(this.spreadsheetBodyScroller.el)

    let spreadsheetContainerEl = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.spreadsheetTbody = spreadsheetContainerEl.querySelector('tbody')
    this.spreadsheetBodyScroller.enhancedScroll.canvas.contentEl.appendChild(spreadsheetContainerEl)

    let timeContainerEl = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.timeTbody = timeContainerEl.querySelector('tbody')
    this.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(timeContainerEl)

    this.splitpaneScrollJoiner = new ScrollJoiner('vertical', [
      this.spreadsheetHeadScroller.enhancedScroll,
      this.spreadsheetBodyScroller.enhancedScroll
    ])

    // hack. puts the lane's fills within the fc-bg of the view
    this.lane.fillRenderer.masterContainerEl = this.bodyScroller.enhancedScroll.canvas.bgEl
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

  renderResources(resourceStore: ResourceHash) { // best way to invoke this? do it thru render()?
    let { rowComponents } = this
    let oldRows = this.rowNodes
    let newRows = buildRows(
      resourceStore,
      this.groupSpecs,
      this.orderSpecs,
      this.isVGrouping
    )
    let oldI = 0
    let newI = 0

    for (newI = 0; newI < newRows.length; newI++) {
      let newRow = newRows[newI]
      let oldRowFound = false

      if (oldI < oldRows.length) {
        let oldRow = oldRows[oldI]

        if (!isNodesEqual(oldRow, newRow)) {

          for (let oldLookaheadI = oldI; oldLookaheadI < oldI + LOOKAHEAD; oldLookaheadI++) {
            let oldLookaheadRow = oldRows[oldLookaheadI]

            if (isNodesEqual(oldLookaheadRow, newRow)) {
              removeChildren(rowComponents, oldI, oldLookaheadI)
              oldI = oldLookaheadI
              oldRowFound = true
              break
            }
          }
        }
      }

      if (!oldRowFound) {
        addChild(rowComponents, newI, newRow)
      }
    }

    this.rowNodes = newRows
  }

  renderChildren(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    let dateEnv = this.getDateEnv()

    let tDateProfile = this.tDateProfile =
      buildTimelineDateProfile(renderState.dateProfile, dateEnv, this) // TODO: cache

    let timelineRenderState = assignTo({}, renderState, {
      tDateProfile
    })

    this.header.render(timelineRenderState, forceFlags)
    this.slats.render(timelineRenderState, forceFlags)
    this.lane.render(timelineRenderState, forceFlags)

    let { rowNodes, rowComponents } = this

    for (let i = 0; i < rowNodes.length; i++) {
      let rowNode = rowNodes[i]
      let rowComponent = rowComponents[i]

      if (!rowComponent.spreadsheetTr) {
        rowComponent.spreadsheetTr = document.createElement('tr')
        rowComponent.timeTr = document.createElement('tr')

        this.spreadsheetTbody.insertBefore(
          rowComponent.spreadsheetTr,
          i + 1 < rowNodes.length ? (rowComponents[i + 1].spreadsheetTr || null) : null
        )

        this.timeTbody.insertBefore(
          rowComponent.timeTr,
          i + 1 < rowNodes.length ? (rowComponents[i + 1].timeTr || null) : null
        )
      }

      if ((rowNode as GroupNode).group) {
        (rowComponent as GroupRow).render({
          group: (rowNode as GroupNode).group
        })
      } else {
        (rowComponent as ResourceRow).render({
          resource: (rowNode as ResourceNode).resource,
          rowSpans: (rowNode as ResourceNode).rowSpans,
          hasChildren: (rowNode as ResourceNode).hasChildren,
          colSpecs: this.colSpecs
        })
      }
    }
  }

  updateSize(totalHeight, isAuto, force) {
    let bodyHeight

    if (isAuto) {
      bodyHeight = 'auto'
    } else {
      bodyHeight = totalHeight - this.queryHeadHeight() - this.queryMiscHeight()
    }

    this.bodyScroller.setHeight(bodyHeight)
    this.spreadsheetBodyScroller.setHeight(bodyHeight)

    this.updateWidths()

    this.header.updateSize(totalHeight, isAuto, force)
    this.slats.updateSize(totalHeight, isAuto, force)
    this.lane.updateSize(totalHeight, isAuto, force)

    this.headScroller.updateSize()
    this.bodyScroller.updateSize()
    this.scrollJoiner.update()
  }

  queryHeadHeight() {
    // TODO: cache <table>
    let table = this.headScroller.enhancedScroll.canvas.contentEl.querySelector('table')
    return table ? table.offsetHeight : 0 // why the check?
  }

  queryMiscHeight() {
    return this.el.offsetHeight -
      this.headScroller.el.offsetHeight -
      this.bodyScroller.el.offsetHeight
  }

}

function removeChildren(components, startRemoveI, endRemoveI) {
  for (let i = startRemoveI; i < endRemoveI; i++) {
    components[i].removeElement()
  }

  components.splice(startRemoveI, endRemoveI - startRemoveI)
}

function addChild(components, addIndex, node: (GroupNode | ResourceNode)) {
  components.splice(addIndex, 0, buildChildComponent(node))
}

function buildChildComponent(node: (GroupNode | ResourceNode)) {
  if ((node as GroupNode).group) {
    return new GroupRow()
  } else if ((node as ResourceNode).resource) {
    return new ResourceRow()
  }
}
