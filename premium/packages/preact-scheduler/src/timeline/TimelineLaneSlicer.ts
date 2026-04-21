import {
  DateRange, intersectRanges, addMs, DateProfile, Slicer,
  DateProfileGenerator, DateEnv, DateMarker, DateSpan,
  CoordRange,
} from '@fullcalendar/preact/protected-api'
import { normalizeRange, isValidDate, TimelineDateProfile } from './timeline-date-profile'
import { computeDateSnapCoverage, computeDateSnapCoverageFromMs } from './TimelineCoords'

export interface TimelineRange {
  // the point of this range is because it might be different than seg.eventRange.range
  // because the date might have been rounded to the start of a week or a month
  startDate: DateMarker
  endDate: DateMarker
  // Actual instants for timed selections/hits. Needed when repeated local civil times map to the
  // same DateMarker during a fall-back DST transition.
  startMs?: number
  endMs?: number
  isStart: boolean
  isEnd: boolean
}

export type TimelineCoordRange = TimelineRange & CoordRange

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
    if (
      tDateProfile.isTimeScale &&
      tDateProfile.timeAxis &&
      dateSpan.timelineStartMs != null &&
      dateSpan.timelineEndMs != null
    ) {
      const axisStartMs = tDateProfile.timeAxis.snapBoundaryMs[0]
      const axisEndMs = tDateProfile.timeAxis.snapBoundaryMs[tDateProfile.timeAxis.snapBoundaryMs.length - 1]
      const activeStartMs = dateEnv.toDate(activeRange.start).valueOf()
      const activeEndMs = dateEnv.toDate(activeRange.end).valueOf()
      const startMs = Math.max(dateSpan.timelineStartMs, axisStartMs, activeStartMs)
      const endMs = Math.min(dateSpan.timelineEndMs, axisEndMs, activeEndMs)

      if (startMs < endMs) {
        return {
          ...dateSpan,
          range: {
            start: dateEnv.timestampToMarker(startMs),
            end: dateEnv.timestampToMarker(endMs),
          },
          timelineStartMs: startMs,
          timelineEndMs: endMs,
        }
      }

      return null
    }

    return super.intersectDateSpan(dateSpan, activeRange, dateProfile, dateProfileGenerator, tDateProfile, dateEnv)
  }

  protected sliceDateSpan(
    dateSpan: DateSpan,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): TimelineRange[] {
    if (
      tDateProfile.isTimeScale &&
      tDateProfile.timeAxis &&
      dateSpan.timelineStartMs != null &&
      dateSpan.timelineEndMs != null
    ) {
      const axisStartMs = tDateProfile.timeAxis.snapBoundaryMs[0]
      const axisEndMs = tDateProfile.timeAxis.snapBoundaryMs[tDateProfile.timeAxis.snapBoundaryMs.length - 1]
      const startMs = Math.max(dateSpan.timelineStartMs, axisStartMs)
      const endMs = Math.min(dateSpan.timelineEndMs, axisEndMs)

      if (startMs < endMs) {
        return [{
          startDate: dateEnv.timestampToMarker(startMs),
          endDate: dateEnv.timestampToMarker(endMs),
          startMs,
          endMs,
          isStart: startMs === dateSpan.timelineStartMs,
          isEnd: endMs === dateSpan.timelineEndMs,
        }]
      }

      return []
    }

    return super.sliceDateSpan(dateSpan, dateProfile, dateProfileGenerator, tDateProfile, dateEnv)
  }

  sliceRange(
    origRange: DateRange,
    dateProfile: DateProfile,
    dateProfileGenerator: DateProfileGenerator,
    tDateProfile: TimelineDateProfile,
    dateEnv: DateEnv,
  ): TimelineRange[] {
    let normalRange = normalizeRange(origRange, tDateProfile, dateEnv)
    let segs: TimelineRange[] = []
    let timelineStartMs = tDateProfile.isTimeScale && 'timelineStartMs' in origRange ? (origRange as any).timelineStartMs as number | undefined : undefined
    let timelineEndMs = tDateProfile.isTimeScale && 'timelineEndMs' in origRange ? (origRange as any).timelineEndMs as number | undefined : undefined

    // protect against when the span is entirely in an invalid date region
    if (
      (timelineStartMs != null && timelineEndMs != null && tDateProfile.timeAxis)
        ? computeDateSnapCoverageFromMs(timelineStartMs, tDateProfile) < computeDateSnapCoverageFromMs(timelineEndMs, tDateProfile)
        : computeDateSnapCoverage(normalRange.start, tDateProfile, dateEnv)
          < computeDateSnapCoverage(normalRange.end, tDateProfile, dateEnv)
    ) {
      // intersect the footprint's range with the grid's range
      let slicedRange = intersectRanges(normalRange, tDateProfile.normalizedRange)

      if (slicedRange) {
        let slicedStartMs = timelineStartMs
        let slicedEndMs = timelineEndMs

        if (slicedStartMs != null && slicedEndMs != null && tDateProfile.timeAxis) {
          const axisStartMs = tDateProfile.timeAxis.snapBoundaryMs[0]
          const axisEndMs = tDateProfile.timeAxis.snapBoundaryMs[tDateProfile.timeAxis.snapBoundaryMs.length - 1]
          slicedStartMs = Math.max(slicedStartMs, axisStartMs)
          slicedEndMs = Math.min(slicedEndMs, axisEndMs)
        }

        segs.push({
          startDate: slicedRange.start,
          endDate: slicedRange.end,
          ...(slicedStartMs != null && slicedEndMs != null ? {
            startMs: slicedStartMs,
            endMs: slicedEndMs,
          } : {}),
          isStart: slicedStartMs != null && timelineStartMs != null
            ? slicedStartMs === timelineStartMs
            : slicedRange.start.valueOf() === normalRange.start.valueOf()
              && isValidDate(slicedRange.start, tDateProfile, dateProfile, dateProfileGenerator),
          isEnd: slicedEndMs != null && timelineEndMs != null
            ? slicedEndMs === timelineEndMs
            : slicedRange.end.valueOf() === normalRange.end.valueOf()
              && isValidDate(addMs(slicedRange.end, -1), tDateProfile, dateProfile, dateProfileGenerator),
        })
      }
    }

    return segs
  }
}
