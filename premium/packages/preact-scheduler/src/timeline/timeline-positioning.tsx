import { DateEnv, DateMarker, DateProfile, startOfDay } from '@fullcalendar/preact/protected-api';
import { TimelineDateProfile } from './timeline-date-profile'
import { Duration } from '@fullcalendar/preact/public-api'
import { asRoughMs } from '@fullcalendar/preact/protected-api'
import { computeDateSnapCoverage, computeDateSnapCoverageFromMs } from './TimelineCoords'

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

  slatMinWidth = Math.max(
    slatMinWidth,
    (labelInnerWidth + 1) / slatsPerLabel,
  )
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

export function timeToCoord( // pixels
  time: Duration,
  dateEnv: DateEnv,
  dateProfile: DateProfile,
  tDateProfile: TimelineDateProfile,
  slowWidth: number,
): number {
  let date = tDateProfile.isTimeScale
    ? dateEnv.timestampToMarker(dateEnv.toDate(dateProfile.activeRange.start).valueOf() + asRoughMs(time))
    : dateEnv.add(dateProfile.activeRange.start, time)

  if (!tDateProfile.isTimeScale) {
    date = startOfDay(date)
  }

  return dateToCoord(date, dateEnv, tDateProfile, slowWidth)
}

export function dateToCoord( // pixels
  date: DateMarker,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  let snapCoverage = computeDateSnapCoverage(date, tDateProfile, dateEnv)
  let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
  return slotCoverage * slotWidth
}

export function msToCoord(
  dateMs: number,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  let snapCoverage = computeDateSnapCoverageFromMs(dateMs, tDateProfile)
  let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
  return slotCoverage * slotWidth
}
