import {
  DEFAULT_UNMEASURED_EVENT_THICKNESS,
  type CoordSpan,
  type DateEnv,
  type EventRangeProps,
  type Slice,
  type SliceHeightMap,
  type SourceSeg,
  buildLevelLimitedLayout,
  getEventKey,
  getSliceKey,
} from '@fullcalendar/preact/protected-api'
import { type TimelineRange } from './TimelineLaneSlicer'
import { type TimelineDateProfile } from './timeline-date-profile'
import { computeSegHorizontals } from './timeline-positioning'

export type TimelineEventSeg = TimelineRange & EventRangeProps

/** Source-level projection data kept stable while measurements reflow. */
export interface TimelineSegPlacementPlan {
  /** Whether every input seg survived horizontal projection and clipping. */
  allSegsProjected: boolean
  /** Projected sources in resolved event order. */
  sourceSegs: SourceSeg<TimelineEventSeg>[]
  /** The same sources in temporal-start then resolved-order DOM order. */
  domOrderedSegs: SourceSeg<TimelineEventSeg>[]
  maxLevels: number
  orderStrict: boolean
}

/** One visible event node in Timeline's time-axis DOM order. */
export interface TimelineSegDomItem<HeightRef> {
  key: string
  seg: TimelineEventSeg
  horizontal: CoordSpan
  top: number
  heightRef: HeightRef
}

/** Production-facing data for one kernel hidden-group more-link wrapper. */
export interface TimelineSegMoreLink {
  key: string
  start: number
  end: number
  top: number
  segs: TimelineEventSeg[]
}

/** Immediately renderable drawing data for one expanding Timeline lane. */
export interface TimelineSegPlacementResult<HeightRef> {
  eventDomItems: TimelineSegDomItem<HeightRef>[]
  moreLinks: TimelineSegMoreLink[]
  contentHeight: number
  /** False while any visible event wrapper still lacks an exact measurement. */
  allHeightsSettled: boolean
}

/**
 * Projects sorted production Timeline segs without changing their coordinates.
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
  const sourceSegs = buildTimelineSegSources(
    segs,
    eventMinWidth,
    dateEnv,
    tDateProfile,
    slotWidth,
    clipStart,
    clipEnd,
  )

  return {
    allSegsProjected: sourceSegs.length === segs.length,
    sourceSegs,
    domOrderedSegs: [...sourceSegs].sort((a, b) =>
      computeTimelineSegStart(a.meta) - computeTimelineSegStart(b.meta) ||
      a.orderIndex - b.orderIndex,
    ),
    maxLevels: eventMaxStack ?? Infinity,
    orderStrict: eventOrderStrict ?? false,
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
      const key = getEventKey(seg)
      sourceSegs.push({
        key,
        eventKey: key,
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
 * Builds Timeline's immediate shared-kernel layout from exact and provisional
 * event heights. Link heights affect only content height, never placement.
 */
export function buildTimelineSegPlacements<HeightRef>(
  plan: TimelineSegPlacementPlan,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  moreLinkHeights: ReadonlyMap<string, number>,
  largestSliceHeight: number | undefined,
): TimelineSegPlacementResult<HeightRef> {
  const provisionalSliceHeight = largestSliceHeight ??
    DEFAULT_UNMEASURED_EVENT_THICKNESS
  const layout = buildLevelLimitedLayout(
    { segs: plan.sourceSegs },
    {
      eventOrderStrict: plan.orderStrict,
      eventSlicing: false,
      maxLevels: plan.maxLevels,
      moreLinkLevelTax: 0,
    },
    sliceHeightMap,
    largestSliceHeight,
  )
  const visibleSlices = layout.sliceLevels.flat()
  const visibleByKey = new Map(
    visibleSlices.map((slice) => [slice.sourceSeg.key, slice]),
  )
  const eventDomItems = plan.domOrderedSegs.flatMap((sourceSeg) => {
    const slice = visibleByKey.get(sourceSeg.key)
    if (!slice) return []

    return [{
      key: sourceSeg.key,
      seg: sourceSeg.meta,
      horizontal: {
        start: sourceSeg.start,
        size: sourceSeg.end - sourceSeg.start,
      },
      top: layout.sliceCoords.get(getSliceKey(slice))!,
      heightRef: sliceHeightMap.createRef(sourceSeg.key),
    }]
  })
  const moreLinks = layout.hiddenGroups.map((group) => ({
    key: group.key,
    start: group.start,
    end: group.end,
    top: computeTimelineGroupTop(
      group,
      layout.sliceLevels,
      layout.sliceCoords,
      sliceHeightMap,
      provisionalSliceHeight,
    ),
    segs: group.hiddenSlices.map((slice) => slice.sourceSeg.meta),
  }))

  return {
    eventDomItems,
    moreLinks,
    contentHeight: calculateTimelineContentHeight(
      visibleSlices,
      layout.sliceCoords,
      sliceHeightMap,
      provisionalSliceHeight,
      moreLinks,
      moreLinkHeights,
    ),
    allHeightsSettled: visibleSlices.every((slice) =>
      sliceHeightMap.current.get(getSliceKey(slice)) !== undefined,
    ),
  }
}

/** Positions one tax-free link below the visible skyline across its group. */
function computeTimelineGroupTop<HeightRef>(
  group: { start: number; end: number },
  sliceLevels: readonly (readonly Slice<TimelineEventSeg>[])[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  provisionalSliceHeight: number,
): number {
  let top = 0

  for (const slice of sliceLevels.flat()) {
    if (slice.start < group.end && group.start < slice.end) {
      const key = getSliceKey(slice)
      top = Math.max(
        top,
        sliceCoords.get(key)! +
          (sliceHeightMap.current.get(key) ?? provisionalSliceHeight),
      )
    }
  }

  return top
}

/** Visible bottoms plus each link's independently measured occupied space. */
function calculateTimelineContentHeight<HeightRef>(
  visibleSlices: readonly Slice<TimelineEventSeg>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  provisionalSliceHeight: number,
  moreLinks: readonly TimelineSegMoreLink[],
  moreLinkHeights: ReadonlyMap<string, number>,
): number {
  let contentHeight = 0

  for (const slice of visibleSlices) {
    const key = getSliceKey(slice)
    contentHeight = Math.max(
      contentHeight,
      sliceCoords.get(key)! +
        (sliceHeightMap.current.get(key) ?? provisionalSliceHeight),
    )
  }
  for (const moreLink of moreLinks) {
    contentHeight = Math.max(
      contentHeight,
      moreLink.top + (moreLinkHeights.get(moreLink.key) ?? 0),
    )
  }

  return contentHeight
}
