import { Group } from './resource-hierarchy'
import Row from './Row'

export interface GroupRowProps {
  group: Group
}

export default class GroupRow extends Row {

  group: Group | null = null // TODO: move to props

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
