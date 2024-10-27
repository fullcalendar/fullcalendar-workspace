import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineLane, TimelineLaneProps } from '@fullcalendar/timeline/internal'

export interface ResourceLaneProps extends TimelineLaneProps {
  resource: Resource
  slotWidth: number | undefined

  // refs
  innerHeightRef?: Ref<number>
}

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private innerElRef = createRef<HTMLDivElement>()
  private unwatchHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <ContentContainer
        tag="div"
        className='fc-timeline-lane fc-resource'
        attrs={{
          'data-resource-id': props.resource.id,
        }}
        renderProps={renderProps}
        generatorName="resourceLaneContent"
        customGenerator={options.resourceLaneContent}
        classNameGenerator={options.resourceLaneClassNames}
        didMount={options.resourceLaneDidMount}
        willUnmount={options.resourceLaneWillUnmount}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className='fc-flex-column'>
            <InnerContent
              tag="div"
              className='fc-timeline-lane-misc'
            />
            <TimelineLane
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              nextDayThreshold={props.nextDayThreshold}
              businessHours={props.businessHours}
              eventStore={props.eventStore}
              eventUiBases={props.eventUiBases}
              dateSelection={props.dateSelection}
              eventSelection={props.eventSelection}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              resourceId={props.resource.id}

              // dimensions
              slotWidth={props.slotWidth}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this.unwatchHeight = watchHeight(this.innerElRef.current, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.unwatchHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
