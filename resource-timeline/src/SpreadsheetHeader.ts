import { ElementDragging, createElement, htmlEscape, Component, ComponentContext, PointerDragEvent, EmitterMixin, renderer, findElements } from '@fullcalendar/core'

export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
  colTagHtml: string
}

const COL_MIN_WIDTH = 30

export default class SpreadsheetHeader extends Component<SpreadsheetHeaderProps> {

  private initColResizing = renderer(this._initColResizing, this._destroyColResizing)

  private colWidths: number[] = []
  emitter: EmitterMixin = new EmitterMixin()
  colEls: HTMLElement[]


  render(props: SpreadsheetHeaderProps, context: ComponentContext) {
    let { theme } = context
    let { colSpecs } = props
    let html =
      '<colgroup>' + props.colTagHtml + '</colgroup>' +
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

    let tableEl = createElement('table', {
      className: theme.getClass('tableGrid')
    }, html)

    let colEls = findElements(tableEl, 'col')
    let thEls = findElements(tableEl, 'th')
    let resizerEls = findElements(tableEl, '.fc-col-resizer')

    this.colEls = colEls
    this.initColResizing(true, { thEls, resizerEls })

    return tableEl
  }


  _initColResizing({ thEls, resizerEls }: { thEls: HTMLElement[], resizerEls: HTMLElement[] }, context: ComponentContext): ElementDragging[] {
    let { pluginHooks, isRtl } = context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      return resizerEls.map((handleEl: HTMLElement, colIndex) => {
        let dragging = new ElementDraggingImpl(handleEl)
        let startWidth

        dragging.emitter.on('dragstart', () => {
          startWidth = this.colWidths[colIndex]
          if (typeof startWidth !== 'number') {
            startWidth = thEls[colIndex].getBoundingClientRect().width
          }
        })

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          this.colWidths[colIndex] = Math.max(startWidth + pev.deltaX * (isRtl ? -1 : 1), COL_MIN_WIDTH)
          this.emitter.trigger('colwidthchange', this.colWidths)
        })

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

        return dragging
      })

    } else {
      return []
    }
  }


  _destroyColResizing(resizables: ElementDragging[]) {
    for (let resizable of resizables) {
      resizable.destroy()
    }
  }

}
