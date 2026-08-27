/**
 * Pure event-positioning kernel.
 *
 * Source segs own identity and event order. Slices own only lateral geometry,
 * while their outer array index is their dimensionless level. More-link
 * occupants are deliberately kept on hidden groups instead of entering those
 * levels, which keeps coordinate resolution link-blind.
 */

interface LateralSpan {
  start: number
  end: number
}

/** Permissive epsilon for level-axis coordinate and budget comparisons. */
export const GEOMETRY_TOLERANCE = 0.000_001

/** Shared estimate for an event wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_EVENT_THICKNESS = 20

/** Shared estimate for a more-link wrapper that has not reported a thickness. */
export const DEFAULT_UNMEASURED_MORE_LINK_THICKNESS = 20

/**
 * What the kernel requires of a seg. Adapters satisfy it with the production
 * seg itself (DayGrid) or a projected copy of it carrying pixel geometry
 * (Timeline, TimeGrid) — never a wrapper around one.
 */
export interface SourceSeg extends LateralSpan {
  /** Stable whole-source key. Partial-slice keys derive from it (getSliceKey). */
  key: string
  isStart: boolean
  isEnd: boolean
  orderIndex: number
}

export interface Slice<S extends SourceSeg = SourceSeg> extends LateralSpan {
  sourceSeg: S
  isStart: boolean
  isEnd: boolean
}

interface MoreLinkOccupant extends LateralSpan {
  key: string
  levelIndex: number | null
  levelCoord: number | null
  thickness: number
}

export interface HiddenSliceGroup<S extends SourceSeg = SourceSeg> extends LateralSpan {
  key: string
  hiddenSlices: Slice<S>[]
  occupant: MoreLinkOccupant
}

interface LayoutProps<S extends SourceSeg = SourceSeg> {
  segs: readonly S[]
  /** DayGrid-only lateral buckets. Timeline consumes the preceding outputs. */
  cells?: readonly unknown[]
}

interface LevelLimitedOptions {
  eventOrderStrict: boolean
  eventSlicing: boolean
  maxLevels: number
  moreLinkLevelTax: number
}

interface PixelLimitedOptions {
  eventOrderStrict: boolean
  eventSlicing: boolean
}

/** Identifies a whole or partial slice derived from a source seg. */
export function getSliceKey<S extends SourceSeg>(slice: Slice<S>): string {
  if (!isPartialSlice(slice)) return slice.sourceSeg.key
  return `${slice.sourceSeg.key}:${slice.start}:slice`
}

/** Builds whole-source logical levels without consulting any dimensions. */
export function buildSegLevels<S extends SourceSeg>(
  segs: readonly S[],
  eventOrderStrict: boolean,
  maxLevels: number = Infinity,
): {
  segLevels: S[][]
  excludedSegs: S[]
} {
  const segLevels: S[][] = []
  const excludedSegs: S[] = []

  for (const seg of segs) {
    let levelIndex = 0

    if (eventOrderStrict) {
      for (let i = 0; i < segLevels.length; i++) {
        if (findIntersections(segLevels[i], seg).length) levelIndex = i + 1
      }
    } else {
      while (
        levelIndex < segLevels.length &&
        findIntersections(segLevels[levelIndex], seg).length
      ) {
        levelIndex++
      }
    }

    if (levelIndex >= maxLevels) {
      excludedSegs.push(seg)
    } else {
      while (segLevels.length <= levelIndex) segLevels.push([])
      insertLaterally(segLevels[levelIndex], seg)
    }
  }

  return { segLevels, excludedSegs }
}

export function convertSegLevelsToWholeSlices<S extends SourceSeg>(
  segLevels: readonly (readonly S[])[],
): Slice<S>[][] {
  return segLevels.map((level) => convertSegsToWholeSlices(level))
}

export function convertSegsToWholeSlices<S extends SourceSeg>(
  segs: readonly S[],
): Slice<S>[] {
  return segs.map(createWholeSlice)
}

/**
 * Resolves fixed logical levels without changing level membership or slices.
 * An unmeasured slice stays pending; a measured bounded rejection is final.
 * Neither blocks later traversal entries.
 */
