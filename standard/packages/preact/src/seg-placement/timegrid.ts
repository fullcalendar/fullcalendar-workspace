/**
 * TimeGrid dimensionless leveling and pressure-based expansion
 * ============================================================
 *
 * TimeGrid rotates the visual meaning of the shared kernel's level structure.
 * A seg's lateral `start`/`end` span runs down the visible time axis, while
 * logical levels proceed across the column's horizontal thickness. Siblings
 * in one level therefore have non-overlapping time spans.
 *
 * The kernel admits whole segs directly into dimensionless levels and rejects
 * anything beyond `maxLevels`. This module treats the retained levels as a
 * collision web and pressure-expands them across a normalized 0...1 range.
 * Hidden segs are grouped afterward for TimeGrid's tax-free more-link overlay.
 */

import {
  type HiddenSliceGroup,
  type SourceSeg,
  buildTimeGridLevelInputs,
  convertSegsToWholeSlices,
  findIntersections,
  groupLaterallyIntersecting,
} from './kernel'

/** TimeGrid policies that affect dimensionless level construction. */
interface TimeGridLayoutOptions {
  /** Preserves the caller's resolved event priority through all collisions. */
  orderStrict: boolean
}

/** One visible source after its logical level is pressure-expanded. */
interface TimeGridPlacement<S extends SourceSeg = SourceSeg> {
  sourceSeg: S
  start: number
  end: number
  isStart: boolean
  isEnd: boolean
  /** Dimensionless kernel level, also the placement's collision-web depth. */
  levelIndex: number
  /** Normalized final geometry, replacing the deleted unit-height currency. */
  levelCoord: number
  thickness: number
  levelEndCoord: number
  /** Longest visible collision chain extending backward from this placement. */
  backwardDepth: number
  /** Longest visible collision chain extending forward from this placement. */
  forwardDepth: number
}

/** TimeGrid's existing more-link group projection over kernel hidden groups. */
interface TimeGridMoreLinkGroup<S extends SourceSeg = SourceSeg>
  extends HiddenSliceGroup<S> {
  count: number
}

/** Complete reusable output needed to render one TimeGrid column. */
interface TimeGridColumnLayout<S extends SourceSeg = SourceSeg> {
  /** Dimensionless kernel levels consumed by the collision-web projection. */
  pressureWebSegLevels: S[][]
  /** Whole segs rejected directly by the kernel's max-level admission pass. */
  globbedMoreLinkSegs: S[]
  /** Final visible placements in temporal-start/event-order. */
  domOrderedPlacements: TimeGridPlacement<S>[]
  /** Tax-free overlay links formed only after level admission has completed. */
  moreLinkGroups: TimeGridMoreLinkGroup<S>[]
}

/** Builds, limits, and pressure-expands one TimeGrid day/resource column. */
export function layoutTimeGridColumnByMaxLevel<S extends SourceSeg>(
  eventOrderedSegs: readonly S[],
  maxLevels: number,
  options: TimeGridLayoutOptions,
): TimeGridColumnLayout<S> {
  const { pressureWebSegLevels, globbedMoreLinkSegs } =
    buildTimeGridLevelInputs(
      { segs: eventOrderedSegs },
      { eventOrderStrict: options.orderStrict, maxLevels },
    )
  const placements = positionTimeGridPlacements(pressureWebSegLevels)
  const moreLinkGroups = groupLaterallyIntersecting(
    convertSegsToWholeSlices(globbedMoreLinkSegs),
  )
    .map((group) => ({
      ...group,
      count: new Set(
        group.hiddenSlices.map((slice) => slice.sourceSeg.key),
      ).size,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end)

  return {
    pressureWebSegLevels,
    globbedMoreLinkSegs,
    domOrderedPlacements: orderTimeGridPlacements(placements),
    moreLinkGroups,
  }
}

/**
 * Turns retained dimensionless levels into normalized placement rectangles.
 *
 * Each connected collision component shares equal-width base columns. An
 * event then expands through consecutive deeper columns until the first one
 * containing a collider. A single intersection sweep supplies component
 * membership, expansion stops, and backward/forward longest-chain depths.
 */
function positionTimeGridPlacements<S extends SourceSeg>(
  levels: readonly (readonly S[])[],
): TimeGridPlacement<S>[] {
  const placementLevels = levels.map((level, levelIndex) =>
    level.map((sourceSeg) => ({
      sourceSeg,
      start: sourceSeg.start,
      end: sourceSeg.end,
      isStart: sourceSeg.isStart,
      isEnd: sourceSeg.isEnd,
      levelIndex,
    })),
  )
  // Level order matters below: every placement precedes its deeper colliders.
  const placements = placementLevels.flat()
  const collidersByKey = new Map<string, typeof placements>()
  const parentByKey = new Map(placements.map((placement) => [
    placement.sourceSeg.key,
    placement.sourceSeg.key,
  ]))

  for (const placement of placements) {
    const colliders: typeof placements = []
    for (
      let levelIndex = placement.levelIndex + 1;
      levelIndex < levels.length;
      levelIndex += 1
    ) {
      colliders.push(...findIntersections(
        placementLevels[levelIndex],
        placement,
      ))
    }
    collidersByKey.set(placement.sourceSeg.key, colliders)
    for (const collider of colliders) {
      unionPlacementKeys(
        parentByKey,
        placement.sourceSeg.key,
        collider.sourceSeg.key,
      )
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
  // the adjacency. The passes run in opposite level orders so each dependency
  // is final before it contributes to the next placement.
  const backwardDepthByKey = new Map(placements.map((placement) => [
    placement.sourceSeg.key,
    0,
  ]))
  const forwardDepthByKey = new Map(placements.map((placement) => [
    placement.sourceSeg.key,
    0,
  ]))

  for (const placement of placements) {
    const depth = backwardDepthByKey.get(placement.sourceSeg.key)! + 1
    for (const collider of collidersByKey.get(placement.sourceSeg.key)!) {
      backwardDepthByKey.set(collider.sourceSeg.key, Math.max(
        backwardDepthByKey.get(collider.sourceSeg.key)!,
        depth,
      ))
    }
  }

  for (let index = placements.length - 1; index >= 0; index -= 1) {
    const placement = placements[index]
    let depth = 0
    for (const collider of collidersByKey.get(placement.sourceSeg.key)!) {
      depth = Math.max(
        depth,
        forwardDepthByKey.get(collider.sourceSeg.key)! + 1,
      )
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

function orderTimeGridPlacements<S extends SourceSeg>(
  placements: readonly TimeGridPlacement<S>[],
): TimeGridPlacement<S>[] {
  return [...placements].sort((a, b) =>
    a.start - b.start ||
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex,
  )
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
