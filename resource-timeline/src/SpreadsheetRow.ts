import { htmlToElement, htmlEscape, createElement, Component, renderer, ComponentContext, DomLocation } from '@fullcalendar/core'
import { Resource, ResourceApi, buildResourceFields, buildResourceTextFunc } from '@fullcalendar/resource-common'
import { updateExpanderEl, clearExpanderEl, updateTrResourceId } from './render-utils'

export interface SpreadsheetRowProps extends DomLocation {
  colSpecs: any
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
}

export default class SpreadsheetRow extends Component<SpreadsheetRowProps, ComponentContext> {

  private renderSkeleton = renderer(this._renderSkeleton)
  private updateExpanderEl = renderer(updateExpanderEl, clearExpanderEl)

  heightEl: HTMLElement
  isSizeDirty = false


  render(props: SpreadsheetRowProps) {
    let { rootEl, heightEl, expanderWrapEl, expanderIconEl } = this.renderSkeleton({
      colSpecs: props.colSpecs,
      rowSpans: props.rowSpans,
      depth: props.depth,
      resource: props.resource
    })

    this.updateExpanderEl({
      expanderWrapEl,
      expanderIconEl,
      isVisible: props.hasChildren,
      isExpanded: props.isExpanded
    })

    this.heightEl = heightEl
    this.isSizeDirty = true

    return rootEl
  }


  _renderSkeleton(
    { resource, rowSpans, depth, colSpecs }: { resource: Resource, rowSpans: number[], depth: number, colSpecs },
    context: ComponentContext
  ) {
    let { calendar, view, theme } = context
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack
    let tr = document.createElement('tr')
    let mainTd
    let heightEl: HTMLElement

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
          heightEl = createElement('div', null, td.childNodes) // inner wrap
        )
        mainTd = td
      }

      tr.appendChild(td)
    }

    updateTrResourceId(tr, resource.id) // TODO: only use public ID?

    let expanderIconEl = tr.querySelector('.fc-expander-space .fc-icon') as HTMLElement
    let expanderWrapEl = expanderIconEl.parentElement
    expanderWrapEl.addEventListener('click', this.onExpanderClick)

    // wait until very end
    calendar.publiclyTrigger('resourceRender', [
      {
        resource: new ResourceApi(calendar, resource),
        el: mainTd,
        view
      }
    ])

    return {
      rootEl: tr,
      heightEl,
      expanderWrapEl,
      expanderIconEl
    }
  }


  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.calendar.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded
      })
    }
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