export function resolveLevelCoords<S extends SourceSeg>(
  sliceLevels: readonly (readonly Slice<S>[])[],
  sliceHeights: ReadonlyMap<string, number>,
  maxPixels: number = Infinity,
): {
  placementSliceLevels: Slice<S>[][]
  sliceCoords: Map<string, number>
  pendingSlices: Slice<S>[]
  excludedSlices: Slice<S>[]
} {
  const placementSliceLevels = sliceLevels.map(() => [] as Slice<S>[])
  const sliceCoords = new Map<string, number>()
  const pendingSlices: Slice<S>[] = []
  const excludedSlices: Slice<S>[] = []

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    for (const slice of sliceLevels[levelIndex]) {
      const sliceHeight = sliceHeights.get(getSliceKey(slice))
      if (sliceHeight === undefined) {
        pendingSlices.push(slice)
        continue
      }
      let levelCoord = 0

      for (let priorIndex = 0; priorIndex < levelIndex; priorIndex++) {
        for (const other of findIntersections(
          placementSliceLevels[priorIndex],
          slice,
        )) {
          levelCoord = Math.max(
            levelCoord,
            sliceCoords.get(getSliceKey(other))! +
              sliceHeights.get(getSliceKey(other))!,
          )
        }
      }

      if (
        levelCoord + sliceHeight <=
          maxPixels + GEOMETRY_TOLERANCE
      ) {
        placementSliceLevels[levelIndex].push(slice)
        sliceCoords.set(getSliceKey(slice), levelCoord)
      } else {
        excludedSlices.push(slice)
      }
    }
  }

  return { placementSliceLevels, sliceCoords, pendingSlices, excludedSlices }
}

