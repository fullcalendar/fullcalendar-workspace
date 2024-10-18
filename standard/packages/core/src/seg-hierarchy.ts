import { EventRangeProps, EventRenderRange, getEventKey } from './component-util/event-rendering.js'
import { computeEarliestStart, CoordRange, doCoordRangesIntersect, getCoordRangeEnd, intersectCoordRanges, joinCoordRanges, SlicedCoordRange } from './coord-range.js'
import { buildIsoString } from './datelib/formatting-utils.js'

/*
for POTENTIAL insertion
*/
interface EventInsertion<R extends SlicedCoordRange> {
  // All segs witin a single "level" share the same levelCoord
  // As segs accumulate, new interstitial levels can be added
  // Thus, levelIndex might become stale
  levelIndex: number
  levelCoord: number

  // index WITHIN the level
  // -1 if requesting to create a new level at levelIndex with the new levelCoord
  lateralIndex: number

  // information about the EventCoordRange in the prior level this EventCoordRange is touching
  touchingLevelIndex: number // -1 if no touching
  touchingLateralIndex: number // -1 if no touching
  touchingPlacement: EventPlacement<R> | undefined // the last touching entry in the level

  // the max traversal depth through touching-seg chain in prior levels
  depth: number
}

/*
for INTERNAL storage and OUTPUT
QUESTION: won't depth change based on reslicing Fragments, which might make contact?
*/
export type EventPlacement<R extends SlicedCoordRange> = R & EventRangeProps & {
  key: string
  thickness: number
  depth: number // if isZombie, will be stale
  isExperiment: boolean // SHOULD be included in DOM, but as visibility:hidden and w/o levelCoord
  isZombie: boolean // should NOT be included in DOM, but internally occupying space
}

const THICKNESS_MIN = 10

export class SegHierarchy<R extends SlicedCoordRange> {
  // settings
  strictOrder: boolean = false
  allowFragments: boolean = false
  hiddenConsumes: boolean = false // hidden segs also hide the touchingPlacement?
  maxCoord: number = -1 // -1 means no max
  maxDepth: number = -1 // -1 means no max

  // internal storage
  placementsByLevel: EventPlacement<R>[][] = []
  levelCoords: number[] = [] // parallel with placementsByLevel
  hiddenSegs: (R & EventRangeProps)[] = []

  constructor(
    private getSegThickness = (segKey: string): number | undefined => {
      return 1
    },
  ) {}

  /*
  The `segs` input cannot have duplicate eventRanges
  Returns arrays in stable order, based on order of `segs`
  */
  insertSegs(segs: (R & EventRangeProps)[]): [
    placements: EventPlacement<R>[],
    segTops: Map<string, number>,
    hiddenSegs: (R & EventRangeProps)[],
  ] {
    const { placementsByLevel, levelCoords } = this
    const placementsByEventRange = new Map<EventRenderRange, EventPlacement<R>[]>()
    const hiddenSegsByEventRange = new Map<EventRenderRange, (R & EventRangeProps)[]>()
    const stablePlacements: EventPlacement<R>[] = []
    const stableHiddenSegs: (R & EventRangeProps)[] = []
    const segTops = new Map<string, number>()

    for (const seg of segs) {
      this.insertSeg(seg, /* isFragment = */ false)

      // prime the arrays, stay in-order
      placementsByEventRange.set(seg.eventRange, [])
      hiddenSegsByEventRange.set(seg.eventRange, [])
    }

    for (let i = 0; i < placementsByLevel.length; i++) {
      const levelCoord = levelCoords[i]

      for (const placedSeg of placementsByLevel[i]) {
        if (!placedSeg.isZombie) {
          placementsByEventRange.get(placedSeg.eventRange).push(placedSeg)

          if (!placedSeg.isExperiment) {
            segTops.set(placedSeg.key, levelCoord)
          }
        }
      }
    }

    for (const hiddenSeg of this.hiddenSegs) {
      hiddenSegsByEventRange.get(hiddenSeg.eventRange).push(hiddenSeg)
    }

    for (const eventRangePlacements of placementsByEventRange.values()) {
      stablePlacements.push(...eventRangePlacements)
    }

    for (const eventRangeHiddenSegs of hiddenSegsByEventRange.values()) {
      stableHiddenSegs.push(...eventRangeHiddenSegs)
    }

    return [stablePlacements, segTops, stableHiddenSegs]
  }

