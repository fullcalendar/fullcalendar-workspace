import { htmlToElement, htmlEscape, createElement, Component, memoizeRendering } from '@fullcalendar/core'
import { Resource, ResourceApi, buildResourceFields, buildResourceTextFunc } from '@fullcalendar/resource-common'
import { updateExpanderIcon, clearExpanderIcon, updateTrResourceId } from './render-utils'

export interface SpreadsheetRowProps {
  colSpecs: any
  id: string // 'resourceId' (won't collide with group ID's because has colon)
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
}

export default class SpreadsheetRow extends Component<SpreadsheetRowProps> {

  tr: HTMLElement
  heightEl: HTMLElement
  expanderIconEl: HTMLElement // might not exist

  private _renderRow = memoizeRendering(this.renderRow, this.unrenderRow)
  private _updateTrResourceId = memoizeRendering(updateTrResourceId, null, [ this._renderRow ])
  private _updateExpanderIcon = memoizeRendering(this.updateExpanderIcon, null, [ this._renderRow ])

  constructor(tr: HTMLElement) {
    super()

    this.tr = tr
  }

  render(props: SpreadsheetRowProps) {
    this._renderRow(props.resource, props.rowSpans, props.depth, props.colSpecs)
    this._updateTrResourceId(this.tr, props.resource.id) // TODO: only use public ID?
    this._updateExpanderIcon(props.hasChildren, props.isExpanded)
  }

  destroy() {
    super.destroy()

    this._renderRow.unrender() // should unrender everything else
  }

  renderRow(resource: Resource, rowSpans: number[], depth: number, colSpecs) {
    let { calendar, view, theme } = this.context
    let { tr } = this
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack
    let mainTd

    for (let i = 0; i < colSpecs.length; i++) {
      let colSpec = colSpecs[i]
      let rowSpan = rowSpans[i]

      if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
        continue
      } else if (rowSpan == null) {
        rowSpan = 1
      }

      let text

      if (colSpec.field) {
        text = resourceFields[colSpec.field]
      } else {
        text = buildResourceTextFunc(colSpec.text, calendar)(resource)
      }

      let contentEl = htmlToElement(
        '<div class="fc-cell-content">' +
          (colSpec.isMain ? renderIconHtml(depth) : '') +
          '<span class="fc-cell-text">' +
            (text ? htmlEscape(text) : '&nbsp;') +
          '</span>' +
        '</div>'
      )

      if (typeof colSpec.render === 'function') { // a filter function for the element
        contentEl = colSpec.render(
          new ResourceApi(calendar, resource),
          contentEl
        ) || contentEl
      }

      if (rowSpan > 1) {
        contentEl.classList.add('fc-sticky')
      }

      let td = createElement('td', {
        className: theme.getClass('widgetContent'),
        rowspan: rowSpan
      }, contentEl)

      // the first cell of the row needs to have an inner div for setTrInnerHeight
      if (colSpec.isMain) {
        td.appendChild(
          this.heightEl = createElement('div', null, td.childNodes) // inner wrap
        )
        mainTd = td
      }

      tr.appendChild(td)
    }

    this.expanderIconEl = tr.querySelector('.fc-expander-space .fc-icon')

    // wait until very end
    calendar.publiclyTrigger('resourceRender', [
      {
        resource: new ResourceApi(calendar, resource),
        el: mainTd,
        view
      }
    ])
  }

  unrenderRow() {
    this.tr.innerHTML = ''
  }

  updateExpanderIcon(hasChildren: boolean, isExpanded: boolean) {
    let { expanderIconEl } = this
    let expanderEl = expanderIconEl.parentElement

    if (
      expanderIconEl &&
      expanderEl // why would this be null?? was the case in IE11
    ) {

      if (hasChildren) {
        expanderEl.addEventListener('click', this.onExpanderClick)
        expanderEl.classList.add('fc-expander')

        updateExpanderIcon(expanderIconEl, isExpanded)
      } else {
        expanderEl.removeEventListener('click', this.onExpanderClick)
        expanderEl.classList.remove('fc-expander')

        clearExpanderIcon(expanderIconEl)
      }
    }
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


/*
Renders the HTML responsible for the subrow expander area,
as well as the space before it (used to align expanders of similar depths)
*/
function renderIconHtml(depth) {
  let html = ''

  for (let i = 0; i < depth; i++) {
    html += '<span class="fc-icon"></span>'
  }

  html +=
    '<span class="fc-expander-space">' +
      '<span class="fc-icon"></span>' +
    '</span>'

  return html
}