export function mergeExtraIntoLevels<S extends SourceSeg>(
  sliceLevels: Slice<S>[][],
  extraSegSlices: readonly Slice<S>[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  maxLevels: number,
  moreLinkLevelTax: number,
): HiddenSliceGroup<S>[] {
  if (!eventSlicing && !moreLinkLevelTax) {
    return groupLaterallyIntersecting(extraSegSlices)
  }

  const sliceCoords = new Map<string, number>()
  sliceLevels.forEach((level, levelIndex) => {
    for (const slice of level) sliceCoords.set(getSliceKey(slice), levelIndex)
  })

  return mergeExtraIntoStructure(
    sliceLevels,
    sliceCoords,
    extraSegSlices,
    {
      eventOrderStrict,
      eventSlicing,
      allowExtraWholePlacement: true,
      getSliceThickness: () => 1,
      occupantThickness: moreLinkLevelTax,
      isValid: (levelCoord, thickness) =>
        thickness === 0 || levelCoord + thickness <= maxLevels,
    },
  )
}

/**
 * Builds pixel-limited planning topology. The planning thickness must be
 * stable across donor unmounts; the caller resolves exact coordinates after
 * this function has decided which partial-slice donors belong in the DOM.
 */
export function mergeExtraIntoLevelCoords<S extends SourceSeg>(
  sliceLevels: Slice<S>[][],
  sliceCoords: Map<string, number>,
  extraSegSlices: readonly Slice<S>[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  maxPixels: number,
  moreLinkPixelHeight: number,
  getSliceThickness: (slice: Slice<S>) => number,
  forceHiddenSlices: ReadonlySet<Slice<S>> = new Set(),
): HiddenSliceGroup<S>[] {
  return mergeExtraIntoStructure(
    sliceLevels,
    sliceCoords,
    extraSegSlices,
    {
      eventOrderStrict,
      eventSlicing,
      // Pixel extras have already lost whole placement. Only collision-peeled
      // partials may enter topology; otherwise a coordinate-excluded whole
      // could reappear and a DOM-excluded whole would have no render owner.
      allowExtraWholePlacement: false,
      getSliceThickness,
      occupantThickness: moreLinkPixelHeight,
      isValid: (levelCoord, thickness) =>
        levelCoord + thickness <= maxPixels + GEOMETRY_TOLERANCE,
    },
    forceHiddenSlices,
  )
}

export function sortByEventOrder<S extends SourceSeg>(
  slices: readonly Slice<S>[],
): Slice<S>[] {
  return [...slices].sort((a, b) =>
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    a.start - b.start ||
    a.end - b.end,
  )
}

export function compilePixelLimitedRenderSlices<S extends SourceSeg>(
  domWholeSliceLevels: readonly (readonly Slice<S>[])[],
  planningSliceLevels: readonly (readonly Slice<S>[])[],
): Slice<S>[] {
  const renderSlices = domWholeSliceLevels.flat()
  const renderKeys = new Set(renderSlices.map(getSliceKey))

  for (const slices of planningSliceLevels) {
    for (const slice of slices) {
      const key = getSliceKey(slice)
      if (isPartialSlice(slice) && !renderKeys.has(key)) {
        renderSlices.push(slice)
        renderKeys.add(key)
      }
    }
  }

  return renderSlices
}

function federateSlicesByStart<S extends SourceSeg>(
  renderSlices: readonly Slice<S>[],
  colCount: number,
): Slice<S>[][] {
  const slicesByStart = Array.from(
    { length: colCount },
    () => [] as Slice<S>[],
  )

  for (const slice of renderSlices) slicesByStart[slice.start].push(slice)
  for (const slices of slicesByStart) slices.sort(compareSlicesByEventOrder)
  return slicesByStart
}

function compareSlicesByEventOrder<S extends SourceSeg>(
  a: Slice<S>,
  b: Slice<S>,
): number {
  return a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    Number(isPartialSlice(a)) - Number(isPartialSlice(b))
}

function isPartialSlice<S extends SourceSeg>(slice: Slice<S>): boolean {
  return slice.start !== slice.sourceSeg.start ||
    slice.end !== slice.sourceSeg.end
}

/** Merges strict lateral intersections and retains witness encounter order. */
export function groupLaterallyIntersecting<S extends SourceSeg>(
  hiddenSlices: readonly Slice<S>[],
): HiddenSliceGroup<S>[] {
  interface WorkingGroup extends LateralSpan {
    entries: { slice: Slice<S>; order: number }[]
  }

  let groups: WorkingGroup[] = []
  hiddenSlices.forEach((slice, order) => {
    const intersecting: WorkingGroup[] = []
    const untouched: WorkingGroup[] = []
    let start = slice.start
    let end = slice.end

    // A newly widened union can reach a group that did not intersect the
    // original witness, so repeat until the transitive union is exhausted.
    let changed = true
    while (changed) {
      changed = false
      for (const group of groups) {
        if (
          !intersecting.includes(group) &&
          doSpansIntersect(group, { start, end })
        ) {
          intersecting.push(group)
          start = Math.min(start, group.start)
          end = Math.max(end, group.end)
          changed = true
        }
      }
    }

    for (const group of groups) {
      if (!intersecting.includes(group)) untouched.push(group)
    }
    const entries = intersecting.flatMap((group) => group.entries)
    entries.push({ slice, order })
    entries.sort((a, b) => a.order - b.order)
    untouched.push({ start, end, entries })
    groups = untouched
  })

  return groups.map((group) => createPublicGroup(
    group.entries.map((entry) => entry.slice),
    group.start,
    group.end,
  ))
}

export function buildLevelLimitedLayout<S extends SourceSeg>(
  props: LayoutProps<S>,
  options: LevelLimitedOptions,
  sliceHeights: ReadonlyMap<string, number>,
) {
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    options.maxLevels,
  )
  const sliceLevels = convertSegLevelsToWholeSlices(segLevels)
  const hiddenGroups = mergeExtraIntoLevels(
    sliceLevels,
    convertSegsToWholeSlices(excludedSegs),
    options.eventOrderStrict,
    options.eventSlicing,
    options.maxLevels,
    options.moreLinkLevelTax,
  )
  const resolution = resolveLevelCoords(
    sliceLevels,
    sliceHeights,
  )
  const renderSlices = sliceLevels.flat()
  const slicesByStart = props.cells
    ? federateSlicesByStart(renderSlices, props.cells.length)
    : []

  return {
    sliceLevels,
    placementSliceLevels: resolution.placementSliceLevels,
    pendingSlices: resolution.pendingSlices,
    hiddenGroups,
    sliceCoords: resolution.sliceCoords,
    slicesByStart,
  }
}

export function buildPixelLimitedLayout<S extends SourceSeg>(
  props: LayoutProps<S>,
  options: PixelLimitedOptions,
  sliceHeights: ReadonlyMap<string, number>,
  canvasHeight: number | undefined,
  neededLevelCount: number,
  moreLinkHeight: number | undefined,
  getPlanningSliceThickness: ((slice: Slice<S>) => number) | undefined,
) {
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    neededLevelCount,
  )
  const domWholeSliceLevels = convertSegLevelsToWholeSlices(segLevels)
  const domExcludedSlices = convertSegsToWholeSlices(excludedSegs)
  const wholeResolution = resolveLevelCoords(
    domWholeSliceLevels,
    sliceHeights,
    canvasHeight,
  )
  // The merge owns DOM topology and uses stable per-slice planning thicknesses.
  // Exact resolution below owns coordinates.
  const planningSliceLevels = wholeResolution.placementSliceLevels
  let placementSliceLevels = planningSliceLevels
  let sliceCoords = wholeResolution.sliceCoords
  let hiddenGroups = groupLaterallyIntersecting(domExcludedSlices)
  let pendingSlices = wholeResolution.pendingSlices

  // Until every planning dimension is observed, retain only the whole-slice
  // DOM candidates. The next measurement pass can then plan stable partials.
  if (
    canvasHeight != null &&
    moreLinkHeight != null &&
    getPlanningSliceThickness
  ) {
    const extraSlices = sortByEventOrder(
      wholeResolution.excludedSlices.concat(domExcludedSlices),
    )
    hiddenGroups = mergeExtraIntoLevelCoords(
      planningSliceLevels,
      sliceCoords,
      extraSlices,
      options.eventOrderStrict,
      options.eventSlicing,
      canvasHeight,
      moreLinkHeight,
      getPlanningSliceThickness,
      new Set(domExcludedSlices),
    )
    const exactResolution = resolveLevelCoords(
      planningSliceLevels,
      sliceHeights,
    )
    placementSliceLevels = exactResolution.placementSliceLevels
    sliceCoords = exactResolution.sliceCoords
    pendingSlices = pendingSlices.concat(exactResolution.pendingSlices)
  }

  const renderSlices = compilePixelLimitedRenderSlices(
    domWholeSliceLevels,
    planningSliceLevels,
  )
  const slicesByStart = federateSlicesByStart(
    renderSlices,
    props.cells.length,
  )

  return {
    domWholeSliceLevels,
    placementSliceLevels,
    pendingSlices,
    hiddenGroups,
    sliceCoords,
    slicesByStart,
  }
}

