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

export interface SourceSeg<EventMeta = unknown> extends LateralSpan {
  /** Stable whole-source key, equal to DayGrid's unsliced event-part key. */
  key: string
  /** Event-level key used to reproduce DayGrid's partial event-part keys. */
  eventKey: string
  meta: EventMeta
  isStart: boolean
  isEnd: boolean
  orderIndex: number
}

export interface Slice<EventMeta = unknown> extends LateralSpan {
  sourceSeg: SourceSeg<EventMeta>
  isStart: boolean
  isEnd: boolean
}

interface MoreLinkOccupant extends LateralSpan {
  key: string
  levelIndex: number | null
  levelCoord: number | null
  thickness: number
}

export interface HiddenSliceGroup<EventMeta = unknown> extends LateralSpan {
  key: string
  hiddenSlices: Slice<EventMeta>[]
  occupant: MoreLinkOccupant
}

/**
 * Owner-local exact slice measurements, keyed by slice part key. Production
 * uses a plain RefMap of measured wrapper heights: reports are trusted as
 * valid occupied dimensions, and RefMap's delete-on-null keeps entries in
 * step with unmounts, so a present value always means a live measurement.
 * The owner's ratchet updates in the same RefMap callback that recorded the
 * value, before any re-solve can read the map.
 */
export interface SliceHeightMap<HeightRef = unknown> {
  current: ReadonlyMap<string, number>
  createRef(key: string): HeightRef
}

export interface PlacementRatchet {
  neededLevelCount: number
  smallestSliceHeight?: number
  largestSliceHeight?: number
  largestCanvasHeight?: number
}

export type GetRatchet = (canvasHeight?: number) => PlacementRatchet

interface LayoutProps<EventMeta = unknown> {
  segs: readonly SourceSeg<EventMeta>[]
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

interface TimeGridLevelOptions {
  eventOrderStrict: boolean
  maxLevels: number
}

export interface SliceRenderItem<EventMeta = unknown, HeightRef = unknown> {
  key: string
  slice: Slice<EventMeta>
  style: {
    visibility: '' | 'hidden'
    top: number | undefined
  }
  heightRef: HeightRef
}

export function getSliceKey<EventMeta>(slice: Slice<EventMeta>): string {
  if (!isPartialSlice(slice)) return slice.sourceSeg.key
  return `${slice.sourceSeg.eventKey}:${slice.start}:slice`
}

/** Builds whole-source logical levels without consulting any dimensions. */
export function buildSegLevels<EventMeta>(
  segs: readonly SourceSeg<EventMeta>[],
  eventOrderStrict: boolean,
  maxLevels: number = Infinity,
): {
  segLevels: SourceSeg<EventMeta>[][]
  excludedSegs: SourceSeg<EventMeta>[]
} {
  const segLevels: SourceSeg<EventMeta>[][] = []
  const excludedSegs: SourceSeg<EventMeta>[] = []

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

export function convertSegLevelsToWholeSlices<EventMeta>(
  segLevels: readonly (readonly SourceSeg<EventMeta>[])[],
): Slice<EventMeta>[][] {
  return segLevels.map((level) => convertSegsToWholeSlices(level))
}

export function convertSegsToWholeSlices<EventMeta>(
  segs: readonly SourceSeg<EventMeta>[],
): Slice<EventMeta>[] {
  return segs.map(createWholeSlice)
}

/**
 * Resolves fixed logical levels without changing level membership or slices.
 * A bounded rejection is final and does not block later traversal entries.
 */
export function resolveLevelCoords<EventMeta>(
  sliceLevels: readonly (readonly Slice<EventMeta>[])[],
  getPlanningSliceHeight: (slice: Slice<EventMeta>) => number,
  maxPixels: number = Infinity,
): {
  placementSliceLevels: Slice<EventMeta>[][]
  sliceCoords: Map<string, number>
  excludedSlices: Slice<EventMeta>[]
} {
  const placementSliceLevels = sliceLevels.map(() => [] as Slice<EventMeta>[])
  const sliceCoords = new Map<string, number>()
  const excludedSlices: Slice<EventMeta>[] = []

  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    for (const slice of sliceLevels[levelIndex]) {
      let levelCoord = 0

      for (let priorIndex = 0; priorIndex < levelIndex; priorIndex++) {
        for (const other of findIntersections(
          placementSliceLevels[priorIndex],
          slice,
        )) {
          levelCoord = Math.max(
            levelCoord,
            sliceCoords.get(getSliceKey(other))! +
              getPlanningSliceHeight(other),
          )
        }
      }

      if (
        levelCoord + getPlanningSliceHeight(slice) <=
          maxPixels + GEOMETRY_TOLERANCE
      ) {
        placementSliceLevels[levelIndex].push(slice)
        sliceCoords.set(getSliceKey(slice), levelCoord)
      } else {
        excludedSlices.push(slice)
      }
    }
  }

  return { placementSliceLevels, sliceCoords, excludedSlices }
}

export function mergeExtraIntoLevels<EventMeta>(
  sliceLevels: Slice<EventMeta>[][],
  extraSegSlices: readonly Slice<EventMeta>[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  maxLevels: number,
  moreLinkLevelTax: number,
): HiddenSliceGroup<EventMeta>[] {
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
      sliceThickness: 1,
      occupantThickness: moreLinkLevelTax,
      isValid: (levelCoord, thickness) =>
        thickness === 0 || levelCoord + thickness <= maxLevels,
    },
  )
}

