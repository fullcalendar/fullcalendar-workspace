import { createElement } from 'fullcalendar'
import SpreadsheetHeader from './SpreadsheetHeader'
import SimpleComponent from './SimpleComponent'
import HeaderBodyLayout from './HeaderBodyLayout'

export interface SpreadsheetProps {
  superHeaderText: string
  colSpecs: any
}

export default class Spreadsheet extends SimpleComponent {

  header: SpreadsheetHeader
  layout: HeaderBodyLayout

  bodyContainerEl: HTMLElement
  bodyColGroup: HTMLElement
  bodyTbody: HTMLElement

  setParents(headParentEl: HTMLElement, bodyParentEl: HTMLElement) {

    this.layout = new HeaderBodyLayout(this.view)
    this.layout.setParents(headParentEl, bodyParentEl, 'clipped-scroll')

    this.header = new SpreadsheetHeader(this.view)
    this.header.setParent(this.layout.headerScroller.enhancedScroll.canvas.contentEl)

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

  removeElements() {
    this.header.removeElement()
    this.layout.removeElements()
  }

  render(props: SpreadsheetProps) {
    let colTags = this.renderColTags(props.colSpecs)

    this.header.render({
      superHeaderText: props.superHeaderText,
      colSpecs: props.colSpecs,
      colTags
    })

    this.bodyColGroup.innerHTML = colTags
  }

  updateSize(totalHeight, isAuto) {
    this.layout.updateSize(totalHeight, isAuto)
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

}
