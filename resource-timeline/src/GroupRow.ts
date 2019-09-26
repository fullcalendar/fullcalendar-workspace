import { createElement, htmlToElement, htmlEscape, memoizeRendering } from '@fullcalendar/core'
import { Group, isGroupsEqual } from '@fullcalendar/resource-common'
import Row from './Row'
import { updateExpanderIcon } from './render-utils'

export interface GroupRowProps {
  spreadsheetColCnt: number
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
}

export default class GroupRow extends Row<GroupRowProps> {

  spreadsheetHeightEl: HTMLElement
  timeAxisHeightEl: HTMLElement
  expanderIconEl: HTMLElement

  private _renderCells = memoizeRendering(this.renderCells, this.unrenderCells)
  private _updateExpanderIcon = memoizeRendering(this.updateExpanderIcon, null, [ this._renderCells ])

  render(props: GroupRowProps) {
    this._renderCells(props.group, props.spreadsheetColCnt)
    this._updateExpanderIcon(props.isExpanded)
    this.isSizeDirty = true
  }

  destroy() {
    super.destroy()

    this._renderCells.unrender() // should unrender everything else
  }

  renderCells(group: Group, spreadsheetColCnt: number) {
    let spreadsheetContentEl = this.renderSpreadsheetContent(group)

    this.spreadsheetTr.appendChild(
      createElement('td',
        {
          className: 'fc-divider',
          colSpan: spreadsheetColCnt // span across all columns
        },
        this.spreadsheetHeightEl = createElement('div', null, spreadsheetContentEl)
      ) // needed by setTrInnerHeight
    )

    this.expanderIconEl = spreadsheetContentEl.querySelector('.fc-icon')
    this.expanderIconEl.parentElement.addEventListener('click', this.onExpanderClick)

    // insert a single cell, with a single empty <div>.
    // there will be no content
    this.timeAxisTr.appendChild(
      createElement('td', { className: 'fc-divider' },
        this.timeAxisHeightEl = document.createElement('div')
      )
    )
  }

  unrenderCells() {
    this.spreadsheetTr.innerHTML = ''
    this.timeAxisTr.innerHTML = ''
  }

  /*
  Renders the content wrapper element that will be inserted into this row's TD cell.
  */
  renderSpreadsheetContent(group: Group) {
    let text = this.renderCellText(group)
    let contentEl = htmlToElement(
      '<div class="fc-cell-content">' +
        '<span class="fc-expander">' +
          '<span class="fc-icon"></span>' +
        '</span>' +
        '<span class="fc-cell-text">' +
           (text ? htmlEscape(text) : '&nbsp;') +
        '</span>' +
      '</div>'
    )

    let filter = group.spec.render

    if (typeof filter === 'function') {
      contentEl = filter(contentEl, group.value) || contentEl
    }

    return contentEl
  }

  renderCellText(group: Group) {
    let text = group.value || '' // might be null/undefined if an ad-hoc grouping
    let filter = group.spec.text

    if (typeof filter === 'function') {
      text = filter(text) || text
    }

    return text
  }

  getHeightEls() {
    return [ this.spreadsheetHeightEl, this.timeAxisHeightEl ]
  }

  updateExpanderIcon(isExpanded: boolean) {
    updateExpanderIcon(this.expanderIconEl, isExpanded)
  }

  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    this.context.calendar.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: props.id,
      isExpanded: !props.isExpanded
    })
  }

}

GroupRow.addEqualityFuncs({
  group: isGroupsEqual // HACK for ResourceTimelineView::renderRows
})
