import {
  VNode, createElement, Fragment,
  BaseComponent, ElementDragging, elementClosest, PointerDragEvent, RefMap, findElements, RenderHook,
} from '@fullcalendar/common'
import { ColSpec, ColHeaderContentArg, ColHeaderRenderHooks } from '@fullcalendar/resource-common'

export interface SpreadsheetHeaderProps {
  superHeaderRendering: ColHeaderRenderHooks
  colSpecs: ColSpec[]
  rowInnerHeights: number[]
  onColWidthChange?: (colWidths: number[]) => void
}

const SPREADSHEET_COL_MIN_WIDTH = 20

export class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps> {
  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}

  render() {
    let { colSpecs, superHeaderRendering, rowInnerHeights } = this.props
    let hookProps: ColHeaderContentArg = { view: this.context.viewApi }
    let rowNodes: VNode[] = []

    rowInnerHeights = rowInnerHeights.slice() // copy, because we're gonna pop

    if (superHeaderRendering) {
      let rowInnerHeight = rowInnerHeights.shift()
      rowNodes.push(
        <tr key="row-super">
          <RenderHook
            hookProps={hookProps}
            classNames={superHeaderRendering.headerClassNames}
            content={superHeaderRendering.headerContent}
            didMount={superHeaderRendering.headerDidMount}
            willUnmount={superHeaderRendering.headerWillUnmount}
          >
            {(rootElRef, classNames, innerElRef, innerContent) => (
              <th
                colSpan={colSpecs.length}
                ref={rootElRef}
                className={[
                  'fc-datagrid-cell',
                  'fc-datagrid-cell-super',
                ].concat(classNames).join(' ')}
              >
                <div className="fc-datagrid-cell-frame" style={{ height: rowInnerHeight }}>
                  <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={innerElRef}>
                    {innerContent}
                  </div>
                </div>
              </th>
            )}
          </RenderHook>
        </tr>,
      )
    }

    let rowInnerHeight = rowInnerHeights.shift()
    rowNodes.push(
      <tr key="row">
        {colSpecs.map((colSpec, i) => {
          let isLastCol = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <RenderHook
              key={i} // eslint-disable-line react/no-array-index-key
              hookProps={hookProps}
              classNames={colSpec.headerClassNames}
              content={colSpec.headerContent}
              didMount={colSpec.headerDidMount}
              willUnmount={colSpec.headerWillUnmount}
            >
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <th ref={rootElRef} className={['fc-datagrid-cell'].concat(classNames).join(' ')}>
                  <div className="fc-datagrid-cell-frame" style={{ height: rowInnerHeight }}>
                    <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner">
                      {colSpec.isMain && (
                        <span className="fc-datagrid-expander fc-datagrid-expander-placeholder">
                          <span className="fc-icon" />
                        </span>
                      )}
                      <span className="fc-datagrid-cell-main" ref={innerElRef}>
                        {innerContent}
                      </span>
                    </div>
                    {!isLastCol &&
                      <div className="fc-datagrid-cell-resizer" ref={this.resizerElRefs.createRef(i)} />}
                  </div>
                </th>
              )}
            </RenderHook>
          )
        })}
      </tr>,
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

        currentWidths = allCells.map((cellEl) => (
          cellEl.getBoundingClientRect().width
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

    return null
  }
}
