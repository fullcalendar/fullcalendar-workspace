import { Group } from './resource-hierarchy'

export interface GroupRowRenderState {
  group: Group
}

export default class GroupRow {

  group: Group | null = null

  spreadsheetTr: HTMLElement
  timeTr: HTMLElement

  render(state: GroupRowRenderState) {
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
    this.timeTr.innerHTML = '<td><div>group: ' + group.value + '</div></td>'
  }

  unrenderGroup() {

  }

}
