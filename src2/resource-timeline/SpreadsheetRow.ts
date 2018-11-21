import { htmlToElement, htmlEscape, createElement, Component, ComponentContext } from 'fullcalendar'
import { Resource } from '../structs/resource'
import { updateExpanderIcon, clearExpanderIcon } from './render-utils'
import ResourceApi from '../api/ResourceApi'

export interface SpreadsheetRowProps {
  resource: Resource
  resourceFields: any
  rowSpans: number[] // for each cell
  depth: number
  colSpecs: any
  hasChildren: boolean
  isExpanded: boolean
}

export default class SpreadsheetRow extends Component<SpreadsheetRowProps> {

  tr: HTMLElement
  heightEl: HTMLElement
  expanderIconEl: HTMLElement // might not exist

  constructor(context: ComponentContext, tr: HTMLElement) {
    super(context)

    this.tr = tr
  }

  render(props: SpreadsheetRowProps) {
    let id = this.subrender('renderRow', [ props.resource, props.resourceFields, props.rowSpans, props.colSpecs, props.depth ], 'unrenderRow')
    this.subrender('updateExpanderIcon', [ props.hasChildren, props.isExpanded, id ])
  }

  renderRow(resource: Resource, resourceFields, rowSpans: number[], colSpecs, depth: number) {
    let { tr, theme, calendar } = this

    tr.setAttribute('data-resource-id', resource.id) // TODO: only use public ID?

    for (let i = 0; i < colSpecs.length; i++) {
      let colSpec = colSpecs[i]
      let rowSpan = rowSpans[i]

      if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
        continue
      } else if (rowSpan == null) {
        rowSpan = 1
      }

      let input = // the source text, and the main argument for the filter functions
        colSpec.field ?
          resourceFields[colSpec.field] || null :
          resource

      let text =
        typeof colSpec.text === 'function' ?
          colSpec.text(
            new ResourceApi(calendar, resource),
            input
          ) :
          (typeof input === 'object' ? resource.title : input) // TODO: getResourceTextFunc (which is a util for ALL resource views)

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
          contentEl,
          input
        ) || contentEl
      }

      const td = createElement('td', {
        className: theme.getClass('widgetContent'),
        rowspan: rowSpan
      }, contentEl)

      // the first cell of the row needs to have an inner div for setTrInnerHeight
      if (colSpec.isMain) {
        td.appendChild(
          this.heightEl = createElement('div', null, td.childNodes) // inner wrap
        )
      }

      tr.appendChild(td)
    }

    this.expanderIconEl = tr.querySelector('.fc-expander-space .fc-icon')
  }

  unrenderRow() {
    this.tr.innerHTML = ''
  }

  updateExpanderIcon(hasChildren: boolean, isExpanded: boolean) {
    let { expanderIconEl } = this
    let expanderEl = expanderIconEl.parentElement

    if (expanderIconEl) {

      if (hasChildren) {
        expanderEl.addEventListener('click', this.onExpanderClick)
        expanderEl.classList.add('fc-expander')

        updateExpanderIcon(expanderIconEl, isExpanded, this.isRtl)
      } else {
        expanderEl.removeEventListener('click', this.onExpanderClick)
        expanderEl.classList.remove('fc-expander')

        clearExpanderIcon(expanderIconEl)
      }
    }
  }

  onExpanderClick = (ev: UIEvent) => {
    alert('expand ' + this.props.resource.title)
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