interface MergeOptions<S extends SourceSeg> {
  eventOrderStrict: boolean
  eventSlicing: boolean
  allowExtraWholePlacement: boolean
  /** Stable planning thickness for each slice while constructing DOM topology. */
  getSliceThickness: (slice: Slice<S>) => number
  occupantThickness: number
  isValid: (levelCoord: number, thickness: number) => boolean
}

interface Insertion {
  levelIndex: number
  levelCoord: number
}

/**
 * Shared fire/collide/peel/consume implementation for both currencies.
 *
 * Hiding is minimal-footprint: a slice that cannot place whole loses exactly
 * the lateral spans where no admissible position exists, decided by probing
 * the elementary intervals between collider edges, and the feasible remainder
 * re-fires. Consumption applies the same rule to an unplaceable occupant's
 * over-budget spans. A colliding barrier's own span never widens a footprint.
 */
function mergeExtraIntoStructure<S extends SourceSeg>(
  sliceLevels: Slice<S>[][],
  sliceCoords: Map<string, number>,
  extraSegSlices: readonly Slice<S>[],
  options: MergeOptions<S>,
  forceHiddenSlices: ReadonlySet<Slice<S>> = new Set(),
): HiddenSliceGroup<S>[] {
  let hiddenGroups: HiddenSliceGroup<S>[] = []
  let hiddenOrder = 0
  const hiddenOrders = new Map<Slice<S>, number>()

  const getSliceCoord = (slice: Slice<S>, levelIndex: number) =>
    sliceCoords.get(getSliceKey(slice)) ?? levelIndex

  const getSliceBottom = (slice: Slice<S>, levelIndex: number) =>
    getSliceCoord(slice, levelIndex) + options.getSliceThickness(slice)

  function addHiddenRaw(slice: Slice<S>): HiddenSliceGroup<S> {
    hiddenOrders.set(slice, hiddenOrder++)
    const intersecting = hiddenGroups.filter((group) =>
      doSpansIntersect(group, slice),
    )
    const untouched = hiddenGroups.filter((group) =>
      !intersecting.includes(group),
    )
    const hiddenSlices = intersecting.flatMap((group) => group.hiddenSlices)
    hiddenSlices.push(slice)
    hiddenSlices.sort((a, b) => hiddenOrders.get(a)! - hiddenOrders.get(b)!)
    const start = Math.min(slice.start, ...intersecting.map((group) => group.start))
    const end = Math.max(slice.end, ...intersecting.map((group) => group.end))
    const group = createPublicGroup(hiddenSlices, start, end)
    group.occupant.thickness = options.occupantThickness
    hiddenGroups = untouched.concat(group)
    return group
  }

  function positionOccupants(): HiddenSliceGroup<S> | undefined {
    for (const group of hiddenGroups) {
      const colliders = collectIntersectingSlices(sliceLevels, group)
      group.occupant.levelIndex = colliders.length
        ? Math.max(...colliders.map((item) => item.levelIndex)) + 1
        : 0
      group.occupant.levelCoord = colliders.length
        ? Math.max(...colliders.map((item) =>
          getSliceBottom(item.slice, item.levelIndex),
        ))
        : 0
      if (!options.isValid(
        group.occupant.levelCoord,
        group.occupant.thickness,
      )) return group
    }
    return undefined
  }

  /** The insertion search under the caller's budget, or null when none fits. */
  function findValidInsertion(slice: Slice<S>): Insertion | null {
    const insertion = findInsertion(
      sliceLevels,
      sliceCoords,
      hiddenGroups,
      slice,
      options,
    )
    return insertion &&
      options.isValid(insertion.levelCoord, options.getSliceThickness(slice))
      ? insertion
      : null
  }

  /**
   * Lateral coordinates where a span's collision environment can change.
   * Between consecutive breakpoints, feasibility is constant.
   */
  function collectBreakpoints(span: LateralSpan): number[] {
    const coords = new Set([span.start, span.end])
    const admit = (coord: number) => {
      if (coord > span.start && coord < span.end) coords.add(coord)
    }

    for (const item of collectIntersectingSlices(sliceLevels, span)) {
      admit(item.slice.start)
      admit(item.slice.end)
    }
    if (options.occupantThickness) {
      for (const group of hiddenGroups) {
        if (group.occupant.levelIndex != null && doSpansIntersect(group, span)) {
          admit(group.start)
          admit(group.end)
        }
      }
    }
    return [...coords].sort((a, b) => a - b)
  }

  /** Discovers candidate runs with the stable planning thickness. */
  function partitionByFeasibility(
    slice: Slice<S>,
  ): {
    feasibleRuns: Slice<S>[]
    infeasibleSpans: Slice<S>[]
  } {
    const breakpoints = collectBreakpoints(slice)
    const feasible: LateralSpan[] = []
    const infeasible: LateralSpan[] = []

    for (let i = 0; i < breakpoints.length - 1; i++) {
      const start = breakpoints[i]
      const end = breakpoints[i + 1]
      const candidate = createNarrowerSlice(slice, start, end)
      const spans = findValidInsertion(candidate)
        ? feasible
        : infeasible
      const previous = spans[spans.length - 1]
      if (previous && previous.end === start) previous.end = end
      else spans.push({ start, end })
    }

    const narrow = (span: LateralSpan) =>
      createNarrowerSlice(slice, span.start, span.end)
    return {
      feasibleRuns: feasible.map(narrow),
      infeasibleSpans: infeasible.map(narrow),
    }
  }

  /**
   * Handles a fully feasible slice that still fits no single position:
   * adjacent runs can be individually admissible only at disjoint levels.
   * Places the longest placeable proper prefix and re-fires the rest.
   */
  function placeLongestPrefix(
    slice: Slice<S>,
  ): boolean {
    const breakpoints = collectBreakpoints(slice)

    for (let i = breakpoints.length - 2; i >= 1; i--) {
      const prefix = createNarrowerSlice(slice, slice.start, breakpoints[i])
      const insertion = findValidInsertion(prefix)
      if (insertion) {
        fireSlice(prefix)
        for (const rest of peelSlice(slice, prefix)) fireSlice(rest)
        return true
      }
    }
    return false
  }

  /** The sub-spans of a group where its occupant's budget is exceeded. */
  function findOccupantViolations(group: HiddenSliceGroup<S>): LateralSpan[] {
    const colliders = collectIntersectingSlices(sliceLevels, group)
    const coords = new Set([group.start, group.end])
    for (const item of colliders) {
      if (item.slice.start > group.start && item.slice.start < group.end) {
        coords.add(item.slice.start)
      }
      if (item.slice.end > group.start && item.slice.end < group.end) {
        coords.add(item.slice.end)
      }
    }
    const breakpoints = [...coords].sort((a, b) => a - b)
    const violations: LateralSpan[] = []

    for (let i = 0; i < breakpoints.length - 1; i++) {
      const span = { start: breakpoints[i], end: breakpoints[i + 1] }
      let bottom = 0
      for (const item of colliders) {
        if (doSpansIntersect(item.slice, span)) {
          bottom = Math.max(bottom, getSliceBottom(item.slice, item.levelIndex))
        }
      }
      if (!options.isValid(bottom, group.occupant.thickness)) {
        const previous = violations[violations.length - 1]
        if (previous && previous.end === span.start) previous.end = span.end
        else violations.push(span)
      }
    }
    return violations
  }

  function consumeInvalidOccupants(): void {
    const refires: Slice<S>[] = []
    let invalidGroup: HiddenSliceGroup<S> | undefined

    while ((invalidGroup = positionOccupants())) {
      const violations = findOccupantViolations(invalidGroup)
      const colliders: { slice: Slice<S>; levelIndex: number }[] = []
      for (const violation of violations) {
        for (const item of collectIntersectingSlices(sliceLevels, violation)) {
          if (!colliders.some((other) => other.slice === item.slice)) {
            colliders.push(item)
          }
        }
      }
      if (!colliders.length) break
      const frontierBottom = Math.max(...colliders.map((item) =>
        getSliceBottom(item.slice, item.levelIndex),
      ))
      const frontier = colliders.filter((item) =>
        getSliceBottom(item.slice, item.levelIndex) === frontierBottom,
      )

      for (const item of frontier) {
        if (!sliceLevels[item.levelIndex].includes(item.slice)) continue
        removeSlice(sliceLevels, sliceCoords, item.slice, item.levelIndex)

        if (options.eventSlicing) {
          // Frontier members intersect a violation by construction, so
          // consumption always leaves a non-empty footprint.
          const footprints = violations
            .map((violation) => intersectSlice(item.slice, violation))
            .filter((footprint): footprint is Slice<S> => footprint != null)
          for (const footprint of footprints) addHiddenRaw(footprint)
          refires.push(...subtractSpans(item.slice, footprints))
        } else {
          addHiddenRaw(item.slice)
        }
      }
    }

    positionOccupants()
    for (const slice of refires) fireSlice(slice)
  }

  function fireSlice(
    slice: Slice<S>,
    mayPlaceWhole: boolean = true,
  ): void {
    const insertion = findValidInsertion(slice)

    if (insertion && (mayPlaceWhole || isPartialSlice(slice))) {
      insertSlice(
        sliceLevels,
        sliceCoords,
        slice,
        insertion.levelIndex,
        insertion.levelCoord,
      )
      return
    }

    // A placeable-but-disallowed whole falls through to hide: only a genuine
    // geometric failure earns a slicing pass.
    if (options.eventSlicing && !insertion) {
      const { feasibleRuns, infeasibleSpans } = partitionByFeasibility(slice)

      if (feasibleRuns.length && infeasibleSpans.length) {
        for (const span of infeasibleSpans) addHiddenRaw(span)
        consumeInvalidOccupants()
        for (const run of feasibleRuns) fireSlice(run)
        return
      }
      if (
        !infeasibleSpans.length &&
        placeLongestPrefix(slice)
      ) return
    }

    addHiddenRaw(slice)
    consumeInvalidOccupants()
  }

  for (const extra of extraSegSlices) {
    if (forceHiddenSlices.has(extra)) {
      addHiddenRaw(extra)
      consumeInvalidOccupants()
    } else {
      fireSlice(extra, options.allowExtraWholePlacement)
    }
  }
  positionOccupants()
  return hiddenGroups
}

