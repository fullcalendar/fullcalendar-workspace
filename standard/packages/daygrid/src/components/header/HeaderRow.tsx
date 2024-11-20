import { afterSize, BaseComponent, joinClassNames, RefMap, setRef } from '@fullcalendar/core/internal'
import { Fragment, ComponentChild, createElement, Ref } from '@fullcalendar/core/preact'

export interface HeaderRowProps<Model, ModelKey> {
  tierNum: number
  cells: Model[]
  renderHeaderContent: ( // TODO: better name
    model: Model,
    tier: number,
    cell: number,
    innerHeightRef: Ref<number> | undefined,
    width: number | undefined,
  ) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey
  className?: string

  // refs
  innerHeightRef?: Ref<number>

  // dimensions
  height?: number
  colWidth?: number
}

export class HeaderRow<Model, ModelKey> extends BaseComponent<HeaderRowProps<Model, ModelKey>> {
  // ref
  private innerHeightRefMap = new RefMap<ModelKey, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private currentInnerHeight?: number

  render() {
    const { props } = this

    return (
      <div
        role='row'
        className={joinClassNames(
          'fc-flex-row fc-content-box',
          props.className,
        )}
        style={{ height: props.height }}
      >
        {props.cells.map((cell, cellI) => {
          const key = props.getHeaderModelKey(cell)
          return (
            <Fragment key={props.getHeaderModelKey(cell)}>
              {props.renderHeaderContent(
                cell,
                props.tierNum,
                cellI,
                this.innerHeightRefMap.createRef(key), // innerHeightRef
                props.colWidth, // width
              )}
            </Fragment>
          )
        })}
      </div>
    )
  }

  private handleInnerHeights = () => {
    const innerHeightMap = this.innerHeightRefMap.current
    let max = 0

    for (const innerHeight of innerHeightMap.values()) {
      max = Math.max(max, innerHeight)
    }

    if (this.currentInnerHeight !== max) {
      this.currentInnerHeight = max
      setRef(this.props.innerHeightRef, max)
    }
  }
}
