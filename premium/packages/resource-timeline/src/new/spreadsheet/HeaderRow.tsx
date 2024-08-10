import { afterSize, BaseComponent, RefMap, setRef } from "@fullcalendar/core/internal"
import { createElement, Ref } from '@fullcalendar/core/preact'
import { ColSpec } from '@fullcalendar/resource/internal'
import { HeaderCell } from "./HeaderCell.js"

export interface HeaderRowProps {
  colSpecs: ColSpec[]
  colWidths: number[]

  // refs
  resizerElRefMap?: RefMap<number, HTMLDivElement> // TODO: get rid of this
  innerHeightRef?: Ref<number>

  // dimensions
  height?: number
}

export class HeaderRow extends BaseComponent<HeaderRowProps> {
  private innerHeightRefMap = new RefMap<number, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private currentInnerHeight?: number

  render() {
    const { props, innerHeightRefMap } = this
    const { colSpecs, colWidths, resizerElRefMap } = props

    return (
      <div role="row" style={{ height: props.height }}>
        {colSpecs.map((colSpec, colIndex) => {
          return (
            <div
              key={colIndex}
              style={{ width: colWidths[colIndex] }}
            >
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
}
