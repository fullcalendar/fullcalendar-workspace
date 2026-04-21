import { Duration } from '@fullcalendar/preact/public-api'
import { asRoughMs, DateMarker, DateProfile, DateProfileGenerator, DateRange, startOfDay } from '@fullcalendar/preact/protected-api'
import { DateEnv } from '@fullcalendar/preact/protected-api'

export interface TimelineTimeAxis {
  // Canonical timed slot starts. TimelineDateProfile.slotDates is hydrated from this.
  slotDates: DateMarker[]
  // Aligned 1:1 with slotDates.
  slotOffsets: (number | null)[]
  // Aligned 1:1 with slotDates. Includes offset so repeated civil times stay unique.
  slotKeys: string[]
  // Canonical timed snap starts once DST-aware generation is enabled.
  snapDates: DateMarker[]
  // Aligned 1:1 with snapDates.
  snapOffsets: (number | null)[]
  // Aligned 1:1 with snapDates. Includes offset so repeated civil times stay unique.
  snapKeys: string[]
  // Candidate snap boundaries in actual instant order. Length is snapDiffToIndex.length + 1.
  // Used for date-to-coordinate lookup without assuming arithmetic continuity.
  snapBoundaryMs: number[]
  // Timed-axis lookup tables. These mirror TimelineDateProfile's legacy fields but are built
  // from the canonical axis sequence instead of countDurationsBetween/dateEnv.add arithmetic.
  snapDiffToIndex: number[]
  snapIndexToDiff: number[]
}

export interface BuildTimelineTimeAxisArgs {
  normalizedRange: DateRange
  slotDuration: Duration
  snapDuration: Duration
  isTimeScale: boolean
  dateProfile: DateProfile
  dateEnv: DateEnv
  dateProfileGenerator: DateProfileGenerator
}

// Timed axes are driven by absolute epoch-millisecond ticks. Each tick is converted back into a
// local DateMarker plus offset via DateEnv, which allows repeated local civil times to appear
// naturally on fall-back transitions while still using simple time-based durations.
export function buildTimelineTimeAxis(args: BuildTimelineTimeAxisArgs): TimelineTimeAxis | null {
  if (!args.isTimeScale) {
    return null
  }

  const slotDates: DateMarker[] = []
  const slotOffsets: (number | null)[] = []
  const slotKeys: string[] = []
  const snapDates: DateMarker[] = []
  const snapOffsets: (number | null)[] = []
  const snapKeys: string[] = []
  const snapBoundaryMs: number[] = []
  const snapDiffToIndex: number[] = []
  const snapIndexToDiff: number[] = []
  const slotStepMs = asRoughMs(args.slotDuration)
  const snapStepMs = asRoughMs(args.snapDuration)
  const startMs = args.dateEnv.toDate(args.normalizedRange.start).valueOf()
  const endMs = args.dateEnv.toDate(args.normalizedRange.end).valueOf()

  for (let currentMs = startMs; currentMs < endMs; currentMs += slotStepMs) {
    const date = args.dateEnv.timestampToMarker(currentMs)

    if (isTimelineAxisDateVisible(date, args)) {
      const offset = args.dateEnv.offsetForMarker(date)
      slotDates.push(date)
      slotOffsets.push(offset)
      slotKeys.push(buildTimelineAxisKey(date, offset))
    }
  }

  let snapIndex = -1
  let snapDiff = 0

  for (let currentMs = startMs; currentMs < endMs; currentMs += snapStepMs) {
    const date = args.dateEnv.timestampToMarker(currentMs)

    snapBoundaryMs.push(currentMs)

    if (isTimelineAxisDateVisible(date, args)) {
      const offset = args.dateEnv.offsetForMarker(date)
      snapIndex += 1
      snapDates.push(date)
      snapOffsets.push(offset)
      snapKeys.push(buildTimelineAxisKey(date, offset))
      snapDiffToIndex.push(snapIndex)
      snapIndexToDiff.push(snapDiff)
    } else {
      snapDiffToIndex.push(snapIndex + 0.5)
    }

    snapDiff += 1
  }

  snapBoundaryMs.push(endMs)

  return {
    slotDates,
    slotOffsets,
    slotKeys,
    snapDates,
    snapOffsets,
    snapKeys,
    snapBoundaryMs,
    snapDiffToIndex,
    snapIndexToDiff,
  }
}

export function buildTimelineAxisKey(marker: DateMarker, timeZoneOffset: number | null): string {
  return `${marker.toISOString()}:${timeZoneOffset ?? 'null'}`
}

export function getTimelineAxisSnapEnd(dateEnv: DateEnv, timeAxis: TimelineTimeAxis, snapIndex: number): DateMarker {
  return dateEnv.timestampToMarker(
    timeAxis.snapBoundaryMs[timeAxis.snapIndexToDiff[snapIndex] + 1],
  )
}

function isTimelineAxisDateVisible(date: DateMarker, args: BuildTimelineTimeAxisArgs): boolean {
  if (args.dateProfileGenerator.isHiddenDay(date)) {
    return false
  }

  let day = startOfDay(date)
  let timeMs = date.valueOf() - day.valueOf()
  let ms = timeMs - asRoughMs(args.dateProfile.slotMinTime)
  ms = ((ms % 86400000) + 86400000) % 86400000

  return ms < (asRoughMs(args.dateProfile.slotMaxTime) - asRoughMs(args.dateProfile.slotMinTime))
}
