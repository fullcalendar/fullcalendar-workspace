import { DateComponent, DateComponentRenderState, RenderForceFlags, Seg, DateRange, intersectRanges, addMs, createElement } from 'fullcalendar'
import { TimelineDateProfile, normalizeRange, isValidDate } from './timeline-date-profile'
import TimelineView from './TimelineView'
import TimelineLaneEventRenderer from './TimelineLaneEventRenderer'

export default class TimelineLane extends DateComponent {

  tDateProfile: TimelineDateProfile

  el = createElement('div', { className: 'fc-event-container' })

  render(renderState: DateComponentRenderState, forceFlags: RenderForceFlags) {
    this.tDateProfile = (renderState as any).tDateProfile as TimelineDateProfile
    this.slicingType = this.tDateProfile.isTimeScale ? 'timed' : 'all-day'
    super.render(renderState, forceFlags)
  }

  rangeToSegs(origRange: DateRange, allDay: boolean): Seg[] {
    let { tDateProfile } = this
    let segs: Seg[] = []
    let view = this.view as TimelineView // BAD!
    let range = normalizeRange(origRange, tDateProfile, this.getDateEnv())

    // protect against when the span is entirely in an invalid date region
    if (view.computeDateSnapCoverage(range.start) < view.computeDateSnapCoverage(range.end)) {

      // intersect the footprint's range with the grid'd range
      range = intersectRanges(range, tDateProfile.normalizedRange)

      if (range) {
        segs.push({
          component: this,
          start: range.start,
          end: range.end,
          isStart: range.start.valueOf() === origRange.start.valueOf() && isValidDate(range.start, tDateProfile, this.dateProfile, view),
          isEnd: range.end.valueOf() === origRange.end.valueOf() && isValidDate(addMs(range.end, -1), tDateProfile, this.dateProfile, view)
        })
      }
    }

    return segs
  }

}

TimelineLane.prototype.eventRendererClass = TimelineLaneEventRenderer
// TODO: fill rendering
