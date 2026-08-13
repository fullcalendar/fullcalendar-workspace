import {
  type CoordSpan,
  type DateEnv,
  type EventRangeProps,
  type Placement,
  type Slice,
  type SourceSeg,
  areSegThicknessesSettled,
  calculateTimelineContentHeight,
  getEventKey,
  greatestDurationDenominator,
  limitTimelineLayoutByMaxLevel,
  planDomCandidatesByMaxLevel,
  positionSegs,
  positionTimelineMoreLinks,
} from '@fullcalendar/preact/protected-api'
import { type TimelineRange } from './TimelineLaneSlicer'
import { type TimelineDateProfile } from './timeline-date-profile'
import { computeSegHorizontals } from './timeline-positioning'

export type TimelineEventSeg = TimelineRange & EventRangeProps

/** Source-level decision made before event wrappers have measured. */
export interface TimelineSegPlacementPlan {
  /** Whether every input seg survived *horizontal* projection and clipping. */
  allSegsProjected: boolean
  /** Admitted sources in resolved event order for measured placement. */
  mountedSegs: SourceSeg<TimelineEventSeg>[]
  /** The same sources in temporal-start then resolved-order DOM order. */
  domOrderedSegs: SourceSeg<TimelineEventSeg>[]
  /** Whole sources rejected before mounting and retained for final links. */
  unmountedSlices: Slice<TimelineEventSeg>[]
  maxLevels: number
  orderStrict: boolean
}

/** Final geometry for one admitted permanent event wrapper. */
export interface TimelineSegPlacement {
  top: number
  height: number
}

/** One permanent event node, including a measured-hidden donor. */
export interface TimelineSegDomItem {
  key: string
  seg: TimelineEventSeg
  horizontal: CoordSpan
  placement: TimelineSegPlacement | null
}

/** Production-facing data for one final Timeline more-link wrapper. */
export interface TimelineSegMoreLink {
  key: string
  start: number
  end: number
  top: number
  count: number
  segs: TimelineEventSeg[]
}

/** Measured drawing data for one expanding Timeline lane. */
export interface TimelineSegPlacementResult {
  eventDomItems: TimelineSegDomItem[]
  moreLinks: TimelineSegMoreLink[]
  contentHeight: number
  /** False while any admitted event wrapper still lacks a measurement. */
  allHeightsSettled: boolean
}

/**
 * Projects sorted production Timeline segs and decides which wrappers mount.
 *
 * Production's coordinate functions remain authoritative for civil dates,
 * hidden dates, exact timed instants, DST, unequal slots, minimum width, and
 * viewport clipping. Only their numeric output enters the shared engine.
 */
export function buildTimelineSegPlacementPlan(
  segs: TimelineEventSeg[],
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
  eventMinWidth?: number,
  eventOrderStrict?: boolean,
  eventMaxStack?: number,
  clipStart?: number,
  clipEnd?: number,
): TimelineSegPlacementPlan {
  const orderStrict = eventOrderStrict ?? false
  const maxLevels = eventMaxStack ?? Infinity
  const sourceSegs = buildTimelineSegSources(
    segs,
    eventMinWidth,
    dateEnv,
    tDateProfile,
    slotWidth,
    clipStart,
    clipEnd,
  )
  const candidatePlan = planDomCandidatesByMaxLevel(
    sourceSegs,
    maxLevels,
    {
      orderStrict,
      eventSlicing: false,
      maxSlices: 1,
    },
  )

  return {
    allSegsProjected: sourceSegs.length === segs.length,
    mountedSegs: candidatePlan.mountedSegs,
    domOrderedSegs: [...candidatePlan.mountedSegs].sort((a, b) =>
      computeTimelineSegStart(a.meta) - computeTimelineSegStart(b.meta) ||
      a.orderIndex - b.orderIndex,
    ),
    unmountedSlices: candidatePlan.hiddenSlices,
    maxLevels,
    orderStrict,
  }
}

function computeTimelineSegStart(seg: TimelineEventSeg): number {
  return seg.startMs ?? seg.startDate.valueOf()
}

/**
 * Builds shared-engine sources from production's already-projected spans.
 *
 * `orderIndex` is the index in the caller's resolved event-order array, even
 * when clipping removes an earlier seg. Endpoint normalization happens only
 * after projection, clipping, and `eventMinWidth` have been applied.
 */
