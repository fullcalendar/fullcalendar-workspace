import { afterSize, BaseComponent, ElementDragging, PointerDragEvent, RefMap, setRef } from "@fullcalendar/core/internal"
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ColSpec } from '@fullcalendar/resource/internal'
import { HeaderCell } from "./HeaderCell.js"

export interface HeaderRowProps {
  colSpecs: ColSpec[]
  colWidthConfigs: { pixels: number, grow: number }[]
  indent?: boolean // only for the 'main' cell

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
    const { colSpecs, colWidthConfigs } = props

    return (
      <div
        role="row"
        className='fc-flex-row fc-grow'
      >
        {colSpecs.map((colSpec, colIndex) => {
          return (
            <HeaderCell
              key={colIndex}
              widthConfig={colWidthConfigs[colIndex]}
              colSpec={colSpec}
              resizer={colIndex < colSpecs.length - 1}
              indent={colSpec.isMain && props.indent}
              resizerElRef={resizerElRefMap.createRef(colIndex)}
              innerHeightRef={innerHeightRefMap.createRef(colIndex)}
              borderStart={Boolean(colIndex)}
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
        const origWidth = this.props.colWidthConfigs[colIndex].pixels

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          if (this.props.onColResize) {
            const newWidth = Math.max(0, origWidth + pev.deltaX * (this.context.isRtl ? -1 : 1))
            this.props.onColResize(colIndex, newWidth)
          }
        })

        dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area
      })

      return dragging
    }

    return null
  }
}
