import { afterSize, RefMap, setRef } from '@fullcalendar/core/internal'
import { Component, ComponentChild, createElement, Fragment, Ref } from '@fullcalendar/core/preact'

export interface TimeGridHeaderTierProps<HeaderCellModel, HeaderCellKey> {
  tierNum: number
  models: HeaderCellModel[]
  renderHeaderContent: ( // TODO: better name
    model: HeaderCellModel,
    tier: number,
    innerHeightRef: Ref<number> | undefined,
    height: number | undefined,
  ) => ComponentChild
  getHeaderModelKey: (model: HeaderCellModel) => HeaderCellKey // TODO: better name

  // dimmension
  height: number | undefined

  // ref
  innerHeightRef?: Ref<number>
}

/*
TODO: combine with DayGridHeader?
*/
export class TimeGridHeaderTier<HeaderCellModel, HeaderCellKey> extends Component<TimeGridHeaderTierProps<HeaderCellModel, HeaderCellKey>> {
  // ref
  private innerHeightRefMap = new RefMap<HeaderCellKey, number>(() => {
    afterSize(this.handleInnerHeights)
  })

  // internal
  private currentInnerHeight?: number

  render() {
    const { props } = this

    return (
      <div className='fcnew-tier' style={{ height: props.height }}>
        {props.models.map((model) => {
          const key = props.getHeaderModelKey(model)
          return (
            <Fragment key={key}>
              {props.renderHeaderContent(
                model,
                props.tierNum,
                this.innerHeightRefMap.createRef(key), // innerHeightRef
                props.height, // height --- AHHH given here too??
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
