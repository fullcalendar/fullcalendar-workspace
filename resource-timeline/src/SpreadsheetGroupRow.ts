import { createElement, htmlToElement, htmlEscape, Component, renderer, ComponentContext, DomLocation } from '@fullcalendar/core'
import { Group, isGroupsEqual } from '@fullcalendar/resource-common'
import { updateExpanderEl, clearExpanderEl } from './render-utils'

export interface SpreadsheetGroupRowProps extends DomLocation {
  spreadsheetColCnt: number
  id: string // 'field:value'
  isExpanded: boolean
  group: Group
}

export default class SpreadsheetGroupRow extends Component<SpreadsheetGroupRowProps, ComponentContext> {

  private renderCells = renderer(this._renderCells)
  private updateExpanderEl = renderer(updateExpanderEl, clearExpanderEl)

  heightEl: HTMLElement
  isSizeDirty = false


  render(props: SpreadsheetGroupRowProps) {
    let { rootEl, expanderWrapEl, expanderIconEl, heightEl } = this.renderCells({
      group: props.group,
      spreadsheetColCnt: props.spreadsheetColCnt
    })

    this.updateExpanderEl({
      expanderWrapEl,
      expanderIconEl,
      isVisible: true,
      isExpanded: props.isExpanded
    })

    this.heightEl = heightEl
    this.isSizeDirty = true

    return rootEl
  }


  _renderCells({ group, spreadsheetColCnt }: { group: Group, spreadsheetColCnt: number } & DomLocation) {
    let spreadsheetContentEl = renderSpreadsheetContent(group)
    let tr = document.createElement('tr')
    let heightEl = createElement('div', null, spreadsheetContentEl)

    tr.appendChild(
      createElement('td',
        {
          className: 'fc-divider',
          colSpan: spreadsheetColCnt // span across all columns
        },
        heightEl
      )
    )

    let expanderIconEl = spreadsheetContentEl.querySelector('.fc-icon') as HTMLElement
    let expanderWrapEl = expanderIconEl.parentElement
    expanderWrapEl.addEventListener('click', this.onExpanderClick)

    return {
      rootEl: tr,
      expanderWrapEl,
      expanderIconEl,
      heightEl
    }
  }


  onExpanderClick = () => {
    let { props } = this

    this.context.calendar.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: props.id,
      isExpanded: !props.isExpanded
    })
  }

}

SpreadsheetGroupRow.addEqualityFuncs({
  props: {
    group: isGroupsEqual // HACK for ResourceTimelineView::renderRows
  }
})


/*
Renders the content wrapper element that will be inserted into this row's TD cell.
*/
function renderSpreadsheetContent(group: Group) {
  let text = renderCellText(group)
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


function renderCellText(group: Group) {
  let text = group.value || '' // might be null/undefined if an ad-hoc grouping
  let filter = group.spec.text

  if (typeof filter === 'function') {
    text = filter(text) || text
  }

  return text
}
