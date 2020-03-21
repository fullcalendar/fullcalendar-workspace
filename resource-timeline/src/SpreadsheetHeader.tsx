import {
  VNode, h, Fragment,
  BaseComponent, ElementDragging, elementClosest, PointerDragEvent, RefMap, findElements, RenderHook, ComponentContext,
} from '@fullcalendar/core'
import { ColSpec } from '@fullcalendar/resource-common'


export interface SpreadsheetHeaderProps {
  superHeaderRendering: { headerClassNames?, headerContent?, headerDidMount?, headerWillUnmount? }
  colSpecs: ColSpec[]
  rowInnerHeights: number[]
  onColWidthChange?: (colWidths: number[]) => void
}

const SPREADSHEET_COL_MIN_WIDTH = 20


export default class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps> {

  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}


  render(props: SpreadsheetHeaderProps, context: ComponentContext) {
    let { colSpecs, superHeaderRendering } = props
    let innerProps = { view: context.view }
    let rowNodes: VNode[] = []
    let rowInnerHeights = props.rowInnerHeights.slice() // copy, because we're gonna pop

    if (superHeaderRendering) {
      let rowInnerHeight = rowInnerHeights.shift()
      rowNodes.push(
        <tr>
          <RenderHook name='header' mountProps={innerProps} dynamicProps={innerProps} options={superHeaderRendering}>
            {(rootElRef, classNames, innerElRef, innerContent) => (
              <th colSpan={colSpecs.length} className={[ 'fc-datagrid-header', 'fc-datagrid-header-super' ].concat(classNames).join(' ')} ref={rootElRef}>
                <div class='fc-datagrid-header-frame' style={{ height: rowInnerHeight }}>
                  <div class='fc-datagrid-header-cushion fc-scrollgrid-row-height' ref={innerElRef}>
                    {innerContent}
                  </div>
                </div>
              </th>
            )}
          </RenderHook>
        </tr>
      )
    }

    let rowInnerHeight = rowInnerHeights.shift()
    rowNodes.push(
      <tr>
        {colSpecs.map((colSpec, i) => {
          let isLastCol = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <RenderHook name='header' mountProps={innerProps} dynamicProps={innerProps} options={colSpec}>
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <th ref={rootElRef} className={[ 'fc-datagrid-header' ].concat(classNames).join(' ')}>
                  <div class='fc-datagrid-header-frame' style={{ height: rowInnerHeight }}>
                    <div class='fc-datagrid-header-cushion fc-scrollgrid-row-height'>
                      {colSpec.isMain &&
                        <span class='fc-datagrid-expander fc-datagrid-expander-placeholder'>
                          <span class='fc-icon'></span>
                        </span>
                      }
                      <span ref={innerElRef}>
                        {innerContent}
                      </span>
                    </div>
                    {!isLastCol &&
                      <div class='fc-datagrid-header-resizer' ref={this.resizerElRefs.createRef(i)}></div>
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
