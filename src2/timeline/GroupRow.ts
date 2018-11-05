import { prependToElement, createElement } from 'fullcalendar'
import { Group } from './resource-hierarchy'
import Row from './Row'

export interface GroupRowProps {
  group: Group
  spreadsheetColCnt: number
}

export default class GroupRow extends Row<GroupRowProps> {

  spreadsheetHeightEl: HTMLElement
  timeAxisHeightEl: HTMLElement

  render(props: GroupRowProps) {
    const contentEl = this.renderGroupContentEl(props.group)

    // add an expander icon. binding handlers and updating are done by RowParent
    prependToElement(
      contentEl,
      '<span class="fc-expander">' +
        '<span class="fc-icon"></span>' +
      '</span>'
    )

    this.spreadsheetTr.appendChild(
      createElement('td',
        {
          className: 'fc-divider',
          colSpan: props.spreadsheetColCnt // span across all columns
        },
        this.spreadsheetHeightEl = createElement('div', null, contentEl)
      ) // needed by setTrInnerHeight
    )

    // insert a single cell, with a single empty <div>.
    // there will be no content
    this.timeAxisTr.appendChild(
      createElement('td', { className: 'fc-divider' },
        this.timeAxisHeightEl = document.createElement('div')
      )
    )
  }

  unrender() {
    this.spreadsheetTr.innerHTML = ''
    this.timeAxisTr.innerHTML = ''
  }

  /*
  Renders the content wrapper element that will be inserted into this row's TD cell
  */
  renderGroupContentEl(group: Group) {
    let contentEl = createElement('div', { className: 'fc-cell-content' }, this.renderGroupTextEl(group))
    let filter = group.spec.render

    if (typeof filter === 'function') {
      contentEl = filter(contentEl, group.value) || contentEl
    }

    return contentEl
  }

  /*
  Renders the text span element that will be inserted into this row's TD cell.
  Goes within the content element.
  */
  renderGroupTextEl(group: Group) {
    let text = group.value || '' // might be null/undefined if an ad-hoc grouping
    let filter = group.spec.text

    if (typeof filter === 'function') {
      text = filter(text) || text
    }

    let el = createElement('span', { className: 'fc-cell-text' })
    el.innerText = text
    return el
  }

  getHeightEls() {
    return [ this.spreadsheetHeightEl, this.timeAxisHeightEl ]
  }

}
