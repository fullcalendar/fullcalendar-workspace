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
        elClasses={[
          // TODO: have lane classNames like 'fcnew-timegrid-lane'/'fcnew-timegrid-slot-lane'/'fcnew-timegrid-slat-lane'
          'fcnew-cell',
          'fcnew-liquid',
        ]}
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
          <div ref={this.innerElRef} className='fcnew-flex-column'>
            <InnerContent elTag="div" elClasses={['fcnew-cell-inner']} />
          </div>
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
  }
}
