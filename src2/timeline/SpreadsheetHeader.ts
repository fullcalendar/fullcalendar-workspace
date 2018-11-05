import { removeElement, createElement, htmlEscape, Component, ComponentContext } from 'fullcalendar'

export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
  colTags: string
}

export default class SpreadsheetHeader extends Component<SpreadsheetHeaderProps> {

  tableEl: HTMLElement

  constructor(context: ComponentContext, parentEl: HTMLElement) {
    super(context)

    parentEl.appendChild(
      this.tableEl = createElement('table', {
        className: this.theme.getClass('tableGrid')
      })
    )
  }

  destroy() {
    removeElement(this.tableEl)

    super.destroy()
  }

  render(props: SpreadsheetHeaderProps) {
    let { theme } = this
    let { colSpecs } = props
    let html =
      '<colgroup>' + props.colTags + '</colgroup>' +
      '<tbody>'

    if (props.superHeaderText) {
      html +=
        '<tr class="fc-super">' +
          '<th class="' + theme.getClass('widgetHeader') + '" colspan="' + colSpecs.length + '">' +
            '<div class="fc-cell-content">' +
              '<span class="fc-cell-text">' +
                htmlEscape(props.superHeaderText) +
              '</span>' +
            '</div>' +
          '</th>' +
        '</tr>'
    }

    html += '<tr>'

    for (let i = 0; i < colSpecs.length; i++) {
      let o = colSpecs[i]
      const isLast = i === (colSpecs.length - 1)

      html +=
        `<th class="` + theme.getClass('widgetHeader') + `">` +
          '<div>' +
            '<div class="fc-cell-content">' +
              (o.isMain ?
                '<span class="fc-expander-space">' +
                  '<span class="fc-icon"></span>' +
                '</span>' :
                '') +
              '<span class="fc-cell-text">' +
                htmlEscape(o.labelText || '') + // what about normalizing this value ahead of time?
              '</span>' +
            '</div>' +
            (!isLast ? '<div class="fc-col-resizer"></div>' : '') +
          '</div>' +
        '</th>'
    }

    html += '</tr>'
    html += '</tbody>'

    this.tableEl.innerHTML = html
  }

}
