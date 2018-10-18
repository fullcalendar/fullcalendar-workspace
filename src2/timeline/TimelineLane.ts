import { DateComponent, DateComponentRenderState, RenderForceFlags, Seg, DateRange, intersectRanges, addMs } from 'fullcalendar'
import { TimelineDateProfile, normalizeRange, isValidDate } from './timeline-date-profile'
import TimelineLaneEventRenderer from './TimelineLaneEventRenderer'
import TimelineLaneFillRenderer from './TimelineLaneFillRenderer'
import TimeAxis from './TimeAxis'

export default class TimelineLane extends DateComponent {

  tDateProfile: TimelineDateProfile
  timeAxis: TimeAxis

  setParents(fgContainerEl: HTMLElement, bgContainerEl: HTMLElement, timeAxis: TimeAxis) {
    this.eventRenderer.masterContainerEl = fgContainerEl
    this.fillRenderer.masterContainerEl = bgContainerEl
    this.timeAxis = timeAxis
  }

  render(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    this.slicingType = this.timeAxis.tDateProfile.isTimeScale ? 'timed' : 'all-day'

    super.render(renderState, forceFlags)
  }

  rangeToSegs(origRange: DateRange, allDay: boolean): Seg[] {
    let { timeAxis } = this
    let { tDateProfile } = timeAxis
    let segs: Seg[] = []
    let range = normalizeRange(origRange, tDateProfile, this.getDateEnv())

    // protect against when the span is entirely in an invalid date region
    if (timeAxis.computeDateSnapCoverage(range.start) < timeAxis.computeDateSnapCoverage(range.end)) {

      // intersect the footprint's range with the grid'd range
      range = intersectRanges(range, tDateProfile.normalizedRange)

      if (range) {
        segs.push({
          component: this,
          start: range.start,
          end: range.end,
          isStart: range.start.valueOf() === origRange.start.valueOf() && isValidDate(range.start, tDateProfile, this.dateProfile, this.view),
          isEnd: range.end.valueOf() === origRange.end.valueOf() && isValidDate(addMs(range.end, -1), tDateProfile, this.dateProfile, this.view)
        })
      }
    }

    return segs
  }

}

TimelineLane.prototype.fillRendererClass = TimelineLaneFillRenderer
TimelineLane.prototype.eventRendererClass = TimelineLaneEventRenderer
