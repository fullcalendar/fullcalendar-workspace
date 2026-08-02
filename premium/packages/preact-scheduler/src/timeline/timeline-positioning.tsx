import { DateEnv, DateMarker, DateProfile, DateSpan, multiplyDuration, startOfDay } from '@fullcalendar/preact/protected-api';
import { TimelineDateProfile } from './timeline-date-profile'
import { Duration } from '@fullcalendar/preact/public-api'
import { computeDateSnapCoverage, computeMsSlotCoverage } from './TimelineCoords'

// Timeline-specific
// -------------------------------------------------------------------------------------------------

/*
TODO: DRY with computeSlatHeight?
*/
export function computeSlotWidth(
  slatCnt: number,
  slatsPerLabel: number,
  slatMinWidth: number | undefined,
  labelInnerWidth: number | undefined,
  viewportWidth: number | undefined,
): [
  canvasWidth: number | undefined,
  slatWidth: number | undefined,
  slotLiquid: boolean,
] {
  if (labelInnerWidth == null || viewportWidth == null) {
    return [undefined, undefined, false]
  }

  if (slatMinWidth == null) {
    slatMinWidth = Math.ceil((labelInnerWidth + 1) / slatsPerLabel)
  }

  const slatTryWidth = viewportWidth / slatCnt
  let slotLiquid: boolean
  let slatWidth: number

  if (slatTryWidth >= slatMinWidth) {
    slotLiquid = true
    slatWidth = slatTryWidth
  } else {
    slotLiquid = false
    slatWidth = Math.max(slatMinWidth, slatTryWidth)
  }

  return [slatWidth * slatCnt, slatWidth, slotLiquid]
}

/*
`time` has wall-clock semantics (scrollTime: '06:00' targets civil 06:00, even on DST days
where that's not 6 elapsed hours from midnight), hence the civil dateEnv.add.
*/
export function timeToCoord( // pixels
  time: Duration,
  dateEnv: DateEnv,
  dateProfile: DateProfile,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  let date = dateEnv.add(dateProfile.activeRange.start, time)

  if (!tDateProfile.isTimeScale) {
    date = startOfDay(date)
  }

  return dateToCoord(date, dateEnv, tDateProfile, slotWidth)
}

export function dateToCoord( // pixels
  date: DateMarker,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  if (tDateProfile.timeAxis) {
    return msToCoord(dateEnv.toDate(date).valueOf(), tDateProfile, slotWidth)
  }

  let snapCoverage = computeDateSnapCoverage(date, tDateProfile, dateEnv)
  let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
  return slotCoverage * slotWidth
}

// for TIMED axes only (tDateProfile.timeAxis must be populated)
export function msToCoord( // pixels
  dateMs: number,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  return computeMsSlotCoverage(dateMs, tDateProfile) * slotWidth
}

export interface TimelineSnapRange {
  start: DateMarker
  end: DateMarker
  startMs: number | null // populated for timed axes
  endMs: number | null // populated for timed axes
}

export interface TimelineHitData {
  slatIndex: number
  dateSpan: DateSpan
  rect: {
    left: number
    right: number
  }
}

/*
Builds the horizontal geometry and exact date span shared by both timeline hit systems.
*/
export function computeTimelineHitData(
  positionLeft: number,
  canvasWidth: number,
  slotWidth: number,
  isRtl: boolean,
  tDateProfile: TimelineDateProfile,
  dateEnv: DateEnv,
): TimelineHitData | null {
  const x = isRtl ? canvasWidth - positionLeft : positionLeft
  const slatIndex = Math.floor(x / slotWidth)
  const slatLeft = slatIndex * slotWidth
  const partial = (x - slatLeft) / slotWidth
  const localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot)
  const snap = computeSnapRange(slatIndex, localSnapIndex, tDateProfile, dateEnv)

  if (!snap) {
    return null
  }

  const snapWidth = slotWidth / tDateProfile.snapsPerSlot
  const startCoord = slatIndex * slotWidth + (snapWidth * localSnapIndex)
  const endCoord = startCoord + snapWidth
  const left = isRtl ? canvasWidth - endCoord : startCoord
  const right = isRtl ? canvasWidth - startCoord : endCoord

  return {
    slatIndex,
    dateSpan: {
      range: { start: snap.start, end: snap.end },
      allDay: !tDateProfile.isTimeScale,
      ...(snap.startMs != null ? {
        instantStartMs: snap.startMs,
        instantEndMs: snap.endMs,
      } : {}),
    },
    rect: { left, right },
  }
}

/*
The date range of a single snap-cell, for hit-detection.
Timed axes read the canonical instant-based axis; whole-day axes use civil-marker arithmetic.
Returns null when the snap has no real span (e.g. the tail of a slot truncated by a DST
transition, which renders at full width but represents a shorter real duration).
*/
export function computeSnapRange(
  slatIndex: number,
  localSnapIndex: number, // the snap # relative to start of slat
  tDateProfile: TimelineDateProfile,
  dateEnv: DateEnv,
): TimelineSnapRange | null {
  const { timeAxis } = tDateProfile

  if (timeAxis) {
    if (slatIndex >= timeAxis.slots.length) {
      return null
    }

    const slot = timeAxis.slots[slatIndex]
    const startMs = slot.startMs + (localSnapIndex * timeAxis.snapStepMs)
    const endMs = Math.min(startMs + timeAxis.snapStepMs, slot.endMs)

    if (startMs >= endMs) {
      return null
    }

    return {
      start: dateEnv.timestampToMarker(startMs),
      end: dateEnv.timestampToMarker(endMs),
      startMs,
      endMs,
    }
  }

  if (slatIndex >= tDateProfile.slotDates.length) {
    return null
  }

  const start = dateEnv.add(
    tDateProfile.slotDates[slatIndex],
    multiplyDuration(tDateProfile.snapDuration, localSnapIndex),
  )

  return {
    start,
    end: dateEnv.add(start, tDateProfile.snapDuration),
    startMs: null,
    endMs: null,
  }
}