export function mergeExtraIntoLevelCoords<EventMeta>(
  sliceLevels: Slice<EventMeta>[][],
  sliceCoords: Map<string, number>,
  extraSegSlices: readonly Slice<EventMeta>[],
  eventOrderStrict: boolean,
  eventSlicing: boolean,
  maxPixels: number,
  moreLinkPixelHeight: number,
  provisionalSliceHeight: number,
): HiddenSliceGroup<EventMeta>[] {
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
      sliceThickness: provisionalSliceHeight,
      occupantThickness: moreLinkPixelHeight,
      isValid: (levelCoord, thickness) =>
        levelCoord + thickness <= maxPixels + GEOMETRY_TOLERANCE,
    },
  )
}

export function sortByEventOrder<EventMeta>(
  slices: readonly Slice<EventMeta>[],
): Slice<EventMeta>[] {
  return [...slices].sort((a, b) =>
    a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    a.start - b.start ||
    a.end - b.end,
  )
}

export function compilePixelLimitedRenderSlices<EventMeta>(
  domWholeSliceLevels: readonly (readonly Slice<EventMeta>[])[],
  placementSliceLevels: readonly (readonly Slice<EventMeta>[])[],
): Slice<EventMeta>[] {
  const renderSlices = domWholeSliceLevels.flat()

  for (const placementLevel of placementSliceLevels) {
    for (const slice of placementLevel) {
      if (isPartialSlice(slice)) renderSlices.push(slice)
    }
  }

  return renderSlices
}

function federateSlicesByStart<EventMeta>(
  renderSlices: readonly Slice<EventMeta>[],
  colCount: number,
): Slice<EventMeta>[][] {
  const slicesByStart = Array.from(
    { length: colCount },
    () => [] as Slice<EventMeta>[],
  )

  for (const slice of renderSlices) slicesByStart[slice.start].push(slice)
  for (const slices of slicesByStart) slices.sort(compareSlicesByEventOrder)
  return slicesByStart
}

function compareSlicesByEventOrder<EventMeta>(
  a: Slice<EventMeta>,
  b: Slice<EventMeta>,
): number {
  return a.sourceSeg.orderIndex - b.sourceSeg.orderIndex ||
    Number(isPartialSlice(a)) - Number(isPartialSlice(b))
}

function isPartialSlice<EventMeta>(slice: Slice<EventMeta>): boolean {
  return slice.start !== slice.sourceSeg.start ||
    slice.end !== slice.sourceSeg.end
}

