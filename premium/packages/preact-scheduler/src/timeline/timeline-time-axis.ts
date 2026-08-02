import { Duration } from '@fullcalendar/preact/public-api'
import { addDays, asRoughMs, DateEnv, DateMarker, DateMeta, DateRange } from '@fullcalendar/preact/protected-api'

/*
Canonical axis data for TIMED timeline axes (tDateProfile.isTimeScale).
Whole-day axes have no TimelineTimeAxis and use civil-marker arithmetic instead.

Timed axes enumerate a civil grid separately within each visible day window, then resolve every
grid marker to its real occurrence(s). This keeps later days aligned to their wall-clock grid
when a DST shift is not evenly divisible by slotDuration.

Because a DST-transition day is not evenly divisible by every slotDuration, visible slots are
the authority for all geometry: each slot records its own real start/end instant, and
coordinates interpolate within a slot's real span. A slot truncated by the axis end (or by a
DST shift) simply represents a shorter real span at full rendered width, the same way
hidden days make the scale non-uniform.
*/
export interface TimelineTimeAxis {
  slots: TimelineTimeSlot[]
  // Rough duration of one snap, in ms. Snaps subdivide a slot's nominal span.
  snapStepMs: number
}

export interface TimelineTimeSlot {
  date: DateMarker
  // Includes the slot's true timezone offset (derived from its exact instant, NOT from the
  // ambiguous marker) so repeated civil times stay unique.
  key: string
  startMs: number
  // The exclusive end instant. A DST transition or window end can make this differ from the
  // nominal slot duration.
  endMs: number
}

export interface BuildTimelineTimeAxisArgs {
  normalizedRange: DateRange
  slotDuration: Duration
  snapDuration: Duration
  timeWindowMs: number
  dateEnv: DateEnv
  isDateVisible: (date: DateMarker) => boolean // same rules as timeline-date-profile's isValidDate
}

export function buildTimelineTimeAxis(args: BuildTimelineTimeAxisArgs): TimelineTimeAxis {
  const { dateEnv, isDateVisible } = args
  const slots: TimelineTimeSlot[] = []
  const snapStepMs = asRoughMs(args.snapDuration)
  const { normalizedRange } = args
  const maxWindowMs = Math.min(args.timeWindowMs, 86400000)

  for (
    let windowStart = normalizedRange.start;
    windowStart < normalizedRange.end;
    windowStart = addDays(windowStart, 1)
  ) {
    const windowEnd = new Date(Math.min(
      windowStart.valueOf() + maxWindowMs,
      normalizedRange.end.valueOf(),
    ))
    const windowStartMs = dateEnv.toDate(windowStart).valueOf()
    const windowEndMs = dateEnv.toDate(windowEnd).valueOf()

    if (windowStartMs >= windowEndMs) {
      continue
    }

    const boundaries: TimelineTimeBoundary[] = []
    const windowStartOffsetMs = dateEnv.timestampToMarker(windowStartMs).valueOf() - windowStartMs
    const windowEndOffsetMs = dateEnv.timestampToMarker(windowEndMs).valueOf() - windowEndMs
    const resolveOccurrences = windowStartOffsetMs === windowEndOffsetMs
      ? (marker: DateMarker) => [marker.valueOf() - windowStartOffsetMs]
      : (marker: DateMarker) => resolveMarkerOccurrences(marker, dateEnv)

    for (let date = windowStart; date < windowEnd; date = dateEnv.add(date, args.slotDuration)) {
      for (const startMs of resolveOccurrences(date)) {
        if (startMs >= windowStartMs && startMs < windowEndMs) {
          boundaries.push({ date, startMs })
        }
      }
    }

    boundaries.sort((a, b) => a.startMs - b.startMs)

    // A nonexistent civil window start has no grid occurrence. Preserve the real interval
    // before the first surviving grid boundary instead of silently clipping it from the axis.
    if (!boundaries.length || boundaries[0].startMs > windowStartMs) {
      boundaries.unshift({
        date: dateEnv.timestampToMarker(windowStartMs),
        startMs: windowStartMs,
      })
    }

    boundaries.push({ date: windowEnd, startMs: windowEndMs })

    for (let i = 0; i < boundaries.length - 1; i += 1) {
      const boundary = boundaries[i]
      const endMs = boundaries[i + 1].startMs

      if (boundary.startMs < endMs && isDateVisible(boundary.date)) {
        slots.push({
          date: boundary.date,
          key: buildTimelineAxisKey(boundary.date, boundary.startMs),
          startMs: boundary.startMs,
          endMs,
        })
      }
    }
  }

  return {
    slots,
    snapStepMs,
  }
}

interface TimelineTimeBoundary {
  date: DateMarker
  startMs: number
}

/*
Returns every real occurrence of a civil marker in a window whose endpoint offsets differ.
Offset guesses sampled on both sides of the marker find both sides of a fold; round-tripping
rejects guesses inside a spring-forward gap. Constant-offset windows use direct arithmetic
in buildTimelineTimeAxis and avoid these projections for every grid marker.
*/
function resolveMarkerOccurrences(marker: DateMarker, dateEnv: DateEnv): number[] {
  const resolvedMs = dateEnv.toDate(marker).valueOf()
  const occurrences = new Set<number>()

  for (const dayOffset of [-2, -1, 0, 1, 2]) {
    const sampleMs = resolvedMs + dayOffset * 86400000
    const offsetMs = dateEnv.timestampToMarker(sampleMs).valueOf() - sampleMs
    const candidateMs = marker.valueOf() - offsetMs

    if (dateEnv.timestampToMarker(candidateMs).valueOf() === marker.valueOf()) {
      occurrences.add(candidateMs)
    }
  }

  return Array.from(occurrences).sort((a, b) => a - b)
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

/*
Re-derives a slot's civil-marker-based DateMeta from its exact instant. startMs is present
only on timed axes (null for whole-day axes, which keep the civil meta untouched). Needed
because the civil marker alone is ambiguous during a DST fall-back: both 01:00 slots share
a marker, so the render-prop date and past/future must come from real instants. Used by
header cells and slot lanes — keep them consistent.
*/
export function applyExactSlotMeta(dateMeta: DateMeta, startMs: number | null, nowMs: number): DateMeta {
  if (startMs == null) {
    return dateMeta
  }

  return {
    ...dateMeta,
    date: new Date(startMs),
    isPast: !dateMeta.isDisabled && startMs < nowMs,
    isFuture: !dateMeta.isDisabled && startMs > nowMs,
  }
}

export function getTimelineAxisStartMs(timeAxis: TimelineTimeAxis): number | null {
  return timeAxis.slots.length ? timeAxis.slots[0].startMs : null
}

export function getTimelineAxisEndMs(timeAxis: TimelineTimeAxis): number | null {
  return timeAxis.slots.length ? timeAxis.slots[timeAxis.slots.length - 1].endMs : null
}
