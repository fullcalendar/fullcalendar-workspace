import { View, createElement, DateComponentRenderState } from 'fullcalendar'
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

export default class ResourceRow extends Row<ResourceRowProps> {

  innerContainerEl: HTMLElement

  spreadsheetRow: SpreadsheetRow
  lane: TimelineLane

  constructor(view: View, a, b, c, d, timeAxis) {
    super(view, a, b, c, d)

    this.spreadsheetRow = new SpreadsheetRow(view, this.spreadsheetTr)

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

  destroy() {
    this.lane.removeElement()

    super.destroy()
  }

  render(props: ResourceRowProps) {

    // TODO: use public ID?
    this.timeAxisTr.setAttribute('data-resource-id', props.resource.resourceId)

    this.spreadsheetRow.receiveProps(props)
    this.lane.render(props, {}) // TODO: kill force flags
  }

  updateSize() {
    this.lane.updateSize(0, false, false) // TODO: kill these params
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

}
