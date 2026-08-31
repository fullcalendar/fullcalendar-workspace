import {
  type DateEnv,
  type EventRangeProps,
  type Slice,
  buildLevelLimitedLayout,
  computeLateralSpanBottom,
  getSliceKey,
  groupLaterallyIntersecting,
  sortByAxisOrder,
} from '@fullcalendar/preact/protected-api'
import { type TimelineRange } from './TimelineLaneSlicer'
import { type TimelineDateProfile } from './timeline-date-profile'
import { computeSegHorizontals } from './timeline-positioning'

export type TimelineEventSeg = TimelineRange & EventRangeProps

/**
 * A projected copy of a production seg satisfying the kernel's seg
 * requirements: the seg's own fields plus identity and its horizontal pixel
 * span (the production seg carries only dates).
 */
export type TimelineSourceSeg = TimelineEventSeg & {
  key: string
  start: number
  end: number
  orderIndex: number
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
export interface TimelineSegPlacementResult {
  renderSlices: Slice<TimelineSourceSeg>[]
  sliceCoords: ReadonlyMap<string, number>
  moreLinks: TimelineSegMoreLink[]
  contentHeight: number
  /** Whether this layout is a fixed point of the current measurements. */
  isSettled: boolean
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
): TimelineSourceSeg[] {
  const sourceSegs: TimelineSourceSeg[] = []

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
        ...seg,
        key: seg.eventRange.instance.instanceId,
        start: horizontal.start,
        end: horizontal.end,
        orderIndex,
      })
    }
  }

  return sourceSegs
}

/**
 * Mounts every admitted event for measurement, but positions only events whose
 * wrappers have reported an exact height. Link heights affect only content
 * height, never placement.
 */
export function buildTimelineSegPlacements(
  sourceSegs: readonly TimelineSourceSeg[],
  eventOrderStrict: boolean,
  eventMaxStack: number,
  sliceHeights: ReadonlyMap<string, number>,
  moreLinkHeights: ReadonlyMap<string, number>,
): TimelineSegPlacementResult {
  const layout = buildLevelLimitedLayout(
    sourceSegs,
    eventOrderStrict,
    /* eventSlicing = */ false,
    eventMaxStack,
    /* moreLinkLevelTax = */ 0,
    sliceHeights,
  )

  const renderSlices = sortByAxisOrder(layout.renderSlices)
  const hiddenGroups = groupLaterallyIntersecting(layout.hiddenSlices)

  const moreLinks = hiddenGroups.map((group) => ({
    key: group.key,
    start: group.start,
    end: group.end,
    top: computeLateralSpanBottom(
      layout.sliceLevels,
      group,
      layout.sliceCoords,
      sliceHeights,
    ),
    segs: group.hiddenSlices.map((slice) => slice.sourceSeg),
  }))

  return {
    renderSlices,
    sliceCoords: layout.sliceCoords,
    moreLinks,
    contentHeight: calculateTimelineContentHeight(
      renderSlices,
      layout.sliceCoords,
      sliceHeights,
      moreLinks,
      moreLinkHeights,
    ),
    isSettled: layout.isSettled,
  }
}

/** Visible bottoms plus each link's independently measured occupied space. */
function calculateTimelineContentHeight(
  renderSlices: readonly Slice<TimelineSourceSeg>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeights: ReadonlyMap<string, number>,
  moreLinks: readonly TimelineSegMoreLink[],
  moreLinkHeights: ReadonlyMap<string, number>,
): number {
  let contentHeight = 0

  for (const slice of renderSlices) {
    const key = getSliceKey(slice)
    const sliceTop = sliceCoords.get(key)
    const sliceHeight = sliceHeights.get(key)
    if (sliceTop != null && sliceHeight != null) {
      contentHeight = Math.max(contentHeight, sliceTop + sliceHeight)
    }
  }

  for (const moreLink of moreLinks) {
    contentHeight = Math.max(
      contentHeight,
      moreLink.top + (moreLinkHeights.get(moreLink.key) ?? 0),
    )
  }

  return contentHeight
}
