import { afterSize, BaseComponent, ElementDragging, joinArrayishClassNames, PointerDragEvent, RefMap, setRef } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ColSpec } from '../../structs.js'
import { HeaderCell } from './HeaderCell.js'

export interface HeaderRowProps {
  colSpecs: ColSpec[]
  colWidths: number[] | undefined
  colGrows?: number[]
  indent?: boolean // only for the 'main' cell
  indentWidth: number | undefined
  rowIndex?: number // 0-based

  // refs
  innerHeightRef?: Ref<number>

  // handlers
  onColResize?: (colIndex: number, newWidth: number) => void
}

export class HeaderRow extends BaseComponent<HeaderRowProps> {
  // refs
  private resizerElRefMap = new RefMap<number, HTMLDivElement>((resizerEl, index) => {
    let { colDraggings } = this

    if (!resizerEl) {
      let dragging = colDraggings[index]

      if (dragging) {
        dragging.destroy()
        delete colDraggings[index]
      }
    } else {
      let dragging = this.initColResizing(resizerEl, index)

      if (dragging) {
        colDraggings[index] = dragging
      }
    }
  })
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight?: number

  // internal
  private colDraggings: { [index: string]: ElementDragging } = {}

  render() {
    const { props, innerHeightRefMap, resizerElRefMap } = this
    const { colSpecs } = props
    const { options } = this.context

    const colWidths = props.colWidths || []
    const colGrows = props.colGrows || []

    return (
      <div
        role="row"
        aria-rowindex={props.rowIndex != null ? 1 + props.rowIndex : undefined}
        className={joinArrayishClassNames(
          options.resourceAreaHeaderRowClassNames,
          classNames.flexRow,
          classNames.grow,
          classNames.borderNone,
        )}
      >
        {colSpecs.map((colSpec, colIndex) => {
          return (
            <HeaderCell
              key={colIndex}
              width={colWidths[colIndex]}
              grow={colGrows[colIndex]}
              colSpec={colSpec}
              resizer={colIndex < colSpecs.length - 1}
              indent={colSpec.isMain && props.indent}
              resizerElRef={resizerElRefMap.createRef(colIndex)}
              innerHeightRef={innerHeightRefMap.createRef(colIndex)}
              borderStart={Boolean(colIndex)}
              indentWidth={props.indentWidth}
            />
          )
        })}
      </div>
    )
  }

  private handleInnerHeights = () => {
    const { innerHeightRefMap } = this
    let max = 0

    for (const innerHeight of innerHeightRefMap.current.values()) {
      max = Math.max(max, innerHeight)
    }

    if (this.currentInnerHeight !== max) {
      this.currentInnerHeight = max
      setRef(this.props.innerHeightRef, max)
    }
  }

  componentWillUnmount(): void {
    setRef(this.props.innerHeightRef, null)
  }

  // Dragging
  // -----------------------------------------------------------------------------------------------

  initColResizing(resizerEl: HTMLElement, colIndex: number) {
    let { pluginHooks } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(resizerEl)

      dragging.emitter.on('dragstart', () => {
        const startWidth = this.props.colWidths[colIndex]

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          if (this.props.onColResize) {
            this.props.onColResize(
              colIndex,
              startWidth + pev.deltaX * (this.context.isRtl ? -1 : 1)
            )
          }
        })

        // because gets weird with auto-scrolling time area
        dragging.setAutoScrollEnabled(false)
      })

      return dragging
    }

    return null
  }
}
