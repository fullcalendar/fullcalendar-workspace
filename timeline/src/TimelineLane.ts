import { Duration, EventStore, EventUiHash, DateMarker, DateSpan, MemoizedRendering, EventInteractionState, EventSegUiInteractionState, DateComponent, ComponentContext, Seg, DateRange, intersectRanges, addMs, DateProfile, memoizeRendering, Slicer } from '@fullcalendar/core'
import { normalizeRange, isValidDate } from './timeline-date-profile'
import TimelineLaneEventRenderer from './TimelineLaneEventRenderer'
import TimelineLaneFillRenderer from './TimelineLaneFillRenderer'
import TimeAxis from './TimeAxis'

export interface TimelineLaneSeg extends Seg {
  start: DateMarker
  end: DateMarker
}

export interface TimelineLaneProps {
  dateProfile: DateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

export default class TimelineLane extends DateComponent<TimelineLaneProps> {

  timeAxis: TimeAxis

  private slicer = new TimelineLaneSlicer()
  private renderBusinessHours: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderDateSelection: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderBgEvents: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderFgEvents: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderEventSelection: MemoizedRendering<[string]>
  private renderEventDrag = memoizeRendering(this._renderEventDrag, this._unrenderEventDrag)
  private renderEventResize = memoizeRendering(this._renderEventResize, this._unrenderEventResize)


  constructor(context: ComponentContext, fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super(context, bgContainerEl) // should el be bgContainerEl???

    let fillRenderer = this.fillRenderer = new TimelineLaneFillRenderer(context, bgContainerEl, timeAxis)
    let eventRenderer = this.eventRenderer = new TimelineLaneEventRenderer(context, fgContainerEl, timeAxis)
    this.mirrorRenderer = new TimelineLaneEventRenderer(context, fgContainerEl, timeAxis)

    this.renderBusinessHours = memoizeRendering(
      fillRenderer.renderSegs.bind(fillRenderer, 'businessHours'),
      fillRenderer.unrender.bind(fillRenderer, 'businessHours')
    )

    this.renderDateSelection = memoizeRendering(
      fillRenderer.renderSegs.bind(fillRenderer, 'highlight'),
      fillRenderer.unrender.bind(fillRenderer, 'highlight')
    )

    this.renderBgEvents = memoizeRendering(
      fillRenderer.renderSegs.bind(fillRenderer, 'bgEvent'),
      fillRenderer.unrender.bind(fillRenderer, 'bgEvent')
    )

    this.renderFgEvents = memoizeRendering(
      eventRenderer.renderSegs.bind(eventRenderer),
      eventRenderer.unrender.bind(eventRenderer)
    )

    this.renderEventSelection = memoizeRendering(
      eventRenderer.selectByInstanceId.bind(eventRenderer),
      eventRenderer.unselectByInstanceId.bind(eventRenderer),
      [ this.renderFgEvents ]
    )

    this.timeAxis = timeAxis
  }

  render(props: TimelineLaneProps) {
    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      this.timeAxis.tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      this,
      this.timeAxis
    )

    this.renderBusinessHours(slicedProps.businessHourSegs)
    this.renderDateSelection(slicedProps.dateSelectionSegs)
    this.renderBgEvents(slicedProps.bgEventSegs)
    this.renderFgEvents(slicedProps.fgEventSegs)
    this.renderEventSelection(slicedProps.eventSelection)
    this.renderEventDrag(slicedProps.eventDrag)
    this.renderEventResize(slicedProps.eventResize)
  }

  destroy() {
    super.destroy()

    this.renderBusinessHours.unrender()
    this.renderDateSelection.unrender()
    this.renderBgEvents.unrender()
    this.renderFgEvents.unrender()
    this.renderEventSelection.unrender()
    this.renderEventDrag.unrender()
    this.renderEventResize.unrender()
  }

  _renderEventDrag(state: EventSegUiInteractionState) {
    if (state) {
      this.eventRenderer.hideByHash(state.affectedInstances)
      this.mirrorRenderer.renderSegs(state.segs, { isDragging: true, sourceSeg: state.sourceSeg })
    }
  }

  _unrenderEventDrag(state: EventSegUiInteractionState) {
    if (state) {
      this.eventRenderer.showByHash(state.affectedInstances)
      this.mirrorRenderer.unrender(state.segs, { isDragging: true, sourceSeg: state.sourceSeg })
    }
  }

  _renderEventResize(state: EventSegUiInteractionState) {
    if (state) {
      // HACK. eventRenderer and fillRenderer both use these segs. would compete over seg.el
      let segsForHighlight = state.segs.map(function(seg) {
        return { ...seg }
      })

      this.eventRenderer.hideByHash(state.affectedInstances)
      this.fillRenderer.renderSegs('highlight', segsForHighlight)
      this.mirrorRenderer.renderSegs(state.segs, { isDragging: true, sourceSeg: state.sourceSeg })
    }
  }

  _unrenderEventResize(state: EventSegUiInteractionState) {
    if (state) {
      this.eventRenderer.showByHash(state.affectedInstances)
      this.fillRenderer.unrender('highlight')
      this.mirrorRenderer.unrender(state.segs, { isDragging: true, sourceSeg: state.sourceSeg })
    }
  }

  updateSize(isResize: boolean) {
    let { fillRenderer, eventRenderer, mirrorRenderer } = this

    fillRenderer.computeSizes(isResize)
    eventRenderer.computeSizes(isResize)
    mirrorRenderer.computeSizes(isResize)

    fillRenderer.assignSizes(isResize)
    eventRenderer.assignSizes(isResize)
    mirrorRenderer.assignSizes(isResize)
  }

}

class TimelineLaneSlicer extends Slicer<TimelineLaneSeg, [TimeAxis]> {

  sliceRange(origRange: DateRange, timeAxis: TimeAxis): TimelineLaneSeg[] {
    let { tDateProfile } = timeAxis
    let dateProfile = timeAxis.props.dateProfile
    let normalRange = normalizeRange(origRange, tDateProfile, timeAxis.dateEnv)
    let segs: TimelineLaneSeg[] = []

    // protect against when the span is entirely in an invalid date region
    if (timeAxis.computeDateSnapCoverage(normalRange.start) < timeAxis.computeDateSnapCoverage(normalRange.end)) {

      // intersect the footprint's range with the grid's range
      let slicedRange = intersectRanges(normalRange, tDateProfile.normalizedRange)

      if (slicedRange) {
        segs.push({
          start: slicedRange.start,
          end: slicedRange.end,
          isStart: slicedRange.start.valueOf() === normalRange.start.valueOf() && isValidDate(slicedRange.start, tDateProfile, dateProfile, timeAxis.view),
          isEnd: slicedRange.end.valueOf() === normalRange.end.valueOf() && isValidDate(addMs(slicedRange.end, -1), tDateProfile, dateProfile, timeAxis.view)
        })
      }
    }

    return segs
  }

}
