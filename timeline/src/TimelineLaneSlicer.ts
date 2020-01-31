import { DateRange, intersectRanges, addMs, DateProfile, Slicer, DateProfileGenerator, DateEnv, DateMarker, Seg } from '@fullcalendar/core'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile'
import { computeDateSnapCoverage } from './TimelineCoords'


export interface TimelineLaneSeg extends Seg {
  start: DateMarker
  end: DateMarker
}


export default class TimelineLaneSlicer extends Slicer<TimelineLaneSeg, [DateProfile, DateProfileGenerator, TimelineDateProfile, DateEnv]> {

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
