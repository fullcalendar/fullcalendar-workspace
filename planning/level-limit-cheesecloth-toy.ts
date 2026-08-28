/**
 * Standalone logical-level toy. There are no pixels, measurements, imports,
 * strict-order rules, or rendering concerns in this file.
 */

/** Half-open lateral interval. The axis can be discrete or continuous. */
export interface Span {
  start: number
  end: number
}

export interface Seg extends Span {
  id: string
}

export interface Slice extends Seg {
  /** Stable source order shared by every partial cut from this slice. */
  orderIndex: number
}

export interface LimitedLayout {
  sliceLevels: Slice[][]
  /** Deliberately flat. Final product-specific grouping is a later concern. */
  hiddenSlices: Slice[]
  /** Normalized lateral territory where a bottom-fixed more link exists. */
  moreLinkSpans: Span[]
}

const MAX_SLICES_PER_PLAN = 3
const EXTRA_SLICE_PENALTY = 0.15

/** One hypothetical sliced insertion, confined to a single logical level. */
interface SlicePlan {
  levelIndex: number
  slices: Slice[]
  score: number
}

/** Builds unrestricted whole-slice levels in received event order. */
export function buildUnlimitedSliceLevels(
  segs: readonly Seg[],
): Slice[][] {
  const levels: Slice[][] = []

  segs.forEach((seg, orderIndex) => {
    const slice = { ...seg, orderIndex }
    let levelIndex = 0

    while (intersectsAny(levels[levelIndex] ?? [], slice)) {
      levelIndex++
    }
    if (!levels[levelIndex]) {
      levels[levelIndex] = []
    }
    insertLaterally(levels[levelIndex], slice)
  })

  return levels
}

/**
 * Retains `maxLevels` from an unrestricted structure and fires every later
 * slice back at those levels in source order.
 *
 * With slicing disabled, a failed slice hides whole. With slicing enabled,
 * every level independently offers its maximal free runs. The winning plan
 * balances exposed length against fragmentation and commits all its slices to
 * one level.
 *
 * Every hidden slice passes through accumulated hidden coverage (the
 * "cheesecloth"). Only newly covered runs reserve the bottom event level for
 * a more link. A slice already using that level is evicted; partial eviction
 * hides only the violating footprint and refires the victim's remainders.
 */
