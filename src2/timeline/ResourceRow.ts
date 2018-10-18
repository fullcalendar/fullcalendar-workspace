import { createElement, DateComponentRenderState } from 'fullcalendar'
import { Resource } from '../structs/resource'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import TimelineLane from './TimelineLane'

export interface ResourceRowProps extends DateComponentRenderState {
  resource: Resource
  resourceFields: any
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  colSpecs: any
}

export default class ResourceRow extends Row {

  innerContainerEl: HTMLElement

  spreadsheetRow: SpreadsheetRow
  lane: TimelineLane

  setParents(a, b, c, d, timeAxis) {
    super.setParents(a, b, c, d, timeAxis)

    this.spreadsheetRow = new SpreadsheetRow(this.view)
    this.spreadsheetRow.setTr(this.spreadsheetTr)

    this.timeAxisTr.appendChild(
      createElement('td', null,
        this.innerContainerEl = document.createElement('div')
      )
    )

    this.lane = new TimelineLane(this.view)
    this.lane.setParents(
      this.innerContainerEl,
      this.innerContainerEl,
      timeAxis
    )
  }

  removeElements() {
    this.lane.removeElement()

    super.removeElements()
  }

  render(props: ResourceRowProps, forceFlags) {

    // TODO: use public ID?
    this.timeAxisTr.setAttribute('data-resource-id', props.resource.resourceId)

    this.spreadsheetRow.render(props)
    this.lane.render(props, forceFlags)
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

  updateSize(totalHeight, isAuto, force) {
    this.lane.updateSize(totalHeight, isAuto, force)
  }

}
