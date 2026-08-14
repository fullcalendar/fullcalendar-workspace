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

/** One permanent event node, including a measured-hidden donor. */
export interface TimelineSegDomItem {
  key: string
  seg: TimelineEventSeg
  horizontal: CoordSpan
  top: number | null
}

/** Production-facing data for one final Timeline more-link wrapper. */
export interface TimelineSegMoreLink {
  key: string
  start: number
  end: number
  top: number
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
 * when clipping removes an earlier seg.
 *
 * Coordinates go in exactly as projected, with no rounding or tolerance, which
 * is how this worked before the shared engine existed. Placement therefore
 * reacts to whatever the projection produces, down to the last bit: an overlap
 * of any width costs a whole level.
 *
 * That precision is only safe because the endpoints come from the projection
 * rather than being rebuilt from each other — see `TimelineSegHorizontals.end`,
 * which also covers the one case that is derived, a seg stretched to
 * `eventMinWidth`. Deriving the end as `start + size` would reintroduce
 * ulp-level disagreements between abutting events, which is exactly what a
 * quantizer would then have to hide.
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
        start: horizontal.start,
        end: horizontal.end,
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
    plan.orderStrict,
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
      top: placement?.levelCoord ?? null,
    }
  })
}
