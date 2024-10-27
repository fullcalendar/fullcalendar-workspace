import { SlotLaneContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatLaneProps extends TimeSlatMeta {
  innerHeightRef?: Ref<number>
}

export class TimeGridSlatLane extends BaseComponent<TimeGridSlatLaneProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps: SlotLaneContentArg = {
      time: props.time,
      date: context.dateEnv.toDate(props.date),
      view: context.viewApi,
    }

    return (
      <ContentContainer
        elTag="div"
        // TODO: have lane classNames like 'fc-timegrid-lane'/'fc-timegrid-slot-lane'/'fc-timegrid-slat-lane'
        elClassName='fc-cell fc-liquid'
        elAttrs={{
          'data-time': props.isoTimeStr,
        }}
        renderProps={renderProps}
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            elTag="div"
            elClassName='fc-cell-inner'
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