/**
 * Finds the smallest geometrically admissible position, ignoring the
 * caller's budget. Null means no position exists at all: strict-order or
 * occupant fencing has closed every level, including a newly appended one.
 */
function findInsertion<S extends SourceSeg>(
  sliceLevels: readonly (readonly Slice<S>[])[],
  sliceCoords: ReadonlyMap<string, number>,
  hiddenGroups: readonly HiddenSliceGroup<S>[],
  slice: Slice<S>,
  options: MergeOptions<S>,
): Insertion | null {
  const collidersByLevel = sliceLevels.map((level) =>
    findIntersections(level, slice),
  )
  const getCoord = (other: Slice<S>, levelIndex: number) =>
    sliceCoords.get(getSliceKey(other)) ?? levelIndex
  const getBottom = (other: Slice<S>, levelIndex: number) =>
    getCoord(other, levelIndex) + options.getSliceThickness(other)
  let strictMinLevelIndex = 0
  let strictMaxLevelIndexExclusive = Infinity

  if (options.eventOrderStrict) {
    collidersByLevel.forEach((colliders, levelIndex) => {
      for (const other of colliders) {
        if (other.sourceSeg.orderIndex < slice.sourceSeg.orderIndex) {
          strictMinLevelIndex = Math.max(strictMinLevelIndex, levelIndex + 1)
        } else if (other.sourceSeg.orderIndex > slice.sourceSeg.orderIndex) {
          strictMaxLevelIndexExclusive = Math.min(
            strictMaxLevelIndexExclusive,
            levelIndex,
          )
        }
      }
    })
  }

  const occupantGroups = options.occupantThickness
    ? hiddenGroups.filter((group) =>
      group.occupant.levelIndex != null && doSpansIntersect(group, slice),
    )
    : []
  for (const group of occupantGroups) {
    strictMaxLevelIndexExclusive = Math.min(
      strictMaxLevelIndexExclusive,
      group.occupant.levelIndex!,
    )
  }

  const ceilings: number[] = []
  let ceiling = occupantGroups.length
    ? Math.min(...occupantGroups.map((group) => group.occupant.levelCoord!))
    : Infinity
  for (let levelIndex = sliceLevels.length - 1; levelIndex >= 0; levelIndex--) {
    ceilings[levelIndex] = ceiling
    for (const other of collidersByLevel[levelIndex]) {
      ceiling = Math.min(ceiling, getCoord(other, levelIndex))
    }
  }

  let minLevelCoord = 0
  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    if (
      !collidersByLevel[levelIndex].length &&
      levelIndex >= strictMinLevelIndex &&
      levelIndex < strictMaxLevelIndexExclusive &&
      minLevelCoord + options.getSliceThickness(slice) <=
        ceilings[levelIndex] + GEOMETRY_TOLERANCE
    ) {
      return { levelIndex, levelCoord: minLevelCoord }
    }

    for (const other of collidersByLevel[levelIndex]) {
      minLevelCoord = Math.max(minLevelCoord, getBottom(other, levelIndex))
    }
  }

  if (sliceLevels.length >= strictMaxLevelIndexExclusive) return null

  return { levelIndex: sliceLevels.length, levelCoord: minLevelCoord }
}

