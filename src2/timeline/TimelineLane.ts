import { StandardDateComponent, StandardDateComponentProps, ComponentContext, Seg, DateRange, intersectRanges, addMs } from 'fullcalendar'
import { TimelineDateProfile, normalizeRange, isValidDate } from './timeline-date-profile'
import TimelineLaneEventRenderer from './TimelineLaneEventRenderer'
import TimelineLaneFillRenderer from './TimelineLaneFillRenderer'
import TimeAxis from './TimeAxis'

export default class TimelineLane extends StandardDateComponent {

  tDateProfile: TimelineDateProfile
  timeAxis: TimeAxis

  constructor(context: ComponentContext, fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super(context, bgContainerEl)

    this.fillRenderer = new TimelineLaneFillRenderer(context, bgContainerEl, timeAxis)
    this.eventRenderer = new TimelineLaneEventRenderer(context, fgContainerEl, timeAxis)
    this.timeAxis = timeAxis
  }

  render(renderState: StandardDateComponentProps) {
    this.slicingType = this.timeAxis.tDateProfile.isTimeScale ? 'timed' : 'all-day'

    super.render(renderState)
  }

  rangeToSegs(origRange: DateRange, allDay: boolean): Seg[] {
    let { timeAxis } = this
    let { tDateProfile } = timeAxis
    let dateProfile = this.props.dateProfile
    let segs: Seg[] = []
    let range = normalizeRange(origRange, tDateProfile, this.dateEnv)

    // protect against when the span is entirely in an invalid date region
    if (timeAxis.computeDateSnapCoverage(range.start) < timeAxis.computeDateSnapCoverage(range.end)) {

      // intersect the footprint's range with the grid'd range
      range = intersectRanges(range, tDateProfile.normalizedRange)

      if (range) {
        segs.push({
          component: this,
          start: range.start,
          end: range.end,
          isStart: range.start.valueOf() === origRange.start.valueOf() && isValidDate(range.start, tDateProfile, dateProfile, this.view),
          isEnd: range.end.valueOf() === origRange.end.valueOf() && isValidDate(addMs(range.end, -1), tDateProfile, dateProfile, this.view)
        })
      }
    }

    return segs
  }

}