/** Merges strict lateral intersections and retains witness encounter order. */
export function groupLaterallyIntersecting<EventMeta>(
  hiddenSlices: readonly Slice<EventMeta>[],
): HiddenSliceGroup<EventMeta>[] {
  interface WorkingGroup extends LateralSpan {
    entries: { slice: Slice<EventMeta>; order: number }[]
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

function buildSliceRenderItems<EventMeta, HeightRef>(
  slicesByStart: readonly (readonly Slice<EventMeta>[])[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightMap: SliceHeightMap<HeightRef>,
): SliceRenderItem<EventMeta, HeightRef>[][] {
  return slicesByStart.map((slices) => slices.map((slice) => {
    const key = getSliceKey(slice)
    const levelCoord = sliceCoords.get(key)

    return {
      key,
      slice,
      style: {
        visibility: levelCoord == null ? 'hidden' : '',
        top: levelCoord,
      },
      heightRef: sliceHeightMap.createRef(key),
    }
  }))
}

export function buildLevelLimitedLayout<EventMeta, HeightRef>(
  props: LayoutProps<EventMeta>,
  options: LevelLimitedOptions,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  largestSliceHeight: number | undefined,
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
  const provisionalSliceHeight = largestSliceHeight ??
    DEFAULT_UNMEASURED_EVENT_THICKNESS
  const { sliceCoords } = resolveLevelCoords(
    sliceLevels,
    (slice) =>
      sliceHeightMap.current.get(getSliceKey(slice)) ?? provisionalSliceHeight,
  )
  const renderSlices = sliceLevels.flat()
  const slicesByStart = props.cells
    ? federateSlicesByStart(renderSlices, props.cells.length)
    : []

  return {
    sliceLevels,
    hiddenGroups,
    sliceCoords,
    slicesByStart,
    renderItems: buildSliceRenderItems(
      slicesByStart,
      sliceCoords,
      sliceHeightMap,
    ),
  }
}

export function buildPixelLimitedLayout<EventMeta, HeightRef>(
  props: LayoutProps<EventMeta>,
  options: PixelLimitedOptions,
  sliceHeightMap: SliceHeightMap<HeightRef>,
  canvasHeight: number | undefined,
  getRatchet: GetRatchet,
) {
  const {
    neededLevelCount,
    smallestSliceHeight,
    largestSliceHeight,
  } = getRatchet(canvasHeight)
  const provisionalSliceHeight = largestSliceHeight ??
    DEFAULT_UNMEASURED_EVENT_THICKNESS
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    neededLevelCount,
  )
  const domWholeSliceLevels = convertSegLevelsToWholeSlices(segLevels)
  const domExcludedSlices = convertSegsToWholeSlices(excludedSegs)
  const getPlanningSliceHeight = (slice: Slice<EventMeta>) =>
    sliceHeightMap.current.get(getSliceKey(slice)) ?? provisionalSliceHeight
  const wholeResolution = resolveLevelCoords(
    domWholeSliceLevels,
    getPlanningSliceHeight,
    canvasHeight,
  )
  const placementSliceLevels = wholeResolution.placementSliceLevels
  let sliceCoords = wholeResolution.sliceCoords
  let hiddenGroups = groupLaterallyIntersecting(domExcludedSlices)

  if (canvasHeight != null) {
    const extraSlices = sortByEventOrder(
      wholeResolution.excludedSlices.concat(domExcludedSlices),
    )
    hiddenGroups = mergeExtraIntoLevelCoords(
      placementSliceLevels,
      sliceCoords,
      extraSlices,
      options.eventOrderStrict,
      options.eventSlicing,
      canvasHeight,
      smallestSliceHeight ?? DEFAULT_UNMEASURED_EVENT_THICKNESS,
      provisionalSliceHeight,
    )
    ;({ sliceCoords } = resolveLevelCoords(
      placementSliceLevels,
      getPlanningSliceHeight,
    ))
  }

  const renderSlices = compilePixelLimitedRenderSlices(
    domWholeSliceLevels,
    placementSliceLevels,
  )
  const slicesByStart = federateSlicesByStart(
    renderSlices,
    props.cells.length,
  )

  return {
    domWholeSliceLevels,
    placementSliceLevels,
    hiddenGroups,
    sliceCoords,
    slicesByStart,
    renderItems: buildSliceRenderItems(
      slicesByStart,
      sliceCoords,
      sliceHeightMap,
    ),
  }
}

export function buildTimeGridLevelInputs<EventMeta>(
  props: Pick<LayoutProps<EventMeta>, 'segs'>,
  options: TimeGridLevelOptions,
) {
  const { segLevels, excludedSegs } = buildSegLevels(
    props.segs,
    options.eventOrderStrict,
    options.maxLevels,
  )
  return {
    pressureWebSegLevels: segLevels,
    globbedMoreLinkSegs: excludedSegs,
  }
}

interface MergeOptions {
  eventOrderStrict: boolean
  eventSlicing: boolean
  allowExtraWholePlacement: boolean
  sliceThickness: number
  occupantThickness: number
  isValid: (levelCoord: number, thickness: number) => boolean
}

interface Insertion<EventMeta> {
  levelIndex: number
  levelCoord: number
  isGeometricallyValid: boolean
  touchingSlice?: Slice<EventMeta>
  touchingOccupant?: MoreLinkOccupant
}

/** Shared fire/collide/peel/consume implementation for both currencies. */
function mergeExtraIntoStructure<EventMeta>(
  sliceLevels: Slice<EventMeta>[][],
  sliceCoords: Map<string, number>,
  extraSegSlices: readonly Slice<EventMeta>[],
  options: MergeOptions,
): HiddenSliceGroup<EventMeta>[] {
  let hiddenGroups: HiddenSliceGroup<EventMeta>[] = []
  let hiddenOrder = 0
  const hiddenOrders = new Map<Slice<EventMeta>, number>()

  const getSliceCoord = (slice: Slice<EventMeta>, levelIndex: number) =>
    sliceCoords.get(getSliceKey(slice)) ?? levelIndex

  const getSliceBottom = (slice: Slice<EventMeta>, levelIndex: number) =>
    getSliceCoord(slice, levelIndex) + options.sliceThickness

  function addHiddenRaw(slice: Slice<EventMeta>): HiddenSliceGroup<EventMeta> {
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

  function positionOccupants(): HiddenSliceGroup<EventMeta> | undefined {
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

  function consumeInvalidOccupants(): void {
    const refires: Slice<EventMeta>[] = []
    let invalidGroup: HiddenSliceGroup<EventMeta> | undefined

    while ((invalidGroup = positionOccupants())) {
      const anchor = invalidGroup.hiddenSlices[0]
      const colliders = collectIntersectingSlices(sliceLevels, invalidGroup)
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
        const activeGroup = hiddenGroups.find((group) =>
          group.hiddenSlices.includes(anchor),
        )!

        if (options.eventSlicing) {
          const footprint = intersectSlice(item.slice, activeGroup)
          if (footprint) {
            addHiddenRaw(footprint)
            refires.push(...peelSlice(item.slice, footprint))
          } else {
            insertSlice(
              sliceLevels,
              sliceCoords,
              item.slice,
              item.levelIndex,
              getSliceCoord(item.slice, item.levelIndex),
            )
          }
        } else {
          addHiddenRaw(item.slice)
        }
      }
    }

    positionOccupants()
    for (const slice of refires) fireSlice(slice)
  }

  function fireSlice(
    slice: Slice<EventMeta>,
    mayPlaceWhole: boolean = true,
  ): void {
    const insertion = findInsertion(
      sliceLevels,
      sliceCoords,
      hiddenGroups,
      slice,
      options,
    )

    if (
      insertion &&
      insertion.isGeometricallyValid &&
      (mayPlaceWhole || isPartialSlice(slice)) &&
      options.isValid(insertion.levelCoord, options.sliceThickness)
    ) {
      insertSlice(
        sliceLevels,
        sliceCoords,
        slice,
        insertion.levelIndex,
        insertion.levelCoord,
      )
      return
    }

    const barrier = insertion?.touchingSlice ?? insertion?.touchingOccupant
    if (options.eventSlicing && barrier) {
      const footprint = intersectSlice(slice, barrier)
      if (footprint) {
        addHiddenRaw(footprint)
        consumeInvalidOccupants()
        for (const remainder of peelSlice(slice, footprint)) fireSlice(remainder)
        return
      }
    }

    addHiddenRaw(slice)
    consumeInvalidOccupants()
  }

  for (const extra of extraSegSlices) {
    fireSlice(extra, options.allowExtraWholePlacement)
  }
  positionOccupants()
  return hiddenGroups
}

function findInsertion<EventMeta>(
  sliceLevels: readonly (readonly Slice<EventMeta>[])[],
  sliceCoords: ReadonlyMap<string, number>,
  hiddenGroups: readonly HiddenSliceGroup<EventMeta>[],
  slice: Slice<EventMeta>,
  options: MergeOptions,
): Insertion<EventMeta> | null {
  const collidersByLevel = sliceLevels.map((level) =>
    findIntersections(level, slice),
  )
  const getCoord = (other: Slice<EventMeta>, levelIndex: number) =>
    sliceCoords.get(getSliceKey(other)) ?? levelIndex
  const getBottom = (other: Slice<EventMeta>, levelIndex: number) =>
    getCoord(other, levelIndex) + options.sliceThickness
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
  let touchingSlice: Slice<EventMeta> | undefined
  for (let levelIndex = 0; levelIndex < sliceLevels.length; levelIndex++) {
    if (
      !collidersByLevel[levelIndex].length &&
      levelIndex >= strictMinLevelIndex &&
      levelIndex < strictMaxLevelIndexExclusive &&
      minLevelCoord + options.sliceThickness <=
        ceilings[levelIndex] + GEOMETRY_TOLERANCE
    ) {
      return {
        levelIndex,
        levelCoord: minLevelCoord,
        isGeometricallyValid: true,
        touchingSlice,
      }
    }

    for (const other of collidersByLevel[levelIndex]) {
      const bottom = getBottom(other, levelIndex)
      if (bottom > minLevelCoord) {
        minLevelCoord = bottom
        touchingSlice = other
      }
    }
  }

  if (sliceLevels.length >= strictMaxLevelIndexExclusive) {
    const touchingOccupant = occupantGroups
      .map((group) => group.occupant)
      .sort((a, b) => a.levelCoord! - b.levelCoord!)[0]
    if (touchingOccupant) {
      return {
        levelIndex: touchingOccupant.levelIndex!,
        levelCoord: touchingOccupant.levelCoord!,
        isGeometricallyValid: false,
        touchingOccupant,
      }
    }
    const strictBarrier = collidersByLevel
      .flat()
      .find((other) =>
        other.sourceSeg.orderIndex > slice.sourceSeg.orderIndex,
      )
    return strictBarrier
      ? {
        levelIndex: 0,
        levelCoord: minLevelCoord,
        isGeometricallyValid: false,
        touchingSlice: strictBarrier,
      }
      : null
  }

  return {
    levelIndex: sliceLevels.length,
    levelCoord: minLevelCoord,
    isGeometricallyValid: true,
    touchingSlice,
  }
}

function createWholeSlice<EventMeta>(
  sourceSeg: SourceSeg<EventMeta>,
): Slice<EventMeta> {
  return {
    sourceSeg,
    start: sourceSeg.start,
    end: sourceSeg.end,
    isStart: sourceSeg.isStart,
    isEnd: sourceSeg.isEnd,
  }
}

function intersectSlice<EventMeta>(
  slice: Slice<EventMeta>,
  barrier: LateralSpan,
): Slice<EventMeta> | null {
  const start = Math.max(slice.start, barrier.start)
  const end = Math.min(slice.end, barrier.end)
  return start < end ? createNarrowerSlice(slice, start, end) : null
}

function createNarrowerSlice<EventMeta>(
  parent: Slice<EventMeta>,
  start: number,
  end: number,
): Slice<EventMeta> {
  return {
    sourceSeg: parent.sourceSeg,
    start,
    end,
    isStart: parent.isStart && start === parent.start,
    isEnd: parent.isEnd && end === parent.end,
  }
}

function peelSlice<EventMeta>(
  slice: Slice<EventMeta>,
  barrier: LateralSpan,
): Slice<EventMeta>[] {
  const remainders: Slice<EventMeta>[] = []
  if (slice.start < barrier.start) {
    remainders.push(createNarrowerSlice(slice, slice.start, barrier.start))
  }
  if (slice.end > barrier.end) {
    remainders.push(createNarrowerSlice(slice, barrier.end, slice.end))
  }
  return remainders
}

function collectIntersectingSlices<EventMeta>(
  sliceLevels: readonly (readonly Slice<EventMeta>[])[],
  span: LateralSpan,
): { slice: Slice<EventMeta>; levelIndex: number }[] {
  return sliceLevels.flatMap((level, levelIndex) =>
    findIntersections(level, span).map((slice) => ({ slice, levelIndex })),
  )
}

function insertSlice<EventMeta>(
  sliceLevels: Slice<EventMeta>[][],
  sliceCoords: Map<string, number>,
  slice: Slice<EventMeta>,
  levelIndex: number,
  levelCoord: number,
): void {
  while (sliceLevels.length <= levelIndex) sliceLevels.push([])
  insertLaterally(sliceLevels[levelIndex], slice)
  sliceCoords.set(getSliceKey(slice), levelCoord)
}

function removeSlice<EventMeta>(
  sliceLevels: Slice<EventMeta>[][],
  sliceCoords: Map<string, number>,
  slice: Slice<EventMeta>,
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

function createPublicGroup<EventMeta>(
  hiddenSlices: Slice<EventMeta>[],
  start: number,
  end: number,
): HiddenSliceGroup<EventMeta> {
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