function createWholeSlice<S extends SourceSeg>(
  sourceSeg: S,
): Slice<S> {
  return {
    sourceSeg,
    start: sourceSeg.start,
    end: sourceSeg.end,
    isStart: sourceSeg.isStart,
    isEnd: sourceSeg.isEnd,
  }
}

function intersectSlice<S extends SourceSeg>(
  slice: Slice<S>,
  barrier: LateralSpan,
): Slice<S> | null {
  const start = Math.max(slice.start, barrier.start)
  const end = Math.min(slice.end, barrier.end)
  return start < end ? createNarrowerSlice(slice, start, end) : null
}

function createNarrowerSlice<S extends SourceSeg>(
  parent: Slice<S>,
  start: number,
  end: number,
): Slice<S> {
  return {
    sourceSeg: parent.sourceSeg,
    start,
    end,
    isStart: parent.isStart && start === parent.start,
    isEnd: parent.isEnd && end === parent.end,
  }
}

function peelSlice<S extends SourceSeg>(
  slice: Slice<S>,
  barrier: LateralSpan,
): Slice<S>[] {
  const remainders: Slice<S>[] = []
  if (slice.start < barrier.start) {
    remainders.push(createNarrowerSlice(slice, slice.start, barrier.start))
  }
  if (slice.end > barrier.end) {
    remainders.push(createNarrowerSlice(slice, barrier.end, slice.end))
  }
  return remainders
}

