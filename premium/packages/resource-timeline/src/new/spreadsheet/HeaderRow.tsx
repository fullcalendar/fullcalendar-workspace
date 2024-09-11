import { afterSize, BaseComponent, ElementDragging, PointerDragEvent, RefMap, setRef } from "@fullcalendar/core/internal"
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ColSpec } from '@fullcalendar/resource/internal'
import { HeaderCell } from "./HeaderCell.js"
import { SPREADSHEET_COL_MIN_WIDTH } from "../../resource-positioning.js"

export interface HeaderRowProps {
  colSpecs: ColSpec[]
  colWidths: number[]

  // refs
  innerHeightRef?: Ref<number>

  // dimensions
  height?: number

  // handlers
  onColWidthOverrides?: (colWidthOverrides: number[]) => void
}

export class HeaderRow extends BaseComponent<HeaderRowProps> {
  // refs
  private colWrapElRefMap = new RefMap<number, HTMLDivElement>()
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
    const { props, innerHeightRefMap, colWrapElRefMap, resizerElRefMap } = this
    const { colSpecs, colWidths } = props

    return (
      <div role="row" style={{ height: props.height }}>
        {colSpecs.map((colSpec, colIndex) => {
          return (
            <div
              key={colIndex}
              style={{ width: colWidths[colIndex] }}
              ref={colWrapElRefMap.createRef(colIndex)}
            >
              {/* TODO: give the width to the HeaderCell directly? */}
              <HeaderCell
                colSpec={colSpec}
                resizer={colIndex < colSpecs.length - 1}
                resizerElRef={resizerElRefMap.createRef(colIndex)}
                innerHeightRef={innerHeightRefMap.createRef(colIndex)}
              />
            </div>
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

  // TODO: unset innerHeightRef on unmount?

  // Dragging
  // -----------------------------------------------------------------------------------------------

  initColResizing(resizerEl: HTMLElement, index: number) {
    let { pluginHooks, isRtl } = this.context
    let ElementDraggingImpl = pluginHooks.elementDraggingImpl

    if (ElementDraggingImpl) {
      let dragging = new ElementDraggingImpl(resizerEl)
      let startWidth: number // of just the single column
      let currentWidths: number[] // of all columns

      dragging.emitter.on('dragstart', () => {
        currentWidths = this.props.colWidths
        startWidth = currentWidths[index]
      })

      dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
        currentWidths[index] = Math.max(
          startWidth + pev.deltaX * (isRtl ? -1 : 1),
          SPREADSHEET_COL_MIN_WIDTH,
        )

        if (this.props.onColWidthOverrides) {
          this.props.onColWidthOverrides(currentWidths.slice()) // send a copy since currentWidths continues to be mutated
        }
      })

      dragging.setAutoScrollEnabled(false) // because gets weird with auto-scrolling time area

      return dragging
    }

    return null
  }
}