export function buildTimelineSegSources(
  segs: TimelineEventSeg[],
  segMinWidth: number | undefined,
  dateEnv: DateEnv,
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
  clipStart = 0,
  clipEnd = Infinity,
): SourceSeg<TimelineEventSeg>[] {
  const coordQuantum = computeTimelineCoordQuantum(tDateProfile, slotWidth)
  const sourceSegs: SourceSeg<TimelineEventSeg>[] = []

  for (let orderIndex = 0; orderIndex < segs.length; orderIndex += 1) {
    const seg = segs[orderIndex]
    const horizontal = computeSegHorizontals(
      seg,
      segMinWidth,
      dateEnv,
      tDateProfile,
      slotWidth,
      clipStart,
      clipEnd,
    )

    if (horizontal) {
      sourceSegs.push({
        key: getEventKey(seg),
        start: normalizeTimelineCoord(horizontal.start, coordQuantum),
        end: normalizeTimelineCoord(
          horizontal.start + horizontal.size,
          coordQuantum,
        ),
        isStart: seg.isStart,
        isEnd: seg.isEnd,
        meta: seg,
        orderIndex,
      })
    }
  }

  return sourceSegs
}

/**
 * Repositions every admitted source from current wrapper heights.
 *
 * Candidate-plan rejects are merged into measured hides before final hidden
 * grouping. More-link heights affect only `contentHeight`; changing one never
 * feeds back into event placement or link skyline coordinates.
 */
export function buildTimelineSegPlacements(
  plan: TimelineSegPlacementPlan,
  segHeights: ReadonlyMap<string, number>,
  moreLinkHeights: ReadonlyMap<string, number>,
): TimelineSegPlacementResult {
  const allHeightsSettled = areSegThicknessesSettled(plan.mountedSegs, segHeights)

  if (!allHeightsSettled) {
    return {
      eventDomItems: buildEventDomItems(plan.domOrderedSegs, new Map()),
      moreLinks: [],
      contentHeight: 0,
      allHeightsSettled: false,
    }
  }

  const unrestricted = positionSegs(
    plan.mountedSegs,
    segHeights,
    { orderStrict: plan.orderStrict },
  )
  const limited = limitTimelineLayoutByMaxLevel(
    unrestricted,
    plan.maxLevels,
    plan.unmountedSlices,
    { orderStrict: plan.orderStrict },
  )
  const moreLinkPlacements = positionTimelineMoreLinks(
    limited.moreLinkGroups,
    limited.levels,
  )
  const visibleByKey = new Map<string, Placement<TimelineEventSeg>>()
  for (const placement of limited.visiblePlacements) {
    visibleByKey.set(placement.sourceSeg.key, placement)
  }

  return {
    eventDomItems: buildEventDomItems(plan.domOrderedSegs, visibleByKey),
    moreLinks: moreLinkPlacements.map((moreLink) => ({
      key: moreLink.key,
      start: moreLink.start,
      end: moreLink.end,
      top: moreLink.levelCoord,
      count: moreLink.count,
      segs: moreLink.hiddenSlices.map((slice) => slice.sourceSeg.meta),
    })),
    contentHeight: calculateTimelineContentHeight(
      limited.visiblePlacements,
      moreLinkPlacements,
      moreLinkHeights,
    ),
    allHeightsSettled: true,
  }
}

/**
 * Chooses a projected-pixel quantum one named unit finer than one slot.
 *
 * The duration denominator supplies both the slot's named unit and its count.
 * Months and years use the same rough day/month ratios as production duration
 * conversion; actual date projection has already happened before this value is
 * used. A non-positive slot width disables normalization during initial sizing.
 */
export function computeTimelineCoordQuantum(
  tDateProfile: TimelineDateProfile,
  slotWidth: number,
): number {
  if (!(slotWidth > 0)) return 0

  const denominator = greatestDurationDenominator(tDateProfile.slotDuration)
  const finerUnitsPerUnit: Record<string, number> = {
    year: 12,
    month: 30,
    week: 7,
    day: 24,
    hour: 60,
    minute: 60,
    second: 1000,
    millisecond: 1,
  }
  const subdivisionCount = Math.abs(denominator.value) *
    (finerUnitsPerUnit[denominator.unit] ?? 1)

  return subdivisionCount > 0 ? slotWidth / subdivisionCount : 0
}

function normalizeTimelineCoord(coord: number, quantum: number): number {
  if (!(quantum > 0) || !Number.isFinite(coord)) return coord

  const normalized = Math.round(coord / quantum) * quantum
  return Object.is(normalized, -0) ? 0 : normalized
}

function buildEventDomItems(
  domOrderedSegs: readonly SourceSeg<TimelineEventSeg>[],
  visibleByKey: ReadonlyMap<string, Placement<TimelineEventSeg>>,
): TimelineSegDomItem[] {
  return domOrderedSegs.map((sourceSeg) => {
    const placement = visibleByKey.get(sourceSeg.key)
    return {
      key: sourceSeg.key,
      seg: sourceSeg.meta,
      horizontal: {
        start: sourceSeg.start,
        size: sourceSeg.end - sourceSeg.start,
      },
      placement: placement
        ? {
          top: placement.levelCoord,
          height: placement.thickness,
        }
        : null,
    }
  })
}