/** Generalizes peelSlice to any set of removed spans, including interior ones. */
function subtractSpans<S extends SourceSeg>(
  slice: Slice<S>,
  spans: readonly LateralSpan[],
): Slice<S>[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const remainders: Slice<S>[] = []
  let cursor = slice.start

  for (const span of sorted) {
    if (span.start > cursor) {
      remainders.push(
        createNarrowerSlice(slice, cursor, Math.min(span.start, slice.end)),
      )
    }
    cursor = Math.max(cursor, span.end)
    if (cursor >= slice.end) return remainders
  }
  if (cursor < slice.end) {
    remainders.push(createNarrowerSlice(slice, cursor, slice.end))
  }
  return remainders
}

function collectIntersectingSlices<S extends SourceSeg>(
  sliceLevels: readonly (readonly Slice<S>[])[],
  span: LateralSpan,
): { slice: Slice<S>; levelIndex: number }[] {
  return sliceLevels.flatMap((level, levelIndex) =>
    findIntersections(level, span).map((slice) => ({ slice, levelIndex })),
  )
}

function insertSlice<S extends SourceSeg>(
  sliceLevels: Slice<S>[][],
  sliceCoords: Map<string, number>,
  slice: Slice<S>,
  levelIndex: number,
  levelCoord: number,
): void {
  while (sliceLevels.length <= levelIndex) sliceLevels.push([])
  insertLaterally(sliceLevels[levelIndex], slice)
  sliceCoords.set(getSliceKey(slice), levelCoord)
}

