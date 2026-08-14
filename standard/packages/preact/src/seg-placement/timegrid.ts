/**
 * TimeGrid limiting and pressure-based expansion
 * =================================================
 *
 * TimeGrid rotates the visual meaning of the common level structure. A
 * seg's lateral `start`/`end` span runs down the visible time axis, while
 * logical levels proceed across the column's level-axis thickness. Siblings in
 * one level therefore have non-overlapping time spans even though that axis
 * happens to be vertical on screen.
 *
 * TimeGrid event wrappers do not contribute measured thicknesses to this
 * calculation. Every seg receives unit thickness while the common layer
 * builds and limits the level federation. This module then treats those
 * levels as a collision web and pressure-expands the visible events across a
 * normalized level-axis range from 0 through 1.
 *
 * The more links are a final overlay projection. They group intersecting
 * hidden time spans, but consume no level-axis thickness and impose no tax on
 * the event layout. TimeGrid also disables event slicing: a rejected source is
 * hidden whole, although the common limiter may still compact that whole
 * source into a shallower opening before hiding it.
 *
 * Production integration
 * ----------------------
 *
 * `timegrid/seg-placement-adapter.ts` converts production segs to and from
 * this module's inputs and outputs, and
 * `timegrid/components/TimeGridCol.tsx` projects overlap and more links.
 */

import {
  type HiddenSliceGroup,
  type SourceSeg,
  type LayoutLimitResult,
  type Placement,
  type PlacementLevel,
  findLevelIntersections,
  groupHiddenSlices,
  limitLayoutByMaxLevel,
  orderTimeAxisItems,
  positionSegsWithUnitThickness,
} from './layout'

/** TimeGrid policies that affect level construction. */
export interface TimeGridLayoutOptions {
  /** Preserves the caller's resolved event priority through all collisions. */
  orderStrict: boolean
}

/**
 * One visible placement after its logical level is pressure-expanded.
 *
 * The inherited `levelCoord`, `thickness`, and `levelEndCoord` contain final
 * normalized geometry here, replacing the unit values used during planning.
 */
export interface TimeGridPlacement<EventMeta = unknown>
  extends Placement<EventMeta> {
  /** Longest visible collision chain extending backward from this placement. */
  backwardDepth: number
  /** Longest visible collision chain extending forward from this placement. */
  forwardDepth: number
}

/**
 * Complete reusable output needed to render one measured TimeGrid column.
 *
 * TimeGrid never slices, so each source has at most one visible placement and
 * `sourceSeg.key` is already a sufficient stable React identity.
 *
 * The limiter's own output is nested rather than spread, matching the other
 * views' measured results. That nesting is load-bearing: `limited` still holds
 * the unit-thickness currency the limiter ran in, so its placements report
 * `thickness === 1` and `levelCoord === levelIndex`. Only
 * `domOrderedPlacements` carries the normalized 0...1 geometry a renderer
 * should use. Flattening the two together would put both currencies under one
 * set of field names.
 */
export interface TimeGridColumnLayout<EventMeta = unknown> {
  /**
   * The unit-thickness limiter output these placements were projected from.
   * Intermediate data: the adapter and its component read the two fields
   * below, never this one.
   */
  limited: LayoutLimitResult<EventMeta>
  /** Final visible placements in temporal-start/event-order. */
  domOrderedPlacements: TimeGridPlacement<EventMeta>[]
  /** Tax-free overlay links formed only after limiting has completed. */
  moreLinkGroups: HiddenSliceGroup<EventMeta>[]
}

/**
 * Builds, limits, and pressure-expands one TimeGrid day/resource column.
 *
 * This deliberately retains the shared multi-phase architecture. The first
 * pass constructs the complete unrestricted unit layout. The second pass
 * applies the generic max-level limiter with slicing disabled; overflowed
 * sources may compact whole through ordinary placement machinery. Only then
 * does the TimeGrid-specific pressure and more-link projection run.
 */
export function layoutTimeGridColumnByMaxLevel<EventMeta>(
  eventOrderedSegs: readonly SourceSeg<EventMeta>[],
  maxLevels: number,
  options: TimeGridLayoutOptions,
): TimeGridColumnLayout<EventMeta> {
  const unrestricted = positionSegsWithUnitThickness(
    eventOrderedSegs,
    options.orderStrict,
  )
  const limited = limitLayoutByMaxLevel(
    unrestricted,
    maxLevels,
    {
      orderStrict: options.orderStrict,
      eventSlicing: false,
      maxSlices: 1,
    },
  )
  const placements = positionTimeGridPlacements(limited.levels)
  return {
    limited,
    domOrderedPlacements: orderTimeAxisItems(placements),
    moreLinkGroups: groupHiddenSlices(limited.hiddenSlices),
  }
}

