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

  // ref
  innerHeightRef?: Ref<number>
}

/*
ONLY does cell!! does not do TR around it. rename? will this make it more portable for Normal layout?
ONLY USED FOR Pannable layout!!!
TODO: combine with DayGridHeader?
TODO: why not make this a PureComponent? search for others like this
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
      <Fragment>
        {props.models.map((model) => {
          const key = props.getHeaderModelKey(model)
          return (
            <Fragment key={key}>
              {props.renderHeaderContent(
                model,
                props.tierNum,
                this.innerHeightRefMap.createRef(key), // innerHeightRef
                undefined, // height --- AHHH given here too??
              )}
            </Fragment>
          )
        })}
      </Fragment>
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