  private insertSeg(seg: R & EventRangeProps, isFragment: boolean): void {
    const segKey = getEventFragmentKey(seg, isFragment)
    const thicknessMaybe = this.getSegThickness(segKey)
    let thickness = Math.max(thicknessMaybe || 0, THICKNESS_MIN)
    let isExperiment = thicknessMaybe == null
    let insertion = this.findInsertion(seg, thickness)
    let isValid = this.isInsertionValid(insertion, thickness)

    if (!isExperiment && !isValid) {
      isExperiment = true
      insertion = this.findInsertion(seg, thickness = THICKNESS_MIN)
      isValid = this.isInsertionValid(insertion, thickness)
    }

    if (isValid) {
      this.insertSegAt({
        ...seg,
        key: segKey,
        thickness,
        depth: insertion.depth,
        isExperiment,
        isZombie: false,
      }, insertion)
    } else {
      const { touchingPlacement } = insertion

      if (this.allowFragments && touchingPlacement) {
        this.splitSeg(seg, touchingPlacement)
        seg = intersectCoordRanges(seg, touchingPlacement)
      }

      this.hiddenSegs.push(seg)

      if (this.hiddenConsumes && touchingPlacement && !touchingPlacement.isZombie) {
        if (this.allowFragments) {
          this.splitSeg(touchingPlacement, seg)
          Object.assign(touchingPlacement, intersectCoordRanges(touchingPlacement, seg)) // edit in-place
        }

        touchingPlacement.isZombie = true // edit in-place
        this.hiddenSegs.push(touchingPlacement)
      }
    }
  }

  private isInsertionValid(insertion: EventInsertion<R>, thickness: number): boolean {
    return (this.maxCoord === -1 || insertion.levelCoord + thickness <= this.maxCoord) &&
      (this.maxDepth === -1 || insertion.depth < this.maxDepth)
  }

  /*
  Does not add to hiddenSegs
  */
  private splitSeg(seg: R & EventRangeProps, barrier: CoordRange): void {
    // any leftover seg on the start-side of the barrier?
    if (seg.start < barrier.start) {
      this.insertSeg({ ...seg, end: barrier.start, isEnd: false }, /* isFragment = */ true)
    }

    // any leftover seg on the end-side of the barrier?
    if (seg.end > barrier.end) {
      this.insertSeg({ ...seg, start: barrier.end, isStart: false }, /* isFragment = */ true)
    }
  }

  private insertSegAt(placedSeg: EventPlacement<R>, insertion: EventInsertion<R>): void {
    if (insertion.lateralIndex === -1) {
      // create a new level
      insertAt(this.placementsByLevel, insertion.levelIndex, [placedSeg])
      insertAt(this.levelCoords, insertion.levelIndex, insertion.levelCoord)
    } else {
      // insert into existing level
      insertAt(this.placementsByLevel[insertion.levelIndex], insertion.lateralIndex, placedSeg)
    }
  }

  /*
  Ignores limits
  */
  findInsertion(newSeg: CoordRange, newEntryThickness: number): EventInsertion<R> {
    let { strictOrder, placementsByLevel, levelCoords } = this
    let levelCnt = placementsByLevel.length
    let candidateCoord = 0 // a tentative levelCoord for newSeg's placement
    let touchingLevelIndex: number = -1
    let touchingLateralIndex: number = -1
    let touchingPlacement: EventPlacement<R> | undefined
    let depth = 0

    // iterate through existing levels
    for (let currentLevelIndex = 0; currentLevelIndex < levelCnt; currentLevelIndex += 1) {
      const currentLevelCoord = levelCoords[currentLevelIndex]

      // if the current level has cleared newSeg's bottom coord, we have found a good empty space and can stop.
      // if strictOrder, keep finding more lateral intersections.
      if (!strictOrder && currentLevelCoord >= candidateCoord + newEntryThickness) {
        break
      }

      let currentLevelSegs = placementsByLevel[currentLevelIndex]
      let currentSeg: EventPlacement<R>

      // finds the first possible entry that newSeg could intersect with
      let [searchIndex, isExact] = binarySearch(currentLevelSegs, newSeg.start, getCoordRangeEnd) // find first entry after newSeg's end
      let lateralIndex = searchIndex + isExact // if exact match (which doesn't collide), go to next one

      // loop through entries that horizontally intersect
      while (
        (currentSeg = currentLevelSegs[lateralIndex]) && // but not past the whole entry list
        currentSeg.start < newSeg.end // and not entirely past newSeg
      ) {
        let currentEntryBottom = currentLevelCoord + currentSeg.thickness

        // intersects into the top of the candidate?
        if (currentEntryBottom > candidateCoord) {
          // push it downward so doesn't 'vertically' intersect anymore
          candidateCoord = currentEntryBottom

          // tentatively record as touching
          touchingPlacement = currentSeg
          touchingLevelIndex = currentLevelIndex
          touchingLateralIndex = lateralIndex
        }

        // does current entry butt up against top of candidate?
        // will obviously happen if just intersected, but can also happen if pushed down previously
        // because intersected with a sibling
        // TODO: after automated tests hooked up, see if these gate is unnecessary,
        // we might just be able to do this for ALL intersecting currentEntries (this whole loop)
        if (currentEntryBottom === candidateCoord) {
          // accumulate the highest possible depth of the currentLevelSegs that butt up
          depth = Math.max(depth, currentSeg.depth + 1)
        }

        lateralIndex += 1
      }
    }

    // the destination level will be after touchingPlacement's level. find it
    // TODO: can reuse work from above?
    let destLevelIndex = 0
    if (touchingPlacement) {
      destLevelIndex = touchingLevelIndex + 1
      while (destLevelIndex < levelCnt && levelCoords[destLevelIndex] < candidateCoord) {
        destLevelIndex += 1
      }
    }

    // if adding to an existing level, find where to insert
    // TODO: can reuse work from above?
    let destLateralIndex = -1
    if (destLevelIndex < levelCnt && levelCoords[destLevelIndex] === candidateCoord) {
      [destLateralIndex] = binarySearch(placementsByLevel[destLevelIndex], newSeg.end, getCoordRangeEnd)
    }

    return {
      touchingLevelIndex,
      touchingLateralIndex,
      touchingPlacement,
      levelCoord: candidateCoord,
      levelIndex: destLevelIndex,
      lateralIndex: destLateralIndex,
      depth,
    }
  }
}

