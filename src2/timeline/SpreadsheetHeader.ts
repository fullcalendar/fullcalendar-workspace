import { removeElement, createElement, htmlEscape } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'

export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
}

export default class SpreadsheetHeader extends SimpleComponent {

  tableEl: HTMLElement

  setParent(parentEl: HTMLElement) {
    parentEl.appendChild(
      this.tableEl = createElement('table', {
        className: this.getTheme().getClass('tableGrid')
      })
    )
  }

  removeElement() {
    removeElement(this.tableEl)
  }

  render(props: SpreadsheetHeaderProps) { // TODO: forceFlags?
    this._render(props.superHeaderText, props.colSpecs)
  }

  _render(superHeaderText, colSpecs) {
    let theme = this.getTheme()
    let html = '<tbody>'

    if (superHeaderText) {
      html +=
        '<tr class="fc-super">' +
          '<th class="' + theme.getClass('widgetHeader') + '" colspan="' + colSpecs.length + '">' +
            '<div class="fc-cell-content">' +
              '<span class="fc-cell-text">' +
                htmlEscape(superHeaderText) +
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