function removeSlice<S extends SourceSeg>(
  sliceLevels: Slice<S>[][],
  sliceCoords: Map<string, number>,
  slice: Slice<S>,
  levelIndex: number,
): void {
  const index = sliceLevels[levelIndex].indexOf(slice)
  if (index !== -1) sliceLevels[levelIndex].splice(index, 1)
  sliceCoords.delete(getSliceKey(slice))
}

export function findIntersections<Item extends LateralSpan>(
  entries: readonly Item[],
  span: LateralSpan,
): Item[] {
  let index = findLowerBoundByStart(entries, span.start)
  if (index > 0) index--
  const matches: Item[] = []

  for (; index < entries.length; index++) {
    const entry = entries[index]
    if (entry.start >= span.end) break
    if (doSpansIntersect(entry, span)) matches.push(entry)
  }
  return matches
}

/** Returns the integer lateral cells intersected by one lateral span. */
export function getLateralCellRange(
  span: LateralSpan,
  cellCount: number,
): LateralSpan {
  return {
    start: Math.min(cellCount, Math.max(0, Math.floor(span.start))),
    end: Math.min(cellCount, Math.max(0, Math.ceil(span.end))),
  }
}

function insertLaterally<Item extends LateralSpan>(
  entries: Item[],
  entry: Item,
): void {
  entries.splice(findLowerBoundByStart(entries, entry.start), 0, entry)
}

function findLowerBoundByStart<Item extends LateralSpan>(
  entries: readonly Item[],
  start: number,
): number {
  let low = 0
  let high = entries.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (entries[middle].start < start) low = middle + 1
    else high = middle
  }
  return low
}

function doSpansIntersect(a: LateralSpan, b: LateralSpan): boolean {
  return a.start < b.end && b.start < a.end
}

function createPublicGroup<S extends SourceSeg>(
  hiddenSlices: Slice<S>[],
  start: number,
  end: number,
): HiddenSliceGroup<S> {
  const key = getSliceKey(hiddenSlices[0])
  return {
    key,
    start,
    end,
    hiddenSlices,
    occupant: {
      key: `${key}:more`,
      start,
      end,
      levelIndex: null,
      levelCoord: null,
      thickness: 0,
    },
  }
}
