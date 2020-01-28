import { Duration, EventStore, EventUiHash, DateMarker, DateSpan, EventInteractionState, SubRenderer, ComponentContext, Seg, DateRange, intersectRanges, addMs, DateProfile, Slicer, DateProfileGenerator, DateEnv, removeElement, subrenderer } from '@fullcalendar/core'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile'
import TimelineLaneEvents from './TimelineLaneEvents'
import TimelineLaneFills from './TimelineLaneFills'
import TimelineCoords from './TimelineCoords'
import { computeDateSnapCoverage } from './TimelineCoords'

export interface TimelineLaneSeg extends Seg {
  start: DateMarker
  end: DateMarker
}

export interface TimelineLaneProps {
  fgContainerEl: HTMLElement | null // there might not be an fc container
  bgContainerEl: HTMLElement
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

export default class TimelineLane extends SubRenderer<TimelineLaneProps> {

  private renderFgEvents = subrenderer(TimelineLaneEvents)
  private renderMirror = subrenderer(TimelineLaneEvents)
  private renderBgEvents = subrenderer(TimelineLaneFills)
  private renderHighlight = subrenderer(TimelineLaneFills)
  private renderBusinessHours = subrenderer(TimelineLaneFills)

  private segRenderers: (TimelineLaneFills | TimelineLaneEvents)[] = []
  private slicer = new TimelineLaneSlicer()


  render(props: TimelineLaneProps, context: ComponentContext) {
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

    let segRenderers: (TimelineLaneFills | TimelineLaneEvents)[] = []

    // ordering matters? for z-index?

    segRenderers.push(
      this.renderBusinessHours({
        containerParentEl: props.bgContainerEl,
        type: 'businessHours',
        segs: slicedProps.businessHourSegs
      })
    )

    if (slicedProps.eventResize) {
      segRenderers.push(
        this.renderHighlight({
          containerParentEl: props.bgContainerEl,
          type: 'highlight',
          // HACK. eventRenderer and fillRenderer both use these segs. would compete over seg.el
          segs: slicedProps.eventResize.segs.map(function(seg) {
            return { ...seg }
          })
        })
      )

    } else {
      segRenderers.push(
        this.renderHighlight({
          containerParentEl: props.bgContainerEl,
          type: 'highlight',
          segs: slicedProps.dateSelectionSegs
        })
      )
    }

    segRenderers.push(
      this.renderBgEvents({
        containerParentEl: props.bgContainerEl,
        type: 'bgEvent',
        segs: slicedProps.bgEventSegs
      })
    )

    if (props.fgContainerEl) {
      segRenderers.push(
        this.renderFgEvents({
          containerParentEl: props.fgContainerEl,
          tDateProfile,
          segs: slicedProps.fgEventSegs,
          selectedInstanceId: props.eventSelection, // TODO: rename
          hiddenInstances: // TODO: more convenient
            (slicedProps.eventDrag ? slicedProps.eventDrag.affectedInstances : null) ||
            (slicedProps.eventResize ? slicedProps.eventResize.affectedInstances : null),
          isDragging: false,
          isResizing: false,
          isSelecting: false
        })
      )
    } else {
      this.renderFgEvents(false)
    }

    if (slicedProps.eventDrag && props.fgContainerEl) {
      segRenderers.push(
        this.renderMirror({
          containerParentEl: props.fgContainerEl,
          tDateProfile,
          segs: slicedProps.eventDrag.segs,
          isDragging: true,
          isResizing: false,
          isSelecting: false,
          interactingSeg: slicedProps.eventDrag.interactingSeg
        })
      )

    } else if (slicedProps.eventResize && props.fgContainerEl) {
      segRenderers.push(
        this.renderMirror({
          containerParentEl: props.fgContainerEl,
          tDateProfile,
          segs: slicedProps.eventResize.segs,
          isDragging: true,
          isResizing: false,
          isSelecting: false,
          interactingSeg: slicedProps.eventResize.interactingSeg
        })
      )

    } else {
      this.renderMirror(false)
    }

    this.segRenderers = segRenderers
  }


  computeSizes(isResize: boolean, slats: TimelineCoords) {
    for (let segRenderer of this.segRenderers) {
      segRenderer.computeSizes(isResize, slats)
    }
  }


  assignSizes(isResize: boolean, slats: TimelineCoords) {
    for (let segRenderer of this.segRenderers) {
      segRenderer.assignSizes(isResize, slats)
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
