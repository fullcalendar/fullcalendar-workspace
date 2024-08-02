import { SlotLaneContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'
import { TimeSlatMeta } from '../time-slat-meta.js'

export interface TimeGridSlatCellProps extends TimeSlatMeta {
  innerHeightRef?: Ref<number>
}

export class TimeGridSlatCell extends BaseComponent<TimeGridSlatCellProps> {
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
          'fcnew-cell',
          'fcnew-timegrid-slot', // TODO: investigate if we can remove
          props.isLabeled ? '' : 'fcnew-timegrid-slot-minor',
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
          <div ref={this.innerElRef}>
            <InnerContent
              elTag="div"
              elClasses={['fcnew-timegrid-slot-lane-cushion']}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect
    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
  }
}
