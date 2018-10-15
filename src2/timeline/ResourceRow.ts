import { Resource } from '../structs/resource'

export interface ResourceRowRenderState {
  resource: Resource
  rowSpans: number[]
  hasChildren: boolean
  colSpecs: any
}

export default class ResourceRow {

  resource: Resource | null = null
  rowSpans: number[] = []
  hasChildren: boolean = false
  colSpecs: any

  spreadsheetTr: HTMLElement
  timeTr: HTMLElement

  render(state: ResourceRowRenderState) {
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
    this.timeTr.innerHTML = '<td><div>resource: ' + this.resource.title + '</div></td>'
  }

  unrenderResource() {
  }

}
