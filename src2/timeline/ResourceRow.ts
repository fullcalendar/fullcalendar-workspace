import { createElement } from 'fullcalendar'
import { Resource } from '../structs/resource'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'

export interface ResourceRowProps {
  resource: Resource
  resourceFields: any
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  colSpecs: any
  // TODO: businesshours, events, selection
}

export default class ResourceRow extends Row {

  timeAxisHeightEl: HTMLElement

  spreadsheetRow: SpreadsheetRow

  setParents(a, b, c, d) {
    super.setParents(a, b, c, d)

    this.spreadsheetRow = new SpreadsheetRow(this.view)
    this.spreadsheetRow.setTr(this.spreadsheetTr)
  }

  removeElements() {
    super.removeElements()

    // TODO: send to lane
  }

  render(props: ResourceRowProps) {
    this.spreadsheetRow.render(props)

    this.timeAxisTr.appendChild(
      createElement('td',
        { 'data-resource-id': props.resource.resourceId }, // TODO: use public ID?
        this.timeAxisHeightEl = document.createElement('div')
      )
    )
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.timeAxisHeightEl ]
  }

  updateSize(forceFlags) {
    // TODO: send to lane
  }

}
