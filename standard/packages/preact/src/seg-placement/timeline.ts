/**
 * Timeline limiting and more-link projection
 * ==========================================
 *
 * Timeline shares unrestricted placement and max-level limiting with the
 * common layer. Unlike Day Grid, it has no pixel ceiling and no pre-solve
 * more-link tax: a resource row expands vertically, while `maxLevels` limits
 * only the dimensionless level structure.
 *
 * More links are derived after limiting. Hidden slices form maximal groups of
 * genuinely intersecting lateral ranges; exact adjacency remains separate.
 * Each group receives one link below the visible skyline across that complete
 * range. Consequently, link formation and link measurement can never
 * invalidate event placement.
 */

import {
  type HiddenSliceGroup,
  type LayoutLimitResult,
  type Placement,
  type PlacementLayout,
  type PlacementLevel,
  type Slice,
  findLevelIntersections,
  groupHiddenSlices,
  limitLayoutByMaxLevel,
} from './layout'

/** A group with the level coordinate at which its link begins. */
export interface TimelineMoreLinkPlacement<EventMeta = unknown>
  extends HiddenSliceGroup<EventMeta> {
  /** Deepest visible level end across the group; no separate gap is added. */
  levelCoord: number
}

/** Timeline's complete view-specific result after max-level limiting. */
export interface TimelineLimitResult<EventMeta = unknown>
  extends LayoutLimitResult<EventMeta> {
  moreLinkGroups: HiddenSliceGroup<EventMeta>[]
}

/** Current DOM wrapper heights indexed by `HiddenSliceGroup.key`. */
export type TimelineMoreLinkHeightMap = ReadonlyMap<string, number>

/** Timeline's only event-placement policy; this view never slices events. */
export interface TimelineLayoutOptions {
  orderStrict: boolean
}

/**
 * Limits one Timeline row by logical depth, then groups all hidden geometry.
 *
 * `unmountedSlices` represents sources omitted before this measured pass.
 * They participate in both the complete hidden output and more-link formation.
 */
export function limitTimelineLayoutByMaxLevel<EventMeta>(
  unrestricted: PlacementLayout<EventMeta>,
  maxLevels: number,
  unmountedSlices: readonly Slice<EventMeta>[],
  options: TimelineLayoutOptions,
): TimelineLimitResult<EventMeta> {
  const limited = limitLayoutByMaxLevel(
    unrestricted,
    maxLevels,
    {
      orderStrict: options.orderStrict,
      eventSlicing: false,
      maxSlices: 1,
    },
  )
  const hiddenSlices = [
    ...unmountedSlices,
    ...limited.hiddenSlices,
  ]
  const moreLinkGroups = groupHiddenSlices(hiddenSlices)

  return {
    ...limited,
    hiddenSlices,
    moreLinkGroups,
  }
}

/**
 * Positions each Timeline link directly below its visible lateral skyline.
 *
 * Seg thicknesses already include their occupied trailing space, so this
 * projection deliberately adds no separate gap. All hidden slices in a group
 * share one `levelCoord`, which is the sense in which Timeline links group
 * together.
 */
export function positionTimelineMoreLinks<EventMeta>(
  groups: readonly HiddenSliceGroup<EventMeta>[],
  levels: readonly PlacementLevel<EventMeta>[],
): TimelineMoreLinkPlacement<EventMeta>[] {
  return groups.map((group) => {
    let levelCoord = 0
    for (const level of levels) {
      if (!level) continue
      for (const placement of findLevelIntersections(level, group)) {
        levelCoord = Math.max(levelCoord, placement.levelEndCoord)
      }
    }
    return { ...group, levelCoord }
  })
}

/**
 * Calculates the expanding Timeline row height after links are measured.
 *
 * Each map value is one link wrapper's complete occupied height, following the
 * same no-separate-gap convention used for event seg measurements. A
 * missing measurement contributes `defaultMoreLinkHeight`.
 */
export function calculateTimelineContentHeight<EventMeta>(
  visiblePlacements: readonly Placement<EventMeta>[],
  moreLinkPlacements: readonly TimelineMoreLinkPlacement<EventMeta>[],
  moreLinkHeights: TimelineMoreLinkHeightMap,
  defaultMoreLinkHeight = 0,
): number {
  let contentHeight = 0
  for (const placement of visiblePlacements) {
    contentHeight = Math.max(contentHeight, placement.levelEndCoord)
  }
  for (const moreLink of moreLinkPlacements) {
    contentHeight = Math.max(
      contentHeight,
      moreLink.levelCoord +
        (moreLinkHeights.get(moreLink.key) ?? defaultMoreLinkHeight),
    )
  }
  return contentHeight
}
