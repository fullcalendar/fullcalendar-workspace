import { Resource } from '../structs/resource'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'

export interface ResourceRowProps {
  resource: Resource
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  colSpecs: any
  // TODO: businesshours, events, selection
}

export default class ResourceRow extends Row {

  spreadsheetRow: SpreadsheetRow

  setParents(a, b, c, d) {
    super.setParents(a, b, c, d)

    this.spreadsheetRow = new SpreadsheetRow(this.view)
    this.spreadsheetRow.setTr(this.spreadsheetTr)
  }

  render(props: ResourceRowProps) {
    this.spreadsheetRow.render(props)

    this.timeAxisTr.innerHTML = '<td><div>resource: ' + props.resource.title + '</div></td>'
  }

}
