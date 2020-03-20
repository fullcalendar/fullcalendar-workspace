import { h, Ref, BaseComponent, CssDimValue, RenderHook, ComponentContext } from '@fullcalendar/core'
import { Resource, ResourceApi } from '@fullcalendar/resource-common'
import { TimelineLane, TimelineLaneProps } from '@fullcalendar/timeline'


export interface ResourceTimelineLaneProps extends TimelineLaneProps {
  elRef: Ref<HTMLTableRowElement>
  resource: Resource
  innerHeight: CssDimValue
  onHeightFlush?: () => void
}


export default class ResourceTimelineLane extends BaseComponent<ResourceTimelineLaneProps> {

  render(props: ResourceTimelineLaneProps, state: {}, context: ComponentContext) {
    let innerProps = {
      resource: new ResourceApi(context.calendar, props.resource)
    }

    return (
      <tr ref={props.elRef} class='fc-scrollgrid-row'>
        <RenderHook name='resourceLane' mountProps={innerProps} dynamicProps={innerProps}>
          {(rootElRef, customClassNames, innerElRef, innerContent) => (
            <td ref={rootElRef} className={[ 'fc-timeline-resource' ].concat(customClassNames).join(' ')} data-resource-id={props.resource.id}>
              <div class='fc-timeline-resource-inner' style={{ height: props.innerHeight }}>
                {innerContent && // TODO: test
                  <div class='fc-timeline-resource-misc' ref={innerElRef}>{innerContent}</div>
                }
                <TimelineLane
                  dateProfile={props.dateProfile}
                  dateProfileGenerator={props.dateProfileGenerator}
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
                  onHeightFlush={props.onHeightFlush}
                />
              </div>
            </td>
          )}
        </RenderHook>
      </tr>
    ) // important NOT to do vgrow. dont want to shrink height smaller than content
  }

}
