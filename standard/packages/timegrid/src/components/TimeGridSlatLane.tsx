import { SlotLaneContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, getDateMeta, joinArrayishClassNames, joinClassNames, memoize, setRef, watchHeight } from '@fullcalendar/core/internal'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatLaneProps extends TimeSlatMeta {
  innerHeightRef?: Ref<number>
  borderStart?: boolean
}

export class TimeGridSlatLane extends BaseComponent<TimeGridSlatLaneProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps: SlotLaneContentArg = {
      // this is a time-specific slot. not day-specific, so don't do today/nowRange
      ...this.getDateMeta(props.date, context.dateEnv),

      time: props.time,
      isMajor: false,
      isMinor: false, // TODO!!!
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        // TODO: have lane classNames like 'fc-timegrid-lane'/'fc-timegrid-slot-lane'
        className={joinClassNames(
          'fc-timegrid-slot-lane fc-cell fc-liquid',
          'fc-cell-bordered', // TODO: temporary
          props.borderStart ? 'fc-border-only-s' : 'fc-border-none',
        )}
        renderProps={renderProps}
        generatorName="slotLaneContent"
        customGenerator={options.slotLaneContent}
        classNameGenerator={options.slotLaneClassNames}
        didMount={options.slotLaneDidMount}
        willUnmount={options.slotLaneWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className={joinArrayishClassNames(
              'fc-cell-inner',
              options.slotLaneInnerClassNames,
            )}
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
