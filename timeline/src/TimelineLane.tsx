import {
  Duration, EventStore, EventUiHash, DateMarker, DateSpan, EventInteractionState, ComponentContext, Seg, DateRange,
  intersectRanges, addMs, DateProfile, Slicer, DateProfileGenerator, DateEnv, removeElement,
  BaseComponent, SlicedProps, h, CssDimValue
} from '@fullcalendar/core'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile'
import { computeDateSnapCoverage } from './TimelineCoords'
import TimelineEvents from './TimelineEvents'
import TimelineFills from './TimelineFills'
import TimelineCoords from './TimelineCoords'


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
  timelineCoords?: TimelineCoords // TODO: do null instead of undefined?
  minHeight?: CssDimValue
}

export interface TimelineLaneSeg extends Seg {
  start: DateMarker
  end: DateMarker
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
      <div class='fc-timeline-lane' style={{ minHeight: props.minHeight }}>
        <TimelineFills
          type='businessHours'
          segs={slicedProps.businessHourSegs}
          timelineCoords={props.timelineCoords}
        />
        <TimelineFills
          type='bgEvent'
          segs={slicedProps.bgEventSegs}
          timelineCoords={props.timelineCoords}
        />
        {this.renderHighlight(slicedProps)}
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


  renderHighlight(slicedProps: SlicedProps<TimelineLaneSeg>) {
    if (slicedProps.eventResize) {
      return (
        <TimelineFills
          type='highlight'
          segs={slicedProps.eventResize.segs.map(function(seg) { // HACK. eventRenderer and fillRenderer both use these segs. would compete over seg.el
            return { ...seg }
          })}
          timelineCoords={this.props.timelineCoords}
        />
      )
    } else {
      return (
        <TimelineFills
          type='highlight'
          segs={slicedProps.dateSelectionSegs}
          timelineCoords={this.props.timelineCoords}
        />
      )
    }
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


class TimelineLaneSlicer extends Slicer<TimelineLaneSeg, [DateProfile, DateProfileGenerator, TimelineDateProfile, DateEnv]> {

  sliceRange(
    origRange: DateRange,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv
  ): TimelineLaneSeg[] {
    let normalRange = normalizeRange(origRange, tDateProfile, dateEnv)
    let segs: TimelineLaneSeg[] = []

    // protect against when the span is entirely in an invalid date region
    if (computeDateSnapCoverage(normalRange.start, tDateProfile, dateEnv) < computeDateSnapCoverage(normalRange.end, tDateProfile, dateEnv)) {

      // intersect the footprint's range with the grid's range
      let slicedRange = intersectRanges(normalRange, tDateProfile.normalizedRange)

      if (slicedRange) {
        segs.push({
          start: slicedRange.start,
          end: slicedRange.end,
          isStart: slicedRange.start.valueOf() === normalRange.start.valueOf() && isValidDate(slicedRange.start, tDateProfile, dateProfile, dateProfileGenerator),
          isEnd: slicedRange.end.valueOf() === normalRange.end.valueOf() && isValidDate(addMs(slicedRange.end, -1), tDateProfile, dateProfile, dateProfileGenerator)
        })
      }
    }

    return segs
  }

}
