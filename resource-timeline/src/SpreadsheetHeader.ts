import { ElementDragging, removeElement, createElement, htmlEscape, Component, ComponentContext, PointerDragEvent, EmitterMixin, memoizeRendering } from '@fullcalendar/core'

export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
  colTags: string
}

const COL_MIN_WIDTH = 30

export default class SpreadsheetHeader extends Component<SpreadsheetHeaderProps> {

  parentEl: HTMLElement
  tableEl: HTMLElement
  resizerEls: HTMLElement[]
  resizables: ElementDragging[] = []
  thEls: HTMLElement[]
  colEls: HTMLElement[]
  colWidths: number[] = []
  emitter: EmitterMixin = new EmitterMixin()

  private renderSkeleton = memoizeRendering(this._renderSkeleton, this._unrenderSkeleton)


  constructor(parentEl: HTMLElement) {
    super()

    this.parentEl = parentEl
  }


  render(props: SpreadsheetHeaderProps, context: ComponentContext) {

    this.renderSkeleton(context)

    let { theme } = context
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

    this.thEls = Array.prototype.slice.call(
      this.tableEl.querySelectorAll('th')
    )

    this.colEls = Array.prototype.slice.call(
      this.tableEl.querySelectorAll('col')
    )

    this.resizerEls = Array.prototype.slice.call(
      this.tableEl.querySelectorAll('.fc-col-resizer')
    )

    this.initColResizing()
  }


  destroy() {
    for (let resizable of this.resizables) {
      resizable.destroy()
    }

    this.renderSkeleton.unrender()

    super.destroy()
  }


  _renderSkeleton(context: ComponentContext) {
    this.parentEl.appendChild(
      this.tableEl = createElement('table', {
        className: context.theme.getClass('tableGrid')
      })
    )
  }


  _unrenderSkeleton() {
    removeElement(this.tableEl)
  }


  initColResizing() {
    let { calendar, isRtl } = this.context
    let ElementDraggingImpl = calendar.pluginSystem.hooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      this.resizables = this.resizerEls.map((handleEl: HTMLElement, colIndex) => {
        let dragging = new ElementDraggingImpl(handleEl)
        let startWidth

        dragging.emitter.on('dragstart', () => {
          startWidth = this.colWidths[colIndex]
          if (typeof startWidth !== 'number') {
            startWidth = this.thEls[colIndex].getBoundingClientRect().width
          }
        })

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          this.colWidths[colIndex] = Math.max(startWidth + pev.deltaX * (isRtl ? -1 : 1), COL_MIN_WIDTH)
          this.emitter.trigger('colwidthchange', this.colWidths)
        })

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

        return dragging
      })
    }
  }

}
