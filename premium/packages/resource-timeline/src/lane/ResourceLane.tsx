import { BaseComponent, memoizeObjArg, ContentContainer } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineLane, TimelineLaneProps } from '@fullcalendar/timeline/internal'

export interface ResourceLaneProps extends TimelineLaneProps {
  resource: Resource
  onHeightStable?: (isStable: boolean) => void
}

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <ContentContainer
        elTag="div"
        elClasses={[
          'fc-timeline-lane',
          'fc-resource',
        ]}
        elAttrs={{
          'data-resource-id': props.resource.id,
        }}
        renderProps={renderProps}
        generatorName="resourceLaneContent"
        customGenerator={options.resourceLaneContent}
        classNameGenerator={options.resourceLaneClassNames}
        didMount={options.resourceLaneDidMount}
        willUnmount={options.resourceLaneWillUnmount}
      >
        {(InnerContent) => ( // TODO: apply top-coordinate
          <div className="fc-timeline-lane-frame">
            <InnerContent
              elTag="div"
              elClasses={['fc-timeline-lane-misc']}
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
              timelineCoords={props.timelineCoords}
              resourceId={props.resource.id}
              onHeightStable={props.onHeightStable}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}
