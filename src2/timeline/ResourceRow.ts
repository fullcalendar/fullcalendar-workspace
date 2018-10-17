import { removeElement } from 'fullcalendar'
import { Resource } from '../structs/resource'

export interface ResourceRowProps {
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
  timeAxisTr: HTMLElement

  // TODO: make DRY
  setParents(
    spreadsheetParent,
    spreadsheetNextSibling,
    timeAxisParent,
    timeAxisNextSibling
  ) {
    spreadsheetParent.insertBefore(
      this.spreadsheetTr = document.createElement('tr'),
      spreadsheetNextSibling
    )

    timeAxisParent.insertBefore(
      this.timeAxisTr = document.createElement('tr'),
      timeAxisNextSibling
    )
  }

  // TODO: make DRY
  removeElement() {
    removeElement(this.spreadsheetTr)
    removeElement(this.timeAxisTr)
  }

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

  updateSize(totalHeight, isAuto, forceFlags) {
  }

}
