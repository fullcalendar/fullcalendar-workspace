import {
  DateRange, intersectRanges, addMs, DateProfile, Slicer,
  DateProfileGenerator, DateEnv, DateMarker, DateSpan,
  CoordRange,
  getDateSpanInstantStartMs, getDateSpanInstantEndMs,
} from '@fullcalendar/preact/protected-api'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile'
import { getTimelineAxisStartMs, getTimelineAxisEndMs } from './timeline-time-axis'
import { computeDateSnapCoverage, computeMsSlotCoverage } from './TimelineCoords'

export interface TimelineRange {
  // the point of this range is because it might be different than seg.eventRange.range
  // because the date might have been rounded to the start of a week or a month
  startDate: DateMarker
  endDate: DateMarker
  // Exact instants. Populated for ALL segs on timed axes (derived from the markers when the
  // source doesn't carry instants). Absent on whole-day axes.
  startMs?: number
  endMs?: number
  isStart: boolean
  isEnd: boolean
}

export type TimelineCoordRange = TimelineRange & CoordRange

/*
Timed axes (tDateProfile.timeAxis) slice in instant (epoch-ms) space so DST gaps/folds
position correctly. Whole-day axes slice in civil-marker space.
*/
export class TimelineLaneSlicer extends Slicer<
  TimelineRange,
  [DateProfile, DateProfileGenerator, TimelineDateProfile, DateEnv]
> {
  protected intersectDateSpan(
    dateSpan: DateSpan,
    activeRange: DateRange,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): DateSpan | null {
    if (!tDateProfile.timeAxis) {
      return super.intersectDateSpan(dateSpan, activeRange, dateProfile, dateProfileGenerator, tDateProfile, dateEnv)
    }

    const startMs = Math.max(
      getDateSpanInstantStartMs(dateSpan, dateEnv),
      dateEnv.toDate(activeRange.start).valueOf(),
    )
    const endMs = Math.min(
      getDateSpanInstantEndMs(dateSpan, dateEnv),
      dateEnv.toDate(activeRange.end).valueOf(),
    )

    if (startMs < endMs) {
      return {
        ...dateSpan,
        range: {
          start: dateEnv.timestampToMarker(startMs),
          end: dateEnv.timestampToMarker(endMs),
        },
        instantStartMs: startMs,
        instantEndMs: endMs,
      }
    }

    return null
  }

  protected sliceDateSpan(
    dateSpan: DateSpan,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): TimelineRange[] {
    if (!tDateProfile.timeAxis) {
      return super.sliceDateSpan(dateSpan, dateProfile, dateProfileGenerator, tDateProfile, dateEnv)
    }

    return sliceInstantSpan(
      getDateSpanInstantStartMs(dateSpan, dateEnv),
      getDateSpanInstantEndMs(dateSpan, dateEnv),
      dateProfile,
      dateProfileGenerator,
      tDateProfile,
      dateEnv,
    )
  }

  sliceRange(
    origRange: DateRange,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): TimelineRange[] {
    if (tDateProfile.timeAxis) {
      return sliceInstantSpan(
        dateEnv.toDate(origRange.start).valueOf(),
        dateEnv.toDate(origRange.end).valueOf(),
        dateProfile,
        dateProfileGenerator,
        tDateProfile,
        dateEnv,
      )
    }

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

function sliceInstantSpan(
  origStartMs: number,
  origEndMs: number,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  tDateProfile: TimelineDateProfile,
  dateEnv: DateEnv,
): TimelineRange[] {
  const axisStartMs = getTimelineAxisStartMs(tDateProfile.timeAxis)
  const axisEndMs = getTimelineAxisEndMs(tDateProfile.timeAxis)

  if (axisStartMs == null) { // axis has no visible slots
    return []
  }

  // intersect the footprint's range with the grid's range
  const startMs = Math.max(origStartMs, axisStartMs)
  const endMs = Math.min(origEndMs, axisEndMs)

  if (
    startMs < endMs &&
    // protect against when the span is entirely in an invalid date region
    computeMsSlotCoverage(startMs, tDateProfile) < computeMsSlotCoverage(endMs, tDateProfile)
  ) {
    const startDate = dateEnv.timestampToMarker(startMs)
    const endDate = dateEnv.timestampToMarker(endMs)

    return [{
      startDate,
      endDate,
      startMs,
      endMs,
      isStart: startMs === origStartMs
        && isValidDate(startDate, tDateProfile, dateProfile, dateProfileGenerator),
      isEnd: endMs === origEndMs
        && isValidDate(dateEnv.timestampToMarker(endMs - 1), tDateProfile, dateProfile, dateProfileGenerator),
    }]
  }

  return []
}
