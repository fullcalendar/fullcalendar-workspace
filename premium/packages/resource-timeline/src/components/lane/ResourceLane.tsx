import { BaseComponent, memoizeObjArg, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
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

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <ContentContainer
        elTag="div"
        elClasses={[
          'fcnew-timeline-lane',
          'fcnew-resource',
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
          <div className="fcnew-timeline-lane-frame">
            <InnerContent
              elTag="div"
              elClasses={['fcnew-timeline-lane-misc']}
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

              // ref
              innerHeightRef={props.innerHeightRef}

              // dimensions
              slotWidth={props.slotWidth}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}
