import {
  Duration, EventStore, EventUiHash, DateSpan, EventInteractionState, ComponentContext, Seg,
  DateProfile, DateProfileGenerator, removeElement,
  BaseComponent, SlicedProps, h, CssDimValue
} from '@fullcalendar/core'
import {TimelineDateProfile } from './timeline-date-profile'
import TimelineEvents from './TimelineEvents'
import TimelineCoords from './TimelineCoords'
import TimelineLaneBg from './TimelineLaneBg'
import TimelineLaneSlicer, { TimelineLaneSeg } from './TimelineLaneSlicer'


export interface TimelineLaneProps {
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
  minHeight?: CssDimValue
  height?: CssDimValue
  timelineCoords?: TimelineCoords // TODO: do null instead of undefined?
}


export default class TimelineLane extends BaseComponent<TimelineLaneProps> {

  private slicer = new TimelineLaneSlicer()


  render(props: TimelineLaneProps, state: {}, context: ComponentContext) {
    let { tDateProfile } = props

    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context.calendar,
      props.dateProfile,
      props.dateProfileGenerator,
      tDateProfile,
      context.dateEnv
    )

    return (
      <div class='fc-timeline-lane' style={{ height: props.height, minHeight: props.minHeight }}>
        <TimelineLaneBg
          businessHourSegs={slicedProps.businessHourSegs}
          bgEventSegs={slicedProps.bgEventSegs}
          timelineCoords={props.timelineCoords}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
          eventResizeSegs={
            // HACK. eventRenderer and fillRenderer both use these segs. would compete over seg.el
            // WON'T THIS CAUSE A RERENDER EVERY TIME?
            ((slicedProps.eventResize ? slicedProps.eventResize.segs : []) as TimelineLaneSeg[]).map(function(seg) {
              return { ...seg }
            })
          }
        />
        <TimelineEvents
          tDateProfile={tDateProfile}
          segs={slicedProps.fgEventSegs}
          selectedInstanceId={props.eventSelection /* TODO: rename */}
          hiddenInstances={ // TODO: more convenient
            (slicedProps.eventDrag ? slicedProps.eventDrag.affectedInstances : null) ||
            (slicedProps.eventResize ? slicedProps.eventResize.affectedInstances : null)
          }
          isDragging={false}
          isResizing={false}
          isSelecting={false}
          timelineCoords={props.timelineCoords}
        />
        {this.renderMirror(slicedProps)}
      </div>
    )
  }


  renderMirror(slicedProps: SlicedProps<TimelineLaneSeg>) {
    if (slicedProps.eventDrag) {
      return (
        <TimelineEvents
          tDateProfile={this.props.tDateProfile}
          segs={slicedProps.eventDrag.segs}
          isDragging={true}
          isResizing={false}
          isSelecting={false}
          interactingSeg={slicedProps.eventDrag.interactingSeg}
          timelineCoords={this.props.timelineCoords}
        />
      )
    } else if (slicedProps.eventResize) {
      return (
        <TimelineEvents
          tDateProfile={this.props.tDateProfile}
          segs={slicedProps.eventResize.segs}
          isDragging={true}
          isResizing={false}
          isSelecting={false}
          interactingSeg={slicedProps.eventResize.interactingSeg}
          timelineCoords={this.props.timelineCoords}
        />
      )
    }
  }

}


export function attachSegs({ segs, containerEl }: { segs: Seg[], containerEl: HTMLElement }) {
  for (let seg of segs) {
    containerEl.appendChild(seg.el)
  }

  return segs
}


export function detachSegs(segs: Seg[]) {
  for (let seg of segs) {
    removeElement(seg.el)
  }
}
