import { ElementDragging, BaseComponent, ComponentContext, PointerDragEvent, EmitterMixin, findElements, subrenderer, guid } from '@fullcalendar/core'
import { VNode, h } from 'preact'
import { renderColGroupNodes } from './SpreadsheetColWidths'


export interface SpreadsheetHeaderProps {
  superHeaderText: string
  colSpecs: any
}

const COL_MIN_WIDTH = 30


export default class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps> {

  private updateColResizing = subrenderer(this._initColResizing, this._destroyColResizing)
  private colWidths: number[] = []

  emitter: EmitterMixin = new EmitterMixin()
  colEls: HTMLElement[]


  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return super.shouldComponentUpdate(nextProps, nextState, nextContext)
  }


  render(props: SpreadsheetHeaderProps, state: {}, context: ComponentContext) {
    let { theme } = context
    let { colSpecs, superHeaderText } = props
    let rowNodes: VNode[] = []

    if (superHeaderText) {
      rowNodes.push(
        <tr class='fc-super'>
          <th class={theme.getClass('widgetHeader')} colSpan={colSpecs.length}>
            <div class='fc-cell-content'>
              <span class='fc-cell-text'>
                {superHeaderText}
              </span>
            </div>
          </th>
        </tr>
      )
    }

    rowNodes.push(
      <tr>
        {colSpecs.map((o, i) => {
          let isLast = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <th class={theme.getClass('widgetHeader')}>
              <div>
                <div class='fc-cell-content'>
                  {o.isMain &&
                    <span class='fc-expander-space'>
                      <span class='fc-icon'></span>
                    </span>
                  }
                  <span class='fc-cell-text'>
                    {o.labelText || '' /* what about normalizing this value ahead of time? */ }
                  </span>
                </div>
                {!isLast &&
                  <div class='fc-col-resizer'></div>
                }
              </div>
            </th>
          )
        })}
      </tr>
    )

    return ( // guid rerenders whole DOM every time
      <table class={theme.getClass('tableGrid')} ref={this.handleRootEl} key={guid()}>
        <colgroup>{renderColGroupNodes(props.colSpecs)}</colgroup>
        <tbody>{rowNodes}</tbody>
      </table>
    )
  }


  handleRootEl = (rootEl: HTMLElement | null) => {
    if (rootEl) {
      let colEls = findElements(rootEl, 'col')
      let thEls = findElements(rootEl, 'th')
      let resizerEls = findElements(rootEl, '.fc-col-resizer')

      this.colEls = colEls
      this.updateColResizing({ thEls, resizerEls })
    }
  }


  componentWillUnmount() {
    this.subrenderDestroy()
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
