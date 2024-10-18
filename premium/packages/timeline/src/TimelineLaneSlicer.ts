import {
  DateRange, intersectRanges, addMs, DateProfile, Slicer,
  DateProfileGenerator, DateEnv, DateMarker,
  CoordRange,
} from '@fullcalendar/core/internal'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile.js'
import { computeDateSnapCoverage } from './TimelineCoords.js'

export interface TimelineRange {
  // the point of this range is because it might be different than seg.eventRange.range
  // because the date might have been rounded to the start of a week or a month
  startDate: DateMarker
  endDate: DateMarker
  isStart: boolean
  isEnd: boolean
}

export type TimelineCoordRange = TimelineRange & CoordRange

export class TimelineLaneSlicer extends Slicer<
  TimelineRange,
  [DateProfile, DateProfileGenerator, TimelineDateProfile, DateEnv]
> {
  sliceRange(
    origRange: DateRange,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): TimelineRange[] {
    let normalRange = normalizeRange(origRange, tDateProfile, dateEnv)
    let segs: TimelineRange[] = []

    // protect against when the span is entirely in an invalid date region
    if (
      computeDateSnapCoverage(normalRange.start, tDateProfile, dateEnv)
      < computeDateSnapCoverage(normalRange.end, tDateProfile, dateEnv)
    ) {
      // intersect the footprint's range with the grid's range
      let slicedRange = intersectRanges(normalRange, tDateProfile.normalizedRange)

      if (slicedRange) {
        segs.push({
          startDate: slicedRange.start,
          endDate: slicedRange.end,
          isStart: slicedRange.start.valueOf() === normalRange.start.valueOf()
            && isValidDate(slicedRange.start, tDateProfile, dateProfile, dateProfileGenerator),
          isEnd: slicedRange.end.valueOf() === normalRange.end.valueOf()
            && isValidDate(addMs(slicedRange.end, -1), tDateProfile, dateProfile, dateProfileGenerator),
        })
      }
    }

    return segs
  }
}