function getEventFragmentKey(seg: SlicedCoordRange & EventRangeProps, isFragment: boolean): string {
  let key = getEventKey(seg)

  if (isFragment) {
    key += ':' + seg.start + ':' + seg.end
  }

  return key
}

// Grouping
// -------------------------------------------------------------------------------------------------

interface SegInternalGroup<R extends SlicedCoordRange> extends CoordRange {
  segs: (R & EventRangeProps)[]
}

export interface SegGroup<R extends SlicedCoordRange> extends SegInternalGroup<R> {
  key: string
}

/*
Returns groups with entries sorted by input order
*/
export function groupIntersectingSegs<R extends SlicedCoordRange>(segs: (R & EventRangeProps)[]): SegGroup<R>[] {
  let mergedGroups: SegInternalGroup<R>[] = []

  for (let seg of segs) {
    let filteredGroups: SegInternalGroup<R>[] = []
    let hungryGroup: SegInternalGroup<R> = { // the merge that will eat what it collides with
      segs: [seg],
      start: seg.start,
      end: seg.end,
    }

    for (let mergedGroup of mergedGroups) {
      if (doCoordRangesIntersect(mergedGroup, hungryGroup)) {
        hungryGroup = {
          ...joinCoordRanges(mergedGroup, hungryGroup),
          segs: mergedGroup.segs.concat(hungryGroup.segs) // keep preexisting mergedGroup's items first. maintains order
        }
      } else {
        filteredGroups.push(mergedGroup)
      }
    }

    filteredGroups.push(hungryGroup)
    mergedGroups = filteredGroups
  }

  return mergedGroups.map((mergedGroup) => {
    return {
      key: buildIsoString(computeEarliestStart(segs)),
      ...mergedGroup
    }
  })
}

// General Utils
// -------------------------------------------------------------------------------------------------

function insertAt<Item>(arr: Item[], index: number, item: Item) {
  arr.splice(index, 0, item)
}

export function binarySearch<Item>(
  a: Item[],
  searchVal: number,
  getItemVal: (item: Item) => number,
): [number, number] { // returns [level, isExactMatch ? 1 : 0]
  let startIndex = 0
  let endIndex = a.length // exclusive

  if (!endIndex || searchVal < getItemVal(a[startIndex])) { // no items OR before first item
    return [0, 0]
  }
  if (searchVal > getItemVal(a[endIndex - 1])) { // after last item
    return [endIndex, 0]
  }

  while (startIndex < endIndex) {
    let middleIndex = Math.floor(startIndex + (endIndex - startIndex) / 2)
    let middleVal = getItemVal(a[middleIndex])

    if (searchVal < middleVal) {
      endIndex = middleIndex
    } else if (searchVal > middleVal) {
      startIndex = middleIndex + 1
    } else { // equal!
      return [middleIndex, 1]
    }
  }

  return [startIndex, 0]
}
