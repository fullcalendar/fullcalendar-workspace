import { afterSize, computeElIsRtl, ElementDragging, type PointerDragEvent, RefMap, setRef, useLatest, useViewContext } from '@fullcalendar/preact/protected-api'
import { memo, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { ColSpec } from '../../structs'
import { HeaderCell } from './HeaderCell'

export interface HeaderCellsProps {
  colSpecs: ColSpec[]
  colWidths: number[] | undefined
  indent?: boolean // only for the 'main' cell
  indentWidth: number | undefined
  rowIndex?: number // 0-based
  cellIdPrefix?: string
  forPrint?: boolean

  // refs
  innerHeightRef?: Ref<number>

  // handlers
  onColResize?: (colIndex: number, newWidth: number) => void
}

export const HeaderCells = memo(function HeaderCells(props: HeaderCellsProps) {
  const { pluginHooks } = useViewContext()
  const isActiveRef = useRef(false)
  const propsRef = useLatest(props)

  const [refMaps] = useState(() => {
    let currentInnerHeight: number | undefined
    const colDraggings: { [index: string]: ElementDragging } = {}

    const handleInnerHeights = () => {
      if (isActiveRef.current) {
        let max = 0

        for (const innerHeight of innerHeightRefMap.current.values()) {
          max = Math.max(max, innerHeight)
        }

        if (currentInnerHeight !== max) {
          currentInnerHeight = max
          setRef(propsRef.current.innerHeightRef, max)
        }
      }
    }

    // dragging a column's resizer resizes the column
    const initColResizing = (resizerEl: HTMLElement, colIndex: number) => {
      const ElementDraggingImpl = pluginHooks.elementDraggingImpl

      if (ElementDraggingImpl) {
        const dragging = new ElementDraggingImpl(resizerEl)
        let isRtl: boolean
        let startWidth: number

        dragging.emitter.on('dragstart', () => {
          isRtl = computeElIsRtl(resizerEl)
          startWidth = propsRef.current.colWidths[colIndex]

          // because gets weird with auto-scrolling time area
          dragging.setAutoScrollEnabled(false)
        })

        dragging.emitter.on('dragmove', (pev: PointerDragEvent) => {
          const { onColResize } = propsRef.current

          if (onColResize) {
            onColResize(
              colIndex,
              startWidth + pev.deltaX * (isRtl ? -1 : 1),
            )
          }
        })

        return dragging
      }

      return null
    }

    const resizerElRefMap = new RefMap<number, HTMLDivElement>((resizerEl, index) => {
      if (!resizerEl) {
        const dragging = colDraggings[index]

        if (dragging) {
          dragging.destroy()
          delete colDraggings[index]
        }
      } else {
        const dragging = initColResizing(resizerEl, index)

        if (dragging) {
          colDraggings[index] = dragging
        }
      }
    })
    const innerHeightRefMap = new RefMap<number, number>(() => {
      afterSize(handleInnerHeights)
    })

    return {
      resizerElRefMap,
      innerHeightRefMap,
      clearInnerHeight() {
        currentInnerHeight = undefined
      },
    }
  })
  const { resizerElRefMap, innerHeightRefMap } = refMaps

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      refMaps.clearInnerHeight()
      setRef(propsRef.current.innerHeightRef, null)
    }
  }, [])

  const { colSpecs } = props
  const colWidths = props.colWidths || []

  return (
    <>
      {colSpecs.map((colSpec, colIndex) => (
        <HeaderCell
          key={colIndex}
          cellIdPrefix={props.cellIdPrefix}
          cellRowIndex={props.rowIndex != null ? 1 + props.rowIndex : undefined}
          cellColIndex={props.cellIdPrefix ? colIndex : undefined}
          width={colWidths[colIndex]}
          colSpec={colSpec}
          resizer={colIndex < colSpecs.length - 1}
          indent={colSpec.isMain && props.indent}
          resizerElRef={resizerElRefMap.createRef(colIndex)}
          innerHeightRef={innerHeightRefMap.createRef(colIndex)}
          borderStart={Boolean(colIndex)}
          indentWidth={props.indentWidth}
          forPrint={props.forPrint}
        />
      ))}
    </>
  )
})
