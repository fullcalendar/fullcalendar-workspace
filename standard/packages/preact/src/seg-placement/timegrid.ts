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
 * levels as a collision DAG and pressure-expands the visible events across a
 * normalized level-axis range from 0 through 1. Each event's level coordinate
 * is constrained by every shallower collider, rather than whichever recursive
 * path happened to reach a shared child first.
 *
 * The more links are a final overlay projection. They group intersecting
 * hidden time spans, but consume no level-axis thickness and impose no tax on
 * the event layout. TimeGrid also disables event slicing: a rejected source is
 * hidden whole, although the common limiter may still compact that whole
 * source into a shallower opening before hiding it.
 *
 * Legacy production counterparts
 * ------------------------------
 *
 * `seg-hierarchy.ts` builds and limits the current level structure,
 * `timegrid/seg-web.ts` builds and stretches its pressure web, and
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
   * Retained for tests and as a reference for the production port; the
   * TimeGrid component itself is not meant to consume this intermediate data.
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
 * Placements are processed from shallower to deeper levels. Every placement
 * begins beyond the natural level end of every shallower collider. Its
 * remaining space is divided by the longest forward collision pressure, so a
 * later collider can never force it past the normalized canvas edge.
 *
 * The keyed map this builds is only the by-key lookup those earlier colliders
 * are read through, so the placements come back as a plain level-ordered array
 * for the caller to reorder for the DOM.
 */
function positionTimeGridPlacements<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
): TimeGridPlacement<EventMeta>[] {
  const forwardPressures = calculateTimeGridForwardPressures(levels)
  const placementByKey = new Map<string, TimeGridPlacement<EventMeta>>()

  // Process levels from shallowest to deepest so every earlier collider has
  // already received its final level-axis position.
  for (const [levelIndex, level] of levels.entries()) {
    for (const placement of level) {
      let levelCoord = 0
      let backwardDepth = 0

      // A placement can collide with events in several earlier levels. Begin
      // after the furthest-reaching one, and retain the longest backward chain.
      for (
        let earlierLevelIndex = 0;
        earlierLevelIndex < levelIndex;
        earlierLevelIndex++
      ) {
        const earlierLevel = levels[earlierLevelIndex]!
        for (const earlier of findLevelIntersections(earlierLevel, placement)) {
          const earlierPosition = placementByKey.get(earlier.sourceSeg.key)!
          levelCoord = Math.max(
            levelCoord,
            earlierPosition.levelEndCoord,
          )
          backwardDepth = Math.max(
            backwardDepth,
            earlierPosition.backwardDepth + 1,
          )
        }
      }

      // Reserve equal shares of the remaining space for this placement and
      // the longest chain of colliders that can follow it.
      const pressure = forwardPressures.get(placement.sourceSeg.key)!
      const thickness = (1 - levelCoord) / pressure
      const levelEndCoord = levelCoord + thickness

      placementByKey.set(placement.sourceSeg.key, {
        ...placement,
        levelCoord,
        thickness,
        levelEndCoord,
        backwardDepth,
        forwardDepth: pressure - 1,
      })
    }
  }

  return [...placementByKey.values()]
}

/** Finds the longest strictly deeper collision chain from every placement. */
function calculateTimeGridForwardPressures<EventMeta>(
  levels: readonly PlacementLevel<EventMeta>[],
): ReadonlyMap<string, number> {
  const forwardPressures = new Map<string, number>()

  // Work from deepest to shallowest so every possible forward collider has
  // already had its own forward pressure calculated.
  for (let levelIndex = levels.length - 1; levelIndex >= 0; levelIndex--) {
    const level = levels[levelIndex]!

    for (const placement of level) {
      let maximumForwardPressure = 0

      // A collision in any deeper level can continue the chain. The longest
      // such continuation determines how much space this placement must save.
      for (
        let laterLevelIndex = levelIndex + 1;
        laterLevelIndex < levels.length;
        laterLevelIndex++
      ) {
        const laterLevel = levels[laterLevelIndex]!
        for (const later of findLevelIntersections(laterLevel, placement)) {
          maximumForwardPressure = Math.max(
            maximumForwardPressure,
            forwardPressures.get(later.sourceSeg.key)!,
          )
        }
      }

      // Include the placement itself in the pressure count.
      forwardPressures.set(
        placement.sourceSeg.key,
        1 + maximumForwardPressure,
      )
    }
  }

  return forwardPressures
}
