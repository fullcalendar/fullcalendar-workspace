import { SlotLaneContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, getDateMeta, joinArrayishClassNames, joinClassNames, memoize, setRef, watchHeight } from '@fullcalendar/core/internal'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatLaneProps extends TimeSlatMeta {
  innerHeightRef?: Ref<number>
  borderTop: boolean
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
      isMinor: !props.isLabeled,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          'data-time': props.isoTimeStr,
        }}
        className={joinClassNames(
          'fcu-tight fcu-liquid',
          props.borderTop ? 'fcu-border-only-t' : 'fcu-border-none',
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
              options.slotLaneInnerClassNames,
              'fcu-rigid',
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
