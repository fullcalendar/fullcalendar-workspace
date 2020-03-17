import {
  VNode, h, Fragment,
  BaseComponent, ElementDragging, elementClosest, PointerDragEvent, RefMap, findElements, RenderHook,
} from '@fullcalendar/core'
import { ColSpec } from '@fullcalendar/resource-common'


export interface SpreadsheetHeaderProps {
  superHeaderRendering: { labelClassNames?, labelContent?, labelDidMount?, labelWillUnmount? }
  colSpecs: ColSpec[]
  onColWidthChange?: (colWidths: number[]) => void
}

const SPREADSHEET_COL_MIN_WIDTH = 20


export default class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps> {

  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}


  render(props: SpreadsheetHeaderProps) {
    let { colSpecs, superHeaderRendering } = props
    let rowNodes: VNode[] = []

    if (superHeaderRendering) {
      rowNodes.push(
        <tr class='fc-super'>
          <RenderHook name='label' mountProps={{}} dynamicProps={{}} options={superHeaderRendering}>
            {(rootElRef, classNames, innerElRef, innerContent) => (
              <th colSpan={colSpecs.length} className={classNames.join(' ')} ref={rootElRef}>
                <div class='fc-cell-content'>
                  <span class='fc-cell-text' ref={innerElRef}>
                    {innerContent}
                  </span>
                </div>
              </th>
            )}
          </RenderHook>
        </tr>
      )
    }

    rowNodes.push(
      <tr>
        {colSpecs.map((colSpec, i) => {
          let isLastCol = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <RenderHook name='label' mountProps={{}} dynamicProps={{}} options={colSpec}>
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <th ref={rootElRef} className={classNames.join(' ')}>
                  <div>
                    <div class='fc-cell-content'>
                      {colSpec.isMain &&
                        <span class='fc-expander-space'>
                          <span class='fc-icon'></span>
                        </span>
                      }
                      <span class='fc-cell-text' ref={innerElRef}>
                        {innerContent}
                      </span>
                    </div>
                    {!isLastCol &&
                      <div class='fc-col-resizer' ref={this.resizerElRefs.createRef(i)}></div>
                    }
                  </div>
                </th>
              )}
            </RenderHook>
          )
        })}
      </tr>
    )

    return (<Fragment>{rowNodes}</Fragment>)
  }


  _handleColResizerEl(resizerEl: HTMLElement | null, index: string) {
    let { colDraggings } = this

    if (!resizerEl) {
      let dragging = colDraggings[index]

      if (dragging) {
        dragging.destroy()
        delete colDraggings[index]
      }

    } else {
      let dragging = this.initColResizing(resizerEl, parseInt(index, 10))

      if (dragging) {
        colDraggings[index] = dragging
      }
    }
  }


  initColResizing(resizerEl: HTMLElement, index: number) {
    let { pluginHooks, isRtl } = this.context
    let { onColWidthChange } = this.props
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(resizerEl)
      let startWidth: number // of just the single column
      let currentWidths: number[] // of all columns

      dragging.emitter.on('dragstart', () => {
        let allCells = findElements(elementClosest(resizerEl, 'tr'), 'th')

        currentWidths = allCells.map((resizerEl) => (
          elementClosest(resizerEl, 'th').getBoundingClientRect().width
        ))
        startWidth = currentWidths[index]
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        currentWidths[index] = Math.max(startWidth + pev.deltaX * (isRtl ? -1 : 1), SPREADSHEET_COL_MIN_WIDTH)

        if (onColWidthChange) {
          onColWidthChange(currentWidths.slice()) // send a copy since currentWidths continues to be mutated
        }
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

      return dragging
    }
  }

}
