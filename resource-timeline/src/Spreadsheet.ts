import { Component, ComponentContext, renderer, memoize, findElements, htmlToElement, DomLocation } from '@fullcalendar/core'
import { HeaderBodyLayout, StickyScroller } from '@fullcalendar/timeline'
import SpreadsheetHeader from './SpreadsheetHeader'
import EnhancedScroller from 'packages-premium/timeline/src/util/EnhancedScroller'

export interface SpreadsheetProps {
  headerContainerEl: HTMLElement
  bodyContainerEl: HTMLElement
  superHeaderText: string
  colSpecs: any
}

export default class Spreadsheet extends Component<SpreadsheetProps> {

  private renderLayout = renderer(HeaderBodyLayout)
  private renderHeader = renderer(SpreadsheetHeader)
  private renderBodyTable = renderer(this._renderBodyTable)
  private initColWidthSyncing = renderer(this._initColWidthSyncing)
  private initStickyScroller = renderer(this._initStickyScroller, this._destroyStickyScroller)
  private renderColTagHtml = memoize(renderColTagHtml)

  private bodyColEls: HTMLElement[]
  bodyTbody: HTMLElement
  private stickyScroller: StickyScroller
  layout: HeaderBodyLayout
  header: SpreadsheetHeader


  render(props: SpreadsheetProps, context: ComponentContext) {
    let { colSpecs } = props

    let layout = this.layout = this.renderLayout({
      headerContainerEl: props.headerContainerEl,
      bodyContainerEl: props.bodyContainerEl,
      verticalScroll: 'clipped-scroll'
    })

    let headerContentEl = layout.headerScroller.enhancedScroller.canvas.contentEl
    let bodyContentEl = layout.bodyScroller.enhancedScroller.canvas.contentEl

    let colTagHtml = this.renderColTagHtml(colSpecs)

    let header = this.header = this.renderHeader({
      parentEl: headerContentEl,
      superHeaderText: props.superHeaderText,
      colSpecs,
      colTagHtml
    })

    this.initColWidthSyncing({ header })

    let { bodyTbody, bodyColEls } = this.renderBodyTable({
      parentEl: bodyContentEl,
      colTagHtml
    })

    this.bodyTbody = bodyTbody
    this.bodyColEls = bodyColEls

    this.applyColWidths(
      colSpecs.map((colSpec) => colSpec.width)
    )

    this.initStickyScroller({ enhancedBodyScroller: layout.bodyScroller.enhancedScroller })
  }


  _renderBodyTable({ colTagHtml }: { colTagHtml: string } & DomLocation, context: ComponentContext) {
    let rootEl = htmlToElement(
      '<div class="fc-rows">' +
        '<table>' +
          '<colgroup>' + colTagHtml + '</colgroup>' +
          '<tbody />' +
        '</table>' +
      '</div>'
    )

    return {
      rootEl,
      bodyTbody: rootEl.querySelector('tbody'),
      bodyColEls: findElements(rootEl, 'col')
    }
  }


  _initColWidthSyncing({ header }: { header: SpreadsheetHeader }) {
    header.emitter.on('colwidthchange', (colWidths: number[]) => {
      this.applyColWidths(colWidths)
    })
  }


  applyColWidths(colWidths: (number | string)[]) {
    colWidths.forEach((colWidth, colIndex) => {
      let header = this.renderHeader.current
      let headEl = header.colEls[colIndex] // bad to access child
      let bodyEl = this.bodyColEls[colIndex]
      let styleVal: string

      if (typeof colWidth === 'number') {
        styleVal = colWidth + 'px'
      } else if (typeof colWidth == null) {
        styleVal = ''
      }

      headEl.style.width = bodyEl.style.width = styleVal
    })
  }


  _initStickyScroller(props: { enhancedBodyScroller: EnhancedScroller }, context: ComponentContext) {
    this.stickyScroller = new StickyScroller(
      props.enhancedBodyScroller,
      context.isRtl,
      true // isVertical
    )
  }


  _destroyStickyScroller() {
    this.stickyScroller.destroy()
  }


  updateSize(isResize, totalHeight, isAuto) {
    let layout = this.renderLayout.current
    layout.setHeight(totalHeight, isAuto)
    this.updateStickyScrollers()
  }


  updateStickyScrollers() {
    this.stickyScroller.updateSize()
  }

}


function renderColTagHtml(colSpecs) {
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