export function limitSliceLevels(
  unlimitedLevels: readonly (readonly Slice[])[],
  maxLevels: number,
  eventSlicing: boolean,
  moreLinkLevelTax: 0 | 1,
): LimitedLayout {
  if (!Number.isInteger(maxLevels) || maxLevels < 0) {
    throw new RangeError('maxLevels must be a nonnegative integer')
  }
  if (
    (moreLinkLevelTax !== 0 && moreLinkLevelTax !== 1) ||
    moreLinkLevelTax > maxLevels
  ) {
    throw new RangeError(
      'moreLinkLevelTax must be zero or one and cannot exceed maxLevels',
    )
  }

  const sliceLevels = Array.from(
    { length: maxLevels },
    (_, levelIndex) => (unlimitedLevels[levelIndex] ?? [])
      .map((slice) => ({ ...slice })),
  )
  // Truncating levels loses source order, so restore it before firing extras.
  const extras = unlimitedLevels
    .slice(maxLevels)
    .flat()
    .map((slice) => ({ ...slice }))
    .sort(compareSlices)

  // Hidden membership remains flat and may overlap. Coverage is its normalized
  // union and answers only which lateral territory has already fired a link.
  const hiddenSlices: Slice[] = []
  const hiddenCoverage: Span[] = []

  const work: Work[] = []

  pushFire(extras)

  // Depth-first work lets fresh hidden coverage reserve the bottom level
  // before the next unrelated extra gets a chance to insert.
  while (work.length) {
    const item = work.pop()!
    if (item.type === 'fire') {
      fire(item.slice)
    } else {
      fireMoreLink(item.span)
    }
  }

  return {
    sliceLevels,
    hiddenSlices,
    moreLinkSpans: hiddenCoverage,
  }

  /** Tries a whole insertion before considering scored same-level slices. */
  function fire(slice: Slice): void {
    const levelIndex = findInsertionLevel(slice)

    if (levelIndex !== null) {
      insertLaterally(sliceLevels[levelIndex], slice)
      return
    }
    if (!eventSlicing) {
      hide(slice)
      return
    }

    const plan = findBestSlicePlan(slice)
    if (!plan) {
      hide(slice)
      return
    }

    for (const visibleSlice of plan.slices) {
      insertLaterally(sliceLevels[plan.levelIndex], visibleSlice)
    }
    for (const hiddenSlice of subtractCoveredFromSlice(slice, plan.slices)) {
      hide(hiddenSlice)
    }
  }

  /** Returns the shallowest vacant level under the span's local event cap. */
  function findInsertionLevel(slice: Slice): number | null {
    const levelCount = maxLevels - Number(
      moreLinkLevelTax && intersectsAny(hiddenCoverage, slice),
    )

    for (let levelIndex = 0; levelIndex < levelCount; levelIndex++) {
      if (!intersectsAny(sliceLevels[levelIndex], slice)) {
        return levelIndex
      }
    }
    return null
  }

  /**
   * Scores the best one-, two-, or three-run insertion offered by each level.
   * Runs from different levels are deliberately never mixed into one plan.
   */
  function findBestSlicePlan(slice: Slice): SlicePlan | null {
    let selected: SlicePlan | null = null
    const sourceLength = getSpanLength(slice)

    for (let levelIndex = 0; levelIndex < maxLevels; levelIndex++) {
      // A level is already a sorted, collision-free set. Copy its geometry so
      // bottom-link coverage can be folded into the blockers without mutating
      // the actual level.
      const blockers: Span[] = sliceLevels[levelIndex].map(({ start, end }) => ({
        start,
        end,
      }))
      if (moreLinkLevelTax && levelIndex === maxLevels - 1) {
        for (const span of hiddenCoverage) {
          addToUnion(blockers, span)
        }
      }

      const runs = subtractCoveredFromSlice(slice, blockers)
        .sort((a, b) => getSpanLength(b) - getSpanLength(a) || a.start - b.start)
      let visibleLength = 0

      for (
        let sliceCount = 1;
        sliceCount <= Math.min(MAX_SLICES_PER_PLAN, runs.length);
        sliceCount++
      ) {
        visibleLength += getSpanLength(runs[sliceCount - 1])
        const candidate: SlicePlan = {
          levelIndex,
          slices: runs.slice(0, sliceCount).sort(compareSlices),
          score: visibleLength / sourceLength -
            EXTRA_SLICE_PENALTY * (sliceCount - 1),
        }
        if (isBetterSlicePlan(candidate, selected)) {
          selected = candidate
        }
      }
    }

    return selected
  }

  /** Adds hidden membership, but taxes only previously uncovered territory. */
  function hide(slice: Slice): void {
    hiddenSlices.push(slice)

    // Overlap with the cloth already has a link. Only the set difference is
    // fresh more-link territory, which can consist of several disjoint runs.
    const newMoreLinkSpans = subtractCovered(slice, hiddenCoverage)
    addToUnion(hiddenCoverage, slice)

    if (moreLinkLevelTax) {
      for (let i = newMoreLinkSpans.length - 1; i >= 0; i--) {
        work.push({ type: 'moreLink', span: newMoreLinkSpans[i] })
      }
    }
  }

  /**
   * Reserves the bottom logical level over fresh hidden coverage. Because the
   * tax is exactly one, only slices in `maxLevels - 1` can be displaced.
   */
  function fireMoreLink(span: Span): void {
    const taxedLevel = sliceLevels[maxLevels - 1]
    const points = collectBreakpoints(span, [taxedLevel], [])

    for (let i = 0; i < points.length - 1; i++) {
      const atom = { start: points[i], end: points[i + 1] }
      const victim = taxedLevel.find((slice) => intersects(slice, atom))
      if (!victim) {
        continue
      }

      // The victim leaves the level whole. Slicing decides whether only this
      // atom hides or the whole victim contributes more hidden coverage.
      remove(taxedLevel, victim)

      if (eventSlicing) {
        // The violating footprint joins the cloth; the outside pieces get
        // another opportunity to occupy unrelated lateral gaps.
        hide(intersection(victim, atom)!)
        pushFire(subtractCoveredFromSlice(victim, [atom]))
      } else {
        hide(victim)
      }
    }
  }

  /** Reversing preserves received order on the LIFO work stack. */
  function pushFire(slices: readonly Slice[]): void {
    for (let i = slices.length - 1; i >= 0; i--) {
      work.push({ type: 'fire', slice: slices[i] })
    }
  }
}

