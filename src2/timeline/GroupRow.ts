import { removeElement } from 'fullcalendar'
import { Group } from './resource-hierarchy'

export interface GroupRowProps {
  group: Group
}

export default class GroupRow {

  group: Group | null = null // TODO: move to props

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

  /*
  TODO: render data-resource-id
  */
  render(state: GroupRowProps) {
    if (this.group !== state.group) {
      if (!this.group) {
        this.unrenderGroup()
      }
      this.group = state.group
      this.renderGroup(state.group)
    }
  }

  renderGroup(group) {
    this.spreadsheetTr.innerHTML = '<td><div>group: ' + group.value + '</div></td>'
    this.timeAxisTr.innerHTML = '<td><div>group: ' + group.value + '</div></td>'
  }

  unrenderGroup() {

  }

}