/**
 * Turns a retained level federation into normalized placement rectangles.
 *
 * Each connected collision component shares equal-width base columns. An
 * event then expands through consecutive deeper columns until the first one
 * containing a collider. This keeps dense sibling chains visually even while
 * still allowing unconstrained events to use the available width.
 *
 * A single intersection sweep records each placement's deeper colliders.
 * Every derived quantity reads that one adjacency: components come from
 * unioning across it, expansion stops at its shallowest entry, and both chain
 * depths are longest paths over it. Collision is symmetric, so the deeper
 * direction alone carries the whole graph.
 */
function positionTimeGridPlacements<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
): TimeGridPlacement<EventMeta>[] {
  // Level order matters below: every placement precedes its deeper colliders.
  const placements = levels.flatMap((level) => level)
  const collidersByKey = new Map<string, Placement<EventMeta>[]>()
  const parentByKey = new Map(placements.map((placement) => [
    placement.sourceSeg.key,
    placement.sourceSeg.key,
  ]))

  for (const placement of placements) {
    const colliders: Placement<EventMeta>[] = []
    for (let levelIndex = placement.levelIndex + 1; levelIndex < levels.length; levelIndex++) {
      colliders.push(...findLevelIntersections(levels[levelIndex], placement))
    }
    collidersByKey.set(placement.sourceSeg.key, colliders)
    for (const collider of colliders) {
      unionPlacementKeys(parentByKey, placement.sourceSeg.key, collider.sourceSeg.key)
    }
  }

  const maxLevelByRoot = new Map<string, number>()
  for (const placement of placements) {
    const root = findPlacementRoot(parentByKey, placement.sourceSeg.key)
    maxLevelByRoot.set(root, Math.max(
      maxLevelByRoot.get(root) ?? 0,
      placement.levelIndex,
    ))
  }

  // Longest chains through the collision graph, as dynamic programming over
  // the adjacency. The backward pass runs shallow-to-deep so a placement's
  // depth is final before it feeds its deeper colliders; the forward pass runs
  // deep-to-shallow for the mirrored reason.
  const backwardDepthByKey = new Map(placements.map((placement) => [placement.sourceSeg.key, 0]))
  const forwardDepthByKey = new Map(placements.map((placement) => [placement.sourceSeg.key, 0]))

  for (const placement of placements) {
    const depth = backwardDepthByKey.get(placement.sourceSeg.key)! + 1
    for (const collider of collidersByKey.get(placement.sourceSeg.key)!) {
      backwardDepthByKey.set(collider.sourceSeg.key, Math.max(
        backwardDepthByKey.get(collider.sourceSeg.key)!,
        depth,
      ))
    }
  }

  for (let index = placements.length - 1; index >= 0; index--) {
    const placement = placements[index]
    let depth = 0
    for (const collider of collidersByKey.get(placement.sourceSeg.key)!) {
      depth = Math.max(depth, forwardDepthByKey.get(collider.sourceSeg.key)! + 1)
    }
    forwardDepthByKey.set(placement.sourceSeg.key, depth)
  }

  return placements.map((placement) => {
    const key = placement.sourceSeg.key
    const levelCount = maxLevelByRoot.get(findPlacementRoot(parentByKey, key))! + 1

    // Expand until the shallowest deeper collider. Colliders always share the
    // component, so their levels stay within its column count.
    let farLevel = levelCount
    for (const collider of collidersByKey.get(key)!) {
      farLevel = Math.min(farLevel, collider.levelIndex)
    }

    const levelCoord = placement.levelIndex / levelCount
    const thickness = (farLevel - placement.levelIndex) / levelCount
    return {
      ...placement,
      levelCoord,
      thickness,
      levelEndCoord: levelCoord + thickness,
      backwardDepth: backwardDepthByKey.get(key)!,
      forwardDepth: forwardDepthByKey.get(key)!,
    }
  })
}

function findPlacementRoot(
  parentByKey: Map<string, string>,
  key: string,
): string {
  const parent = parentByKey.get(key)!
  if (parent === key) return key
  const root = findPlacementRoot(parentByKey, parent)
  parentByKey.set(key, root)
  return root
}

function unionPlacementKeys(
  parentByKey: Map<string, string>,
  first: string,
  second: string,
): void {
  const firstRoot = findPlacementRoot(parentByKey, first)
  const secondRoot = findPlacementRoot(parentByKey, second)
  if (firstRoot !== secondRoot) parentByKey.set(secondRoot, firstRoot)
}
