import {
  BaseComponent,
  ElementDragging,
  elementClosest,
  PointerDragEvent,
  RefMap,
  findElements,
  ContentContainer,
} from '@fullcalendar/core/internal'
import { VNode, createElement, Fragment, createRef } from '@fullcalendar/core/preact'
import { ColSpec, ColHeaderContentArg, ColHeaderRenderHooks } from '@fullcalendar/resource'
import { SizeSyncer, SizeSyncerEntity } from './SizeSyncer.js'

export interface SpreadsheetHeaderProps {
  superHeaderRendering: ColHeaderRenderHooks
  colSpecs: ColSpec[]
  onColWidthChange?: (colWidths: number[]) => void
  rowSyncer: SizeSyncer
  normalHeightDef: SizeSyncerEntity
  superHeightDef: SizeSyncerEntity
}

interface SpreadsheetHeaderState {
  normalHeight: number
  superHeight: number
}

const SPREADSHEET_COL_MIN_WIDTH = 20

export class SpreadsheetHeader extends BaseComponent<SpreadsheetHeaderProps, SpreadsheetHeaderState> {
  private resizerElRefs = new RefMap<HTMLElement>(this._handleColResizerEl.bind(this))
  private colDraggings: { [index: string]: ElementDragging } = {}
  private normalInnerElRef = createRef<HTMLDivElement>()
  private superInnerElRef = createRef<HTMLDivElement>()

  render() {
    let { colSpecs, superHeaderRendering } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }
    let rowNodes: VNode[] = []

    if (superHeaderRendering) {
      rowNodes.push(
        <tr key="row-super" role="row">
          <ContentContainer
            elTag="th"
            elClasses={[
              'fc-datagrid-cell',
              'fc-datagrid-cell-super',
            ]}
            elAttrs={{
              role: 'columnheader',
              scope: 'colgroup',
              colSpan: colSpecs.length,
            }}
            renderProps={renderProps}
            generatorName="resourceAreaHeaderContent"
            customGenerator={superHeaderRendering.headerContent}
            defaultGenerator={superHeaderRendering.headerDefault}
            classNameGenerator={superHeaderRendering.headerClassNames}
            didMount={superHeaderRendering.headerDidMount}
            willUnmount={superHeaderRendering.headerWillUnmount}
          >
            {(InnerContent) => (
              <div className="fc-datagrid-cell-frame" style={{ height: this.state.superHeight }}>
                <InnerContent
                  elTag="div"
                  elClasses={['fc-datagrid-cell-cushion', 'fc-scrollgrid-sync-inner']}
                  elRef={this.superInnerElRef}
                />
              </div>
            )}
          </ContentContainer>
        </tr>,
      )
    }

    rowNodes.push(
      <tr key="row" role="row">
        {colSpecs.map((colSpec, i) => {
          let isLastCol = i === (colSpecs.length - 1)

          // need empty inner div for abs positioning for resizer
          return (
            <ContentContainer
              key={i} // eslint-disable-line react/no-array-index-key
              elTag="th"
              elClasses={['fc-datagrid-cell']}
              elAttrs={{ role: 'columnheader' }}
              renderProps={renderProps}
              generatorName="resourceAreaHeaderContent"
              customGenerator={colSpec.headerContent}
              defaultGenerator={colSpec.headerDefault}
              classNameGenerator={colSpec.headerClassNames}
              didMount={colSpec.headerDidMount}
              willUnmount={colSpec.headerWillUnmount}
            >
              {(InnerContent) => (
                <div className="fc-datagrid-cell-frame" style={{ height: this.state.normalHeight }}>
                  <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.normalInnerElRef}>
                    {colSpec.isMain && (
                      <span className="fc-datagrid-expander fc-datagrid-expander-placeholder">
                        <span className="fc-icon" />
                      </span>
                    )}
                    <InnerContent
                      elTag="span"
                      elClasses={['fc-datagrid-cell-main']}
                    />
                  </div>
                  {!isLastCol && (
                    <div className="fc-datagrid-cell-resizer" ref={this.resizerElRefs.createRef(i)} />
                  )}
                </div>
              )}
            </ContentContainer>
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

  // RowSyncer
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    const { rowSyncer, normalHeightDef, superHeightDef} = this.props
    rowSyncer.addSizeListener(normalHeightDef, this.handleNormalHeight)
    rowSyncer.addSizeListener(superHeightDef, this.handleSuperHeight)
    this.updateRowSyncer()
    this.context.addResizeHandler(this.updateRowSyncer)
  }

  componentDidUpdate(): void {
    this.updateRowSyncer()
  }

  componentWillUnmount(): void {
    const { rowSyncer, normalHeightDef, superHeightDef } = this.props
    this.context.removeResizeHandler(this.updateRowSyncer)
    rowSyncer.removeSizeListener(normalHeightDef, this.handleNormalHeight)
    rowSyncer.removeSizeListener(superHeightDef, this.handleSuperHeight)
    rowSyncer.clearCell(this)
  }

  updateRowSyncer = () => {
    const { rowSyncer, normalHeightDef, superHeightDef } = this.props
    rowSyncer.updateCell(this, normalHeightDef, this.normalInnerElRef.current.offsetHeight)
    rowSyncer.updateCell(this, superHeightDef, this.superInnerElRef.current.offsetHeight)
  }

  handleNormalHeight = (normalHeight: number) => {
    this.setState({ normalHeight })
  }

  handleSuperHeight = (superHeight: number) => {
    this.setState({ superHeight })
  }
}
