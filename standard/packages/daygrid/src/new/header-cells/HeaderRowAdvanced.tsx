import { afterSize, BaseComponent, RefMap, setRef } from '@fullcalendar/core/internal'
import { Fragment, ComponentChild, createElement, Ref } from '@fullcalendar/core/preact'

export interface HeaderRowAdvancedProps<Model, ModelKey> {
  tierNum: number
  cells: Model[]
  renderHeaderContent: ( // TODO: better name
    model: Model,
    tier: number,
    innerHeightRef: Ref<number> | undefined,
    width: number | undefined,
  ) => ComponentChild
  getHeaderModelKey: (model: Model) => ModelKey

  // refs
  innerHeightRef?: Ref<number>

  // dimensions
  height: number | undefined
  colWidth?: number
}

export class HeaderRowAdvanced<Model, ModelKey> extends BaseComponent<HeaderRowAdvancedProps<Model, ModelKey>> {
  // ref
  private innerHeightRefMap = new RefMap<ModelKey, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private currentInnerHeight?: number

  render() {
    const { props } = this

    return (
      <div role='row' className='fcnew-row' style={{ height: props.height }}>
        {props.cells.map((cell) => {
          const key = props.getHeaderModelKey(cell)
          return (
            <Fragment key={props.getHeaderModelKey(cell)}>
              {props.renderHeaderContent(
                cell,
                props.tierNum,
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
