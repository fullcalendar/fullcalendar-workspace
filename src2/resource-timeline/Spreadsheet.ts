import { createElement, Component, ComponentContext } from 'fullcalendar'
import SpreadsheetHeader from './SpreadsheetHeader'
import HeaderBodyLayout from '../timeline/HeaderBodyLayout'

export interface SpreadsheetProps {
  superHeaderText: string
  colSpecs: any
}

export default class Spreadsheet extends Component<SpreadsheetProps> {

  header: SpreadsheetHeader
  layout: HeaderBodyLayout

  bodyContainerEl: HTMLElement
  bodyColGroup: HTMLElement
  bodyTbody: HTMLElement

  constructor(context: ComponentContext, headParentEl: HTMLElement, bodyParentEl: HTMLElement) {
    super(context)

    this.layout = new HeaderBodyLayout(
      headParentEl,
      bodyParentEl,
      'clipped-scroll'
    )

    this.header = new SpreadsheetHeader(
      context,
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
    this.subrender('renderCells', [ props.superHeaderText, props.colSpecs ], 'unrenderCells')
  }

  renderCells(superHeaderText, colSpecs) {
    let colTags = this.renderColTags(colSpecs)

    this.header.receiveProps({
      superHeaderText: superHeaderText,
      colSpecs: colSpecs,
      colTags
    })

    this.bodyColGroup.innerHTML = colTags
  }

  unrenderCells() {
    this.bodyColGroup.innerHTML = ''
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

  updateSize(totalHeight, isAuto, isResize) {
    this.header.updateSize(totalHeight, isAuto, isResize)
    this.layout.setHeight(totalHeight, isAuto)
  }

}
