import { EventStore, EventUiHash, DateMarker, DateSpan, EventRenderRange, sliceBusinessHours, sliceEventStore, EventInteractionUiState, DateComponent, ComponentContext, Seg, DateRange, intersectRanges, addMs, DateProfile, memoizeRendering } from 'fullcalendar'
import { TimelineDateProfile, normalizeRange, isValidDate } from './timeline-date-profile'
import TimelineLaneEventRenderer from './TimelineLaneEventRenderer'
import TimelineLaneFillRenderer from './TimelineLaneFillRenderer'
import TimeAxis from './TimeAxis'

export interface TimelineLaneSeg extends Seg {
  start: DateMarker
  end: DateMarker
}

export interface TimelineLaneProps {
  dateProfile: DateProfile
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
}

export default class TimelineLane extends DateComponent<TimelineLaneProps> {

  tDateProfile: TimelineDateProfile
  timeAxis: TimeAxis

  private _renderEvents = memoizeRendering(this.renderEvents, this.unrenderEvents)
  private _renderBusinessHours = memoizeRendering(this.renderBusinessHours, this.unrenderBusinessHours)
  private _renderDateSelection = memoizeRendering(this.renderDateSelection, this.unrenderDateSelection)
  private _renderEventDragState = memoizeRendering(this.renderEventDragState, this.unrenderEventDragState)
  private _renderEventResizeState = memoizeRendering(this.renderEventResizeState, this.unrenderEventResizeState)

  constructor(context: ComponentContext, fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super(context, bgContainerEl) // should el be bgContainerEl???

    this.fillRenderer = new TimelineLaneFillRenderer(context, bgContainerEl, timeAxis)
    this.eventRenderer = new TimelineLaneEventRenderer(context, fgContainerEl, timeAxis)
    this.mirrorRenderer = new TimelineLaneEventRenderer(context, fgContainerEl, timeAxis)

    this.timeAxis = timeAxis
  }

  render(props: TimelineLaneProps) {
    this._renderEvents(props.eventStore, props.eventUis)
    this._renderBusinessHours(props.businessHours, props.dateProfile)
    this._renderDateSelection(props.dateSelection)
    this._renderEventDragState(props.eventDrag)
    this._renderEventResizeState(props.eventResize)
  }

  renderEvents(eventStore: EventStore, eventUis: EventUiHash) {
    if (eventStore) {
      this.renderEventSegs(
        eventStoreToSegs(eventStore, eventUis, this.timeAxis)
      )
    }
  }

  renderBusinessHours(businessHours: EventStore, dateProfile: DateProfile) {
    if (businessHours) {
      this.renderBusinessHourSegs(
        eventRangesToSegs(
          sliceBusinessHours(businessHours, dateProfile.activeRange, null, this.calendar),
          this.timeAxis
        )
      )
    }
  }

  renderDateSelection(selection: DateSpan) {
    if (selection) {
      this.renderDateSelectionSegs(
        rangeToSegs(selection.range, this.timeAxis)
      )
    }
  }

  renderEventDragState(state: EventInteractionUiState) {
    if (state) {
      this.renderEventDragSegs(buildSegUiState(state, this.timeAxis))
    }
  }

  unrenderEventDragState(state: EventInteractionUiState) {
    if (state) {
      this.unrenderEventDrag(state.affectedEvents.instances)
    }
  }

  renderEventResizeState(state: EventInteractionUiState) {
    if (state) {
      this.renderEventResizeSegs(buildSegUiState(state, this.timeAxis))
    }
  }

  unrenderEventResizeState(state: EventInteractionUiState) {
    if (state) {
      this.unrenderEventDrag(state.affectedEvents.instances)
    }
  }

  updateSize(viewHeight: number, isAuto: boolean, isResize: boolean) {
    let { fillRenderer, eventRenderer, mirrorRenderer } = this

    fillRenderer.computeSizes(isResize)
    eventRenderer.computeSizes(isResize)
    mirrorRenderer.computeSizes(isResize)

    fillRenderer.assignSizes(isResize)
    eventRenderer.assignSizes(isResize)
    mirrorRenderer.assignSizes(isResize)
  }

}

TimelineLane.prototype.doesDragMirror = true


function eventStoreToSegs(eventStore: EventStore, eventUis: EventUiHash, timeAxis: TimeAxis): TimelineLaneSeg[] {
  return eventRangesToSegs(
    sliceEventStore(eventStore, eventUis, timeAxis.props.dateProfile.activeRange),
    timeAxis
  )
}

function eventRangesToSegs(eventRanges: EventRenderRange[], timeAxis: TimeAxis): TimelineLaneSeg[] {
  let segs = []

  for (let eventRange of eventRanges) {
    segs.push(...eventRangeToSegs(eventRange, timeAxis))
  }

  return segs
}

function eventRangeToSegs(eventRange: EventRenderRange, timeAxis: TimeAxis): TimelineLaneSeg[] {
  let segs = rangeToSegs(eventRange.range, timeAxis)

  for (let seg of segs) {
    seg.eventRange = eventRange
    seg.isStart = seg.isStart && eventRange.isStart
    seg.isEnd = seg.isEnd && eventRange.isEnd
  }

  return segs
}

function rangeToSegs(origRange: DateRange, timeAxis: TimeAxis): TimelineLaneSeg[] {
  let { tDateProfile } = timeAxis
  let dateProfile = timeAxis.props.dateProfile
  let range = normalizeRange(origRange, tDateProfile, timeAxis.dateEnv)
  let segs: TimelineLaneSeg[] = []

  // protect against when the span is entirely in an invalid date region
  if (timeAxis.computeDateSnapCoverage(range.start) < timeAxis.computeDateSnapCoverage(range.end)) {

    // intersect the footprint's range with the grid's range
    range = intersectRanges(range, tDateProfile.normalizedRange)

    if (range) {
      segs.push({
        component: timeAxis.view, // ?
        start: range.start,
        end: range.end,
        isStart: range.start.valueOf() === origRange.start.valueOf() && isValidDate(range.start, tDateProfile, dateProfile, timeAxis.view),
        isEnd: range.end.valueOf() === origRange.end.valueOf() && isValidDate(addMs(range.end, -1), tDateProfile, dateProfile, timeAxis.view)
      })
    }
  }

  return segs
}

function buildSegUiState(state: EventInteractionUiState, timeAxis: TimeAxis) {
  return {
    segs: eventStoreToSegs(state.mutatedEvents, state.eventUis, timeAxis),
    affectedInstances: state.affectedEvents.instances,
    isEvent: state.isEvent,
    sourceSeg: state.origSeg
  }
}
