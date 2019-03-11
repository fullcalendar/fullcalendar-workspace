import { createElement, Component, ComponentContext, memoizeRendering } from '@fullcalendar/core'
import { HeaderBodyLayout } from '@fullcalendar/timeline'
import SpreadsheetHeader from './SpreadsheetHeader'

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
  bodyColEls: HTMLElement[]

  private _renderCells = memoizeRendering(this.renderCells, this.unrenderCells)

  constructor(context: ComponentContext, headParentEl: HTMLElement, bodyParentEl: HTMLElement) {
    super(context)

    this.layout = new HeaderBodyLayout(
      headParentEl,
      bodyParentEl,
      'clipped-scroll'
    )

    let headerEnhancedScroller = this.layout.headerScroller.enhancedScroll
    let bodyEnhancedScroller = this.layout.bodyScroller.enhancedScroll

    this.header = new SpreadsheetHeader(
      context,
      headerEnhancedScroller.canvas.contentEl
    )
    this.header.emitter.on('colwidthchange', (colWidths: number[]) => {
      this.applyBodyColWidths(colWidths)
    })

    bodyEnhancedScroller.canvas.contentEl
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

    this._renderCells.unrender()

    super.destroy()
  }

  render(props: SpreadsheetProps) {
    this._renderCells(props.superHeaderText, props.colSpecs)
  }

  renderCells(superHeaderText, colSpecs) {
    let colTags = this.renderColTags(colSpecs)

    this.header.receiveProps({
      superHeaderText: superHeaderText,
      colSpecs: colSpecs,
      colTags
    })

    this.bodyColGroup.innerHTML = colTags

    this.bodyColEls = Array.prototype.slice.call(
      this.bodyColGroup.querySelectorAll('col')
    )
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

  updateSize(isResize, totalHeight, isAuto) {
    this.layout.setHeight(totalHeight, isAuto)
  }

  applyBodyColWidths(colWidths: number[]) {
    colWidths.forEach((colWidth, colIndex) => {
      if (typeof colWidth === 'number') {
        this.bodyColEls[colIndex].style.width = colWidth + 'px'
      }
    })
  }

}
