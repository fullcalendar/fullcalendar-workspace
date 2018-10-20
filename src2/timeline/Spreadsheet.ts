import { createElement, View } from 'fullcalendar'
import SpreadsheetHeader from './SpreadsheetHeader'
import SimpleComponent from './SimpleComponent'
import HeaderBodyLayout from './HeaderBodyLayout'

export interface SpreadsheetProps {
  superHeaderText: string
  colSpecs: any
}

export default class Spreadsheet extends SimpleComponent<SpreadsheetProps> {

  header: SpreadsheetHeader
  layout: HeaderBodyLayout

  bodyContainerEl: HTMLElement
  bodyColGroup: HTMLElement
  bodyTbody: HTMLElement

  constructor(view: View, headParentEl: HTMLElement, bodyParentEl: HTMLElement) {
    super(view)

    this.layout = new HeaderBodyLayout(
      headParentEl,
      bodyParentEl,
      'clipped-scroll'
    )

    this.header = new SpreadsheetHeader(
      view,
      this.layout.headerScroller.enhancedScroll.canvas.contentEl
    )

    this.layout.bodyScroller.enhancedScroll.canvas.contentEl
      .appendChild(
        this.bodyContainerEl = createElement('div',
          { className: 'fc-rows' },
          '<table>' +
            '<colgroup />' +
            '<tbody />' +
          '</table>'
        )
      )

    this.bodyColGroup = this.bodyContainerEl.querySelector('colgroup')
    this.bodyTbody = this.bodyContainerEl.querySelector('tbody')
  }

  destroy() {
    this.header.destroy()
    this.layout.destroy()

    super.destroy()
  }

  render(props: SpreadsheetProps) {
    let colTags = this.renderColTags(props.colSpecs)

    this.header.receiveProps({
      superHeaderText: props.superHeaderText,
      colSpecs: props.colSpecs,
      colTags
    })

    this.bodyColGroup.innerHTML = colTags
  }

  renderColTags(colSpecs) {
    let html = ''

    for (let o of colSpecs) {
      if (o.isMain) {
        html += '<col class="fc-main-col"/>'
      } else {
        html += '<col/>'
      }
    }

    return html
  }

  updateHeight(totalHeight, isAuto) {
    this.header.updateSize()
    this.layout.setHeight(totalHeight, isAuto)
  }

}
