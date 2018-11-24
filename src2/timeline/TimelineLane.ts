import { EventStore, EventUiHash, DateMarker, DateSpan, MemoizedRendering, EventInteractionUiState, EventSegUiInteractionState, DateComponent, ComponentContext, Seg, DateRange, intersectRanges, addMs, DateProfile, memoizeRendering, Slicer, assignTo } from 'fullcalendar'
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

  private slicer = new Slicer(rangeToSegs)
  private renderBusinessHours: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderDateSelection: MemoizedRendering<[TimelineLaneSeg[]]>
  private renderEvents = memoizeRendering(this._renderEventSegs, this._unrenderEventSegs)
  private renderEventSelection: MemoizedRendering<[string]>
  private renderEventDrag = memoizeRendering(this._renderEventDrag, this._unrenderEventDrag)
  private renderEventResize = memoizeRendering(this._renderEventResize, this._unrenderEventResize)


  constructor(context: ComponentContext, fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super(context, bgContainerEl) // should el be bgContainerEl???

    this.slicer.component = this.view // ? (just like below)

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

    this.renderEventSelection = memoizeRendering(
      eventRenderer.selectByInstanceId.bind(eventRenderer),
      eventRenderer.unselectByInstanceId.bind(eventRenderer),
      [ this.renderEvents ]
    )

    this.timeAxis = timeAxis
  }

  render(props: TimelineLaneProps) {
    let { slicer, timeAxis } = this
    let { dateProfile } = props

    this.renderEvents(slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, null, timeAxis))
    this.renderEventSelection(props.eventSelection)
    this.renderBusinessHours(slicer.businessHoursToSegs(props.businessHours, dateProfile, null, timeAxis))
    this.renderDateSelection(slicer.selectionToSegs(props.dateSelection, timeAxis))
    this.renderEventDrag(slicer.buildEventDrag(props.eventDrag, dateProfile, null, timeAxis))
    this.renderEventResize(slicer.buildEventResize(props.eventResize, dateProfile, null, timeAxis))
  }

  destroy() {
    super.destroy()

    this.renderEvents.unrender()
    this.renderEventSelection.unrender()
    this.renderBusinessHours.unrender()
    this.renderDateSelection.unrender()
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
      this.mirrorRenderer.unrender()
    }
  }

  _renderEventResize(state: EventSegUiInteractionState) {
    if (state) {
      // HACK. eventRenderer and fillRenderer both use these segs. would compete over seg.el
      let segsForHighlight = state.segs.map(function(seg) {
        return assignTo({}, seg)
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
      this.mirrorRenderer.unrender()
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
