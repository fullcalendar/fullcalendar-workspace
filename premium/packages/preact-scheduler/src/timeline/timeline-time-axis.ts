import { Duration } from '@fullcalendar/preact/public-api'
import { asRoughMs, DateEnv, DateMarker, DateRange } from '@fullcalendar/preact/protected-api'

/*
Canonical axis data for TIMED timeline axes (tDateProfile.isTimeScale).
Whole-day axes have no TimelineTimeAxis and use civil-marker arithmetic instead.

Timed axes are driven by absolute epoch-millisecond ticks. Each tick is converted back into a
local DateMarker via DateEnv, which allows repeated local civil times to appear naturally on
fall-back DST transitions (and nonexistent times to be skipped on spring-forward) while still
using simple time-based durations.

Because a DST-transition day is not evenly divisible by every slotDuration, visible slots are
the authority for all geometry: each slot records its own real start/end instant, and
coordinates interpolate within a slot's real span. A slot truncated by the axis end (or by a
DST shift) simply represents a shorter real span at full rendered width, the same way
hidden days make the scale non-uniform.
*/
export interface TimelineTimeAxis {
  // Canonical timed slot starts. TimelineDateProfile.slotDates is hydrated from this.
  slotDates: DateMarker[]
  // Aligned 1:1 with slotDates. Includes the tick's true timezone offset (derived from the
  // epoch tick, NOT from the ambiguous marker) so repeated civil times stay unique.
  slotKeys: string[]
  // Aligned 1:1 with slotDates. The exact instant each visible slot begins.
  slotStartMs: number[]
  // Aligned 1:1 with slotDates. The exclusive end instant of each visible slot, clamped to
  // the axis end. May be less than slotStartMs[i] + slotDuration on a truncated final slot.
  slotEndMs: number[]
  // Rough duration of one snap, in ms. Snaps subdivide a slot's nominal span.
  snapStepMs: number
}

export interface BuildTimelineTimeAxisArgs {
  normalizedRange: DateRange
  slotDuration: Duration
  snapDuration: Duration
  dateEnv: DateEnv
  isDateVisible: (date: DateMarker) => boolean // same rules as timeline-date-profile's isValidDate
}

export function buildTimelineTimeAxis(args: BuildTimelineTimeAxisArgs): TimelineTimeAxis {
  const { dateEnv, isDateVisible } = args
  const slotDates: DateMarker[] = []
  const slotKeys: string[] = []
  const slotStartMs: number[] = []
  const slotEndMs: number[] = []
  const slotStepMs = asRoughMs(args.slotDuration)
  const snapStepMs = asRoughMs(args.snapDuration)
  const startMs = dateEnv.toDate(args.normalizedRange.start).valueOf()
  const endMs = dateEnv.toDate(args.normalizedRange.end).valueOf()

  for (let currentMs = startMs; currentMs < endMs; currentMs += slotStepMs) {
    const date = dateEnv.timestampToMarker(currentMs)

    if (isDateVisible(date)) {
      slotDates.push(date)
      slotKeys.push(buildTimelineAxisKey(date, currentMs))
      slotStartMs.push(currentMs)
      slotEndMs.push(Math.min(currentMs + slotStepMs, endMs))
    }
  }

  return {
    slotDates,
    slotKeys,
    slotStartMs,
    slotEndMs,
    snapStepMs,
  }
}

/*
The offset must be derived from the marker/instant pair. Asking DateEnv for a marker's offset
would resolve ambiguous fall-back civil times to their first occurrence, giving both
occurrences identical keys.
*/
function buildTimelineAxisKey(marker: DateMarker, instantMs: number): string {
  const offsetMinutes = Math.round((marker.valueOf() - instantMs) / 60000)
  return `${marker.toISOString()}:${offsetMinutes}`
}

export function getTimelineAxisStartMs(timeAxis: TimelineTimeAxis): number | null {
  return timeAxis.slotStartMs.length ? timeAxis.slotStartMs[0] : null
}

export function getTimelineAxisEndMs(timeAxis: TimelineTimeAxis): number | null {
  return timeAxis.slotEndMs.length ? timeAxis.slotEndMs[timeAxis.slotEndMs.length - 1] : null
}
