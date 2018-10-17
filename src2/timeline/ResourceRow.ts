import { Resource } from '../structs/resource'
import Row from './Row'

export interface ResourceRowProps {
  resource: Resource
  rowSpans: number[]
  hasChildren: boolean
  colSpecs: any
}

export default class ResourceRow extends Row {

  resource: Resource | null = null
  rowSpans: number[] = []
  hasChildren: boolean = false
  colSpecs: any

  render(state: ResourceRowProps) {
    if (
      this.resource !== state.resource ||
      this.rowSpans.join(',') !== state.rowSpans.join(',') ||
      this.hasChildren !== state.hasChildren ||
      this.colSpecs !== state.colSpecs
    ) {
      if (this.resource) {
        this.unrenderResource()
      }

      this.resource = state.resource
      this.rowSpans = state.rowSpans
      this.hasChildren = state.hasChildren
      this.colSpecs = state.colSpecs

      this.renderResource()
    }
  }

  renderResource() {
    this.spreadsheetTr.innerHTML = '<td><div>resource: ' + this.resource.title + '</div></td>'
    this.timeAxisTr.innerHTML = '<td><div>resource: ' + this.resource.title + '</div></td>'
  }

  unrenderResource() {
  }

}