/** Work alternates between attempting slices and reserving bottom link space. */
type Work =
  | { type: 'fire'; slice: Slice }
  | { type: 'moreLink'; span: Span }

/** Every returned interval has one unchanging collision/link environment. */
function collectBreakpoints(
  span: Span,
  levels: readonly (readonly Slice[])[],
  extraSpans: readonly Span[],
): number[] {
  const points = new Set([span.start, span.end])
  const admit = (point: number) => {
    if (point > span.start && point < span.end) {
      points.add(point)
    }
  }

  for (const level of levels) {
    for (const slice of level) {
      if (intersects(slice, span)) {
        admit(slice.start)
        admit(slice.end)
      }
    }
  }
  for (const extra of extraSpans) {
    if (intersects(extra, span)) {
      admit(extra.start)
      admit(extra.end)
    }
  }

  return [...points].sort((a, b) => a - b)
}

/** Computes the cheesecloth set difference `span - covered`. */
function subtractCovered(span: Span, covered: readonly Span[]): Span[] {
  const result: Span[] = []
  let cursor = span.start

  for (const item of covered) {
    if (item.end <= cursor) {
      continue
    }
    if (item.start >= span.end) {
      break
    }
    if (item.start > cursor) {
      result.push({ start: cursor, end: Math.min(item.start, span.end) })
    }
    cursor = Math.max(cursor, item.end)
    if (cursor >= span.end) {
      break
    }
  }

  if (cursor < span.end) {
    result.push({ start: cursor, end: span.end })
  }
  return result
}

/** Subtracts normalized coverage while preserving the source slice's identity. */
function subtractCoveredFromSlice(
  slice: Slice,
  covered: readonly Span[],
): Slice[] {
  return subtractCovered(slice, covered)
    .map((span) => cut(slice, span.start, span.end))
}

/** Maintains a sorted union. Adjacency is merged because only coverage matters. */
function addToUnion(spans: Span[], addition: Span): void {
  const result: Span[] = []
  let pending = { ...addition }
  let inserted = false

  for (const span of spans) {
    if (span.end < pending.start) {
      result.push(span)
    } else if (pending.end < span.start) {
      if (!inserted) {
        result.push(pending)
        inserted = true
      }
      result.push(span)
    } else {
      pending = {
        start: Math.min(pending.start, span.start),
        end: Math.max(pending.end, span.end),
      }
    }
  }

  if (!inserted) {
    result.push(pending)
  }
  spans.splice(0, spans.length, ...result)
}

/** Cuts out the strict intersection while retaining source identity/order. */
function intersection(slice: Slice, span: Span): Slice | null {
  const start = Math.max(slice.start, span.start)
  const end = Math.min(slice.end, span.end)
  return start < end ? cut(slice, start, end) : null
}

/** Produces a narrower view of the same source slice. */
function cut(slice: Slice, start: number, end: number): Slice {
  return { ...slice, start, end }
}

/** Comparison: score, then less fragmentation, then the shallower level. */
function isBetterSlicePlan(
  candidate: SlicePlan,
  current: SlicePlan | null,
): boolean {
  if (!current || candidate.score > current.score) {
    return true
  }
  if (candidate.score < current.score) {
    return false
  }
  if (candidate.slices.length !== current.slices.length) {
    return candidate.slices.length < current.slices.length
  }
  return candidate.levelIndex < current.levelIndex
}

function intersectsAny(items: readonly Span[], span: Span): boolean {
  return items.some((item) => intersects(item, span))
}

/** Adjacency is not collision. */
function intersects(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end
}

function getSpanLength(span: Span): number {
  return span.end - span.start
}

/** Preserves increasing lateral-start order within a collision-free level. */
function insertLaterally(level: Slice[], slice: Slice): void {
  let index = 0
  while (index < level.length && level[index].start < slice.start) {
    index++
  }
  level.splice(index, 0, slice)
}

function remove(level: Slice[], slice: Slice): void {
  const index = level.indexOf(slice)
  if (index !== -1) {
    level.splice(index, 1)
  }
}

function compareSlices(a: Slice, b: Slice): number {
  return a.orderIndex - b.orderIndex || a.start - b.start || a.end - b.end
}
