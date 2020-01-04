import {
  h, createRef,
  BaseComponent, ComponentContext, subrenderer, DateProfile, DateProfileGenerator, Duration, EventStore, EventUiHash, DateSpan, EventInteractionState
} from '@fullcalendar/core'
import { TimelineLane, TimelineDateProfile, TimelineSlats } from '@fullcalendar/timeline'


export interface ResourceTimelineLaneRowProps {
  resourceId: string
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  tDateProfile: TimelineDateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

export default class ResourceTimelineLaneRow extends BaseComponent<ResourceTimelineLaneRowProps> {

  private renderLane = subrenderer(TimelineLane)
  private lane: TimelineLane
  private innerElRef = createRef<HTMLDivElement>()


  render(props: ResourceTimelineLaneRowProps, state: {}, context: ComponentContext) {
    return (
      <tr data-resource-id={props.resourceId}>
        <td class={context.theme.getClass('tableCellNormal')}>
          <div ref={this.innerElRef} />
        </td>
      </tr>
    )
  }


  componentDidMount() {
    this.subrender()
  }


  componentDidUpdate() {
    this.subrender()
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  subrender() {
    let innerEl = this.innerElRef.current

    this.lane = this.renderLane({
      ...this.props, // TODO: doesn't need resourceId!!!
      fgContainerEl: innerEl,
      bgContainerEl: innerEl
    })
  }


  computeSizes(isResize: boolean, slats: TimelineSlats) {
    this.lane.computeSizes(isResize, slats)
  }


  assignSizes(isResize: boolean, slats: TimelineSlats) {
    this.lane.assignSizes(isResize, slats)
  }

}
