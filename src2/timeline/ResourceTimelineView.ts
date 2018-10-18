import { View, createElement, parseFieldSpecs } from 'fullcalendar'
import TimeAxis from './TimeAxis'
import { ResourceHash } from '../structs/resource'
import { buildRowNodes, isNodesEqual, GroupNode, ResourceNode } from './resource-hierarchy'
import GroupRow from './GroupRow'
import ResourceRow from './ResourceRow'
import ScrollJoiner from '../util/ScrollJoiner'
import Spreadsheet from './Spreadsheet'

const LOOKAHEAD = 3

export default class ResourceTimelineView extends View {

  // child components
  spreadsheet: Spreadsheet
  timeAxis: TimeAxis
  bodyScrollJoiner: ScrollJoiner
  // TODO: lane for background events

  timeAxisTbody: HTMLElement

  // internal state
  superHeaderText: any
  isVGrouping: any
  isHGrouping: any
  groupSpecs: any
  colSpecs: any
  orderSpecs: any
  miscHeight: number
  rowNodes: (GroupNode | ResourceNode)[] = []
  rowComponents: (GroupRow | ResourceRow)[] = []

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

    this.spreadsheet = new Spreadsheet(this)
    this.spreadsheet.setParents(
      this.el.querySelector('thead .fc-resource-area'),
      this.el.querySelector('tbody .fc-resource-area')
    )

    this.timeAxis = new TimeAxis(this)
    this.timeAxis.setParents(
      this.el.querySelector('thead .fc-time-area'),
      this.el.querySelector('tbody .fc-time-area')
    )

    let timeAxisRowContainer = createElement('div', { className: 'fc-rows' }, '<table><tbody /></table>')
    this.timeAxis.layout.bodyScroller.enhancedScroll.canvas.contentEl.appendChild(timeAxisRowContainer)
    this.timeAxisTbody = timeAxisRowContainer.querySelector('tbody')

    this.bodyScrollJoiner = new ScrollJoiner('vertical', [
      this.spreadsheet.layout.bodyScroller,
      this.timeAxis.layout.bodyScroller
    ])

    this.spreadsheet.render({
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

  renderChildren(props, forceFlags) {
    this.timeAxis.render({
      dateProfile: props.dateProfile
    }, forceFlags)

    this.receiveResourceData(props.resourceStore)
    this.renderRows()
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
    let newComponent = buildChildComponent(rowNode, this)

    newComponent.setParents(
      this.spreadsheet.bodyTbody,
      nextComponent ? nextComponent.spreadsheetTr : null,
      this.timeAxisTbody,
      nextComponent ? nextComponent.timeAxisTr : null
    )

    rowComponents.splice(index, 0, newComponent)
  }

  renderRows() {
    let { rowNodes, rowComponents } = this

    for (let i = 0; i < rowNodes.length; i++) {
      let rowNode = rowNodes[i]
      let rowComponent = rowComponents[i]

      if ((rowNode as GroupNode).group) {
        (rowComponent as GroupRow).render({
          group: (rowNode as GroupNode).group,
          spreadsheetColCnt: this.colSpecs.length
        })
      } else {
        (rowComponent as ResourceRow).render({
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

  updateSize(totalHeight, isAuto, forceFlags) {
    this.syncHeadHeights()
    this.syncRowHeights()

    this.timeAxis.updateSize(totalHeight - this.miscHeight, isAuto)
    this.spreadsheet.updateSize(totalHeight - this.miscHeight, isAuto)

    for (let rowComponent of this.rowComponents) {
      rowComponent.updateSize(forceFlags)
    }

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
      rowComponent.removeElement()
    }

    this.rowNodes = []
    this.rowComponents = []

    this.spreadsheet.removeElements()
    this.timeAxis.removeElements()

    super.removeElement()
  }

}

function buildChildComponent(node: (GroupNode | ResourceNode), view) {
  if ((node as GroupNode).group) {
    return new GroupRow(view)
  } else if ((node as ResourceNode).resource) {
    return new ResourceRow(view)
  }
}

function removeRows(rowComponents, startRemoveI, endRemoveI) {
  for (let i = startRemoveI; i < endRemoveI; i++) {
    rowComponents[i].removeElement()
  }

  rowComponents.splice(startRemoveI, endRemoveI - startRemoveI)
}
