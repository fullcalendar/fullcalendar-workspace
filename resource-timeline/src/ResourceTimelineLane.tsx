import { h, Ref, BaseComponent, CssDimValue } from '@fullcalendar/core'
import { TimelineLane, TimelineLaneProps } from '@fullcalendar/timeline'


export interface ResourceTimelineLaneProps extends TimelineLaneProps {
  elRef: Ref<HTMLTableRowElement>
  resourceId: string
  innerHeight: CssDimValue
}


export default class ResourceTimelineLane extends BaseComponent<ResourceTimelineLaneProps> {


  render(props: ResourceTimelineLaneProps) {
    return (
      <tr ref={props.elRef} data-resource-id={props.resourceId}>
        <td>
          <div style={{ height: props.innerHeight }}>
            <TimelineLane
              dateProfile={props.dateProfile}
              dateProfileGenerator={props.dateProfileGenerator}
              tDateProfile={props.tDateProfile}
              nextDayThreshold={props.nextDayThreshold}
              businessHours={props.businessHours}
              eventStore={props.eventStore}
              eventUiBases={props.eventUiBases}
              dateSelection={props.dateSelection}
              eventSelection={props.eventSelection}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              timelineCoords={props.timelineCoords}
            />
          </div>
        </td>
      </tr>
    )
  }

}
